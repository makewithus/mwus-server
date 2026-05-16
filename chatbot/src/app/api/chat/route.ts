
import { NextRequest } from "next/server";
import { detectIntent, getIntentInstruction } from "@/lib/intentDetector";
import knowledge from "@/data/knowledge.json";

const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";

// WORKING FREE MODEL
const MODEL = "openai/gpt-4o-mini";

// ── Context retrieval ─────────────────────────────────────────
function retrieveContext(userMessage: string): string {
  const q = userMessage.toLowerCase();
  const parts: string[] = [];

  for (const service of knowledge.services) {
    if (
      q.includes(service.name.toLowerCase()) ||
      q.includes("service") ||
      q.includes("offer")
    ) {
      parts.push(
        `Service: ${service.name}`
      );
    }
  }

  if (
    q.includes("price") ||
    q.includes("cost") ||
    q.includes("plan") ||
    q.includes("how much") ||
    q.includes("₹")
  ) {
    for (const plan of knowledge.pricing) {
      if ("plan" in plan) {
        parts.push(
          `Plan: ${plan.plan} — ${plan.price}. Includes: ${(plan.includes ?? []).join(", ")}.`
        );
      }
    }

    parts.push("Annual plans get 20% discount.");
  }

  if (
    q.includes("process") ||
    q.includes("how") ||
    q.includes("start") ||
    q.includes("begin")
  ) {
    parts.push(
      "Process: 1.Discovery → 2.Proposal → 3.Design → 4.Build → 5.Launch → 6.Support"
    );
  }

  if (
    q.includes("project") ||
    q.includes("portfolio") ||
    q.includes("example")
  ) {
    for (const p of knowledge.projects) {
      parts.push(`Built: ${p.type} — ${p.description}`);
    }
  }

  if (parts.length === 0) {
    parts.push(
      `MakeWithUs builds websites, web apps & mobile apps. Services: ${knowledge.services
        .map((s) => s.name)
        .join(", ")}. Pricing from ₹50/month.`
    );
  }

  return parts.slice(0, 2).join("\n");
}

const SYSTEM_PROMPT = `
You are the AI assistant for MakeWithUs.

RULES:
1. Maximum 2 short sentences.
2. No bullet points.
3. No filler text.
4. End with one short question.
5. Only discuss services, pricing, or project needs.
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: "No messages received" },
        { status: 400 }
      );
    }

    const lastUser = [...messages]
      .reverse()
      .find((m: { role: string }) => m.role === "user");

    if (!lastUser) {
      return Response.json(
        { error: "No user message" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return Response.json(
        {
          error:
            "OPENROUTER_API_KEY missing in .env.local",
        },
        { status: 500 }
      );
    }

    const intent = detectIntent(lastUser.content);

    const intentInstruction =
      getIntentInstruction(intent);

    const context =
      retrieveContext(lastUser.content);

    const fullSystemPrompt = `
${SYSTEM_PROMPT}

CONTEXT:
${context}

USER INTENT:
${intent.toUpperCase()}

${intentInstruction}
`;

    const apiMessages = [
      {
        role: "system",
        content: fullSystemPrompt,
      },

      ...messages.slice(-8).map(
        (m: {
          role: string;
          content: string;
        }) => ({
          role:
            m.role === "assistant"
              ? "assistant"
              : "user",

          content: m.content,
        })
      ),
    ];

    // ── OPENROUTER API CALL ─────────────────────────

    const apiRes = await fetch(
      OPENROUTER_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization: `Bearer ${apiKey}`,

          "HTTP-Referer":
            "http://localhost:3000",

          "X-Title":
            "MakeWithUs AI",
        },

        body: JSON.stringify({
          model: MODEL,

          messages: apiMessages,

          stream: false,

          temperature: 0.6,

          max_tokens: 120,
        }),
      }
    );

    // ── HANDLE API ERRORS ─────────────────────────

    if (!apiRes.ok) {
      const errText =
        await apiRes.text();

      console.error(
        "[route] OpenRouter error:",
        errText
      );

      return Response.json(
        {
          error: errText,
        },
        { status: 500 }
      );
    }

    // ── NORMAL JSON RESPONSE ──────────────────────

    const data = await apiRes.json();

    const reply =
      data?.choices?.[0]?.message
        ?.content ||
      "No response generated.";

    return Response.json({
      reply,
      intent,
    });
  } catch (err: any) {
    console.error(
      "[route] Unexpected error:",
      err
    );

    return Response.json(
      {
        error:
          err?.message ||
          "Internal server error",
      },
      { status: 500 }
    );
  }
}