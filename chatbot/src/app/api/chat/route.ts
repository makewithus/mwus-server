import { NextRequest } from "next/server";
import { detectIntent, getIntentInstruction } from "@/lib/intentDetector";
import knowledge from "@/data/knowledge.json";

const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";

const MODEL = "openai/gpt-4o-mini";

// ── Context retrieval ─────────────────────────────────────────
function retrieveContext(userMessage: string): string {
  const q = userMessage.toLowerCase();
  const parts: string[] = [];

  // SERVICES
  for (const service of knowledge.services) {
    if (
      q.includes(service.name.toLowerCase()) ||
      q.includes("service") ||
      q.includes("offer")
    ) {
      let serviceText = `Service: ${service.name}`;

      // starting price
      if ("starting_price" in service) {
        serviceText += ` | Starting Price: ${JSON.stringify(
          service.starting_price
        )}`;
      }

      // pricing
      if ("pricing" in service) {
        serviceText += ` | Pricing: ${JSON.stringify(
          service.pricing
        )}`;
      }

      // includes
      if (
        "includes" in service &&
        Array.isArray(service.includes)
      ) {
        serviceText += ` | Includes: ${service.includes.join(
          ", "
        )}`;
      }

      // services_include
      if (
        "services_include" in service &&
        Array.isArray(service.services_include)
      ) {
        serviceText += ` | Services: ${service.services_include.join(
          ", "
        )}`;
      }

      parts.push(serviceText);
    }
  }

  // PRICING QUESTIONS
  if (
    q.includes("price") ||
    q.includes("cost") ||
    q.includes("pricing") ||
    q.includes("how much") ||
    q.includes("budget") ||
    q.includes("₹")
  ) {
    for (const service of knowledge.services) {
      let pricingText = `${service.name}: `;

      if ("starting_price" in service) {
        pricingText += JSON.stringify(
          service.starting_price
        );
      } else if ("pricing" in service) {
        pricingText += JSON.stringify(
          service.pricing
        );
      } else {
        pricingText += "Pricing available on request.";
      }

      parts.push(pricingText);
    }
  }

  // PROCESS
  if (
    q.includes("process") ||
    q.includes("how") ||
    q.includes("start") ||
    q.includes("begin")
  ) {
    const processText = knowledge.process
      .map((step) => `${step.step}. ${step.name}`)
      .join(" → ");

    parts.push(`Process: ${processText}`);
  }

  // PROJECTS / PORTFOLIO
  if (
    q.includes("project") ||
    q.includes("portfolio") ||
    q.includes("example") ||
    q.includes("work")
  ) {
    for (const p of knowledge.projects) {
      parts.push(
        `Project: ${p.name} (${p.type})`
      );
    }
  }

  // FAQS
  if (
    q.includes("refund") ||
    q.includes("startup") ||
    q.includes("design") ||
    q.includes("portfolio")
  ) {
    for (const faq of knowledge.faqs) {
      parts.push(`Q: ${faq.q} A: ${faq.a}`);
    }
  }

  // DEFAULT CONTEXT
  if (parts.length === 0) {
    parts.push(
      `${knowledge.company.name} helps businesses with website development, app development, UI/UX, SEO, and enterprise systems.`
    );

    parts.push(
      `Services: ${knowledge.services
        .map((s) => s.name)
        .join(", ")}`
    );
  }

  return parts.slice(0, 4).join("\n");
}

const SYSTEM_PROMPT = `
You are the AI assistant for MakeWithUs.

RULES:
1. Maximum 2 short sentences.
2. No bullet points.
3. No filler text.
4. End with one short question.
5. Only discuss services, pricing, process, or project needs.
6. Answer using company knowledge only.
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
      .find(
        (m: { role: string }) =>
          m.role === "user"
      );

    if (!lastUser) {
      return Response.json(
        { error: "No user message" },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return Response.json(
        {
          error:
            "OPENROUTER_API_KEY missing",
        },
        { status: 500 }
      );
    }

    const intent = detectIntent(
      lastUser.content
    );

    const intentInstruction =
      getIntentInstruction(intent);

    const context =
      retrieveContext(
        lastUser.content
      );

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

    const apiRes = await fetch(
      OPENROUTER_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization: `Bearer ${apiKey}`,

          "HTTP-Referer":
            "https://makewithus.in",

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

    if (!apiRes.ok) {
      const errText =
        await apiRes.text();

      console.error(
        "[route] OpenRouter error:",
        errText
      );

      return Response.json(
        { error: errText },
        { status: 500 }
      );
    }

    const data =
      await apiRes.json();

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