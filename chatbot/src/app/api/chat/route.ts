//   // import { NextRequest, NextResponse } from "next/server";
//   // import { detectIntent, getIntentInstruction } from "@/lib/intentDetector";
//   // import knowledge from "@/data/knowledge.json";

//   // const OLLAMA_URL = "http://localhost:11434/api/chat";

//   // // ✅ Use llama3.2 — faster and lighter than llama3
//   // // If you don't have it: ollama pull llama3.2
//   // // Fallback: change to "llama3" if llama3.2 not installed
//   // const MODEL = "llama3.2:1b";

//   // function retrieveContext(userMessage: string): string {
//   //   const q = userMessage.toLowerCase();
//   //   const parts: string[] = [];

//   //   for (const service of knowledge.services) {
//   //     if (q.includes(service.name.toLowerCase()) || q.includes("service") || q.includes("offer")) {
//   //       parts.push(`Service: ${service.name} — ${service.description}. Timeline: ${service.timeline}.`);
//   //     }
//   //   }

//   //   if (q.includes("price") || q.includes("cost") || q.includes("plan") || q.includes("how much") || q.includes("₹")) {
//   //     for (const plan of knowledge.pricing) {
//   //       if ("plan" in plan) {
//   //         parts.push(`Plan: ${plan.plan} — ${plan.price}. Includes: ${plan.includes?.join(", ")}.`);
//   //       }
//   //     }
//   //     parts.push("Annual plans: 20% discount.");
//   //   }

//   //   if (q.includes("process") || q.includes("how") || q.includes("start") || q.includes("begin") || q.includes("work")) {
//   //     parts.push(`Process: 1.Discovery call → 2.Proposal → 3.Design → 4.Build → 5.Launch → 6.Support.`);
//   //   }

//   //   if (q.includes("project") || q.includes("portfolio") || q.includes("example")) {
//   //     for (const p of knowledge.projects) {
//   //       parts.push(`Built: ${p.type} — ${p.description}`);
//   //     }
//   //   }

//   //   if (parts.length === 0) {
//   //     parts.push(
//   //       `MakeWithUs builds websites, web apps, and mobile apps for businesses. ` +
//   //       `Services: ${knowledge.services.map(s => s.name).join(", ")}. Pricing from ₹9/month.`
//   //     );
//   //   }

//   //   return parts.slice(0, 3).join("\n"); // max 3 context items — keeps prompt short = faster
//   // }

//   // const SYSTEM_PROMPT = `You are the AI assistant for MakeWithUs — a studio that builds websites and apps.

//   // RULES (follow strictly):
//   // 1. Reply in MAXIMUM 2 short sentences. Never more.
//   // 2. No bullet points. No asterisks. Plain text only.
//   // 3. Never say "I'm glad", "Great question", "Certainly", or any filler.
//   // 4. End with ONE short question to guide the user forward.
//   // 5. Only discuss MakeWithUs services, pricing, or the user's project needs.
//   // 6. Sound human and confident, not like a corporate bot.

//   // EXAMPLE:
//   // User: "Do you build apps?"
//   // AI: "Yes, we build iOS, Android, and web apps from scratch. Are you thinking of a mobile app or a web platform?"`;

//   // export async function POST(req: NextRequest) {
//   //   try {
//   //     const { messages } = await req.json();

//   //     if (!messages || !Array.isArray(messages) || messages.length === 0) {
//   //       return NextResponse.json({ error: "No messages received" }, { status: 400 });
//   //     }

//   //     const lastUser = [...messages].reverse().find((m: { role: string }) => m.role === "user");
//   //     if (!lastUser) return NextResponse.json({ error: "No user message" }, { status: 400 });

//   //     const intent           = detectIntent(lastUser.content);
//   //     const intentInstruction = getIntentInstruction(intent);
//   //     const context          = retrieveContext(lastUser.content);

//   //     const systemPrompt = `${SYSTEM_PROMPT}

//   // CONTEXT:
//   // ${context}

//   // USER INTENT: ${intent.toUpperCase()}
//   // ${intentInstruction}`;

//   //     const response = await fetch(OLLAMA_URL, {
//   //       method:  "POST",
//   //       headers: { "Content-Type": "application/json" },
//   //       body: JSON.stringify({
//   //         model:    MODEL,
//   //         messages: [
//   //           { role: "system", content: systemPrompt },
//   //           ...messages.slice(-8), // last 8 messages only — faster context
//   //         ],
//   //         stream: false,
//   //         options: {
//   //           temperature:  0.6,   // lower = more focused, faster
//   //           num_predict:  60,    // hard token cap — forces short answers
//   //           num_ctx:      2048,  // smaller context window = faster
//   //           top_p:        0.9,
//   //         },
//   //       }),
//   //     });

//   //     if (!response.ok) {
//   //       const text = await response.text();
//   //       console.error("Ollama error:", text);
//   //       return NextResponse.json(
//   //         { error: "Ollama error. Run: ollama serve && ollama pull llama3.2" },
//   //         { status: 503 }
//   //       );
//   //     }

//   //     const data  = await response.json();
//   //     const reply = data?.message?.content?.trim();

//   //     if (!reply) return NextResponse.json({ error: "Empty response from AI" }, { status: 500 });

//   //     return NextResponse.json({ reply, intent });

//   //   } catch (err: unknown) {
//   //     if (err instanceof Error && err.message.includes("ECONNREFUSED")) {
//   //       return NextResponse.json({ error: "Ollama not running. Run: ollama serve" }, { status: 503 });
//   //     }
//   //     console.error("Route error:", err);
//   //     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   //   }
//   // }

//   // import { NextRequest } from "next/server";
//   // import { detectIntent, getIntentInstruction } from "@/lib/intentDetector";
//   // import knowledge from "@/data/knowledge.json";

//   // // ✅ Free Gemini API — 15 req/min, 1500/day FREE
//   // // Get key: https://aistudio.google.com/app/apikey
//   // // Add to .env.local: GEMINI_API_KEY=AIza...
//   // const OPENROUTER_URL =
//   //   "https://openrouter.ai/api/v1/chat/completions";

//   // // ── Pull relevant context from knowledge.json ─────────────────────────────────
//   // function retrieveContext(userMessage: string): string {
//   //   const q     = userMessage.toLowerCase();
//   //   const parts: string[] = [];

//   //   for (const service of knowledge.services) {
//   //     if (
//   //       q.includes(service.name.toLowerCase()) ||
//   //       q.includes("service") ||
//   //       q.includes("offer")
//   //     ) {
//   //       parts.push(`Service: ${service.name} — ${service.description}`);
//   //     }
//   //   }

//   //   if (
//   //     q.includes("price") || q.includes("cost") || q.includes("plan") ||
//   //     q.includes("how much") || q.includes("₹")
//   //   ) {
//   //     for (const plan of knowledge.pricing) {
//   //       if ("plan" in plan) {
//   //         parts.push(
//   //           `Plan: ${plan.plan} — ${plan.price}. Includes: ${(plan.includes ?? []).join(", ")}.`
//   //         );
//   //       }
//   //     }
//   //     parts.push("Annual plans get 20% discount.");
//   //   }

//   //   if (
//   //     q.includes("process") || q.includes("how") ||
//   //     q.includes("start")   || q.includes("begin")
//   //   ) {
//   //     parts.push(
//   //       "Process: 1.Discovery → 2.Proposal → 3.Design → 4.Build → 5.Launch → 6.Support"
//   //     );
//   //   }

//   //   if (q.includes("project") || q.includes("portfolio") || q.includes("example")) {
//   //     for (const p of knowledge.projects) {
//   //       parts.push(`Built: ${p.type} — ${p.description}`);
//   //     }
//   //   }

//   //   if (parts.length === 0) {
//   //     parts.push(
//   //       `MakeWithUs builds websites, web apps & mobile apps. ` +
//   //       `Services: ${knowledge.services.map(s => s.name).join(", ")}. ` +
//   //       `Pricing from ₹50/month.`
//   //     );
//   //   }

//   //   return parts.slice(0, 2).join("\n");
//   // }

//   // const SYSTEM_PROMPT = `You are the AI assistant for MakeWithUs — a studio that builds websites and apps.

//   // RULES (follow strictly):
//   // 1. Reply in MAXIMUM 2 short sentences. Never more.
//   // 2. No bullet points. No asterisks. Plain text only.
//   // 3. Never say "I'm glad", "Great question", "Certainly", or any filler.
//   // 4. End with ONE short question to guide the user forward.
//   // 5. Only discuss MakeWithUs services, pricing, or the user's project needs.
//   // 6. Sound human and confident, not like a corporate bot.

//   // EXAMPLE:
//   // User: "Do you build apps?"
//   // AI: "Yes, we build iOS, Android, and web apps from scratch. Are you thinking of a mobile app or a web platform?"`;

//   // export async function POST(req: NextRequest) {
//   //   try {
//   //     const { messages } = await req.json();

//   //     if (!messages || !Array.isArray(messages) || messages.length === 0) {
//   //       return new Response(
//   //         JSON.stringify({ error: "No messages received" }),
//   //         { status: 400, headers: { "Content-Type": "application/json" } }
//   //       );
//   //     }

//   //     const lastUser = [...messages]
//   //       .reverse()
//   //       .find((m: { role: string }) => m.role === "user");

//   //     if (!lastUser) {
//   //       return new Response(
//   //         JSON.stringify({ error: "No user message" }),
//   //         { status: 400, headers: { "Content-Type": "application/json" } }
//   //       );
//   //     }

//   //     const intent            = detectIntent(lastUser.content);
//   //     const intentInstruction = getIntentInstruction(intent);
//   //     const context           = retrieveContext(lastUser.content);

//   //     const fullSystemPrompt = `${SYSTEM_PROMPT}\n\nCONTEXT:\n${context}\n\nUSER INTENT: ${intent.toUpperCase()}\n${intentInstruction}`;

//   //     // Convert chat history to Gemini format
//   //     // Gemini uses "user" and "model" roles
//   //     const geminiMessages = messages.slice(-8).map((m: { role: string; content: string }) => ({
//   //       role:  m.role === "assistant" ? "model" : "user",
//   //       parts: [{ text: m.content }],
//   //     }));

//   //     const apiKey = process.env.OPENROUTER_API_KEY;
//   //     if (!apiKey) {
//   //       return new Response(
//   //         JSON.stringify({ error: "GEMINI_API_KEY not set in .env.local" }),
//   //         { status: 500, headers: { "Content-Type": "application/json" } }
//   //       );
//   //     }

//   //     // Call Gemini streaming API
//   //    const geminiRes = await fetch(OPENROUTER_URL, {
//   //   method: "POST",

//   //   headers: {
//   //     "Content-Type": "application/json",
//   //     Authorization: `Bearer ${apiKey}`,
//   //   },

//   //   body: JSON.stringify({
//   //     model: "microsoft/phi-3-mini-128k-instruct:free",
//   //     messages: [
//   //       {
//   //         role: "system",
//   //         content: fullSystemPrompt,
//   //       },

//   //       ...messages.map(
//   //         (m: { role: string; content: string }) => ({
//   //           role:
//   //             m.role === "assistant"
//   //               ? "assistant"
//   //               : "user",

//   //           content: m.content,
//   //         })
//   //       ),
//   //     ],

//   //     stream: true,
//   //   }),
//   // });

//   //     if (!geminiRes.ok) {
//   //       const errText = await geminiRes.text();
//   //       console.error("Gemini API error:", errText);
//   //       return new Response(
//   //         JSON.stringify({ error: "Gemini API error: " + errText }),
//   //         { status: 502, headers: { "Content-Type": "application/json" } }
//   //       );
//   //     }

//   //     // ── Stream tokens back to the client ──────────────────────────────────────
//   //     const encoder = new TextEncoder();

//   //     const stream = new ReadableStream({
//   //       async start(controller) {
//   //         const reader  = geminiRes.body!.getReader();
// //   //         const decoder = new TextDecoder();
// //   //         let   buffer  = "";

// //   //         try {
// //   //           while (true) {
// //   //             const { done, value } = await reader.read();
// //   //             if (done) break;

// //   //             buffer += decoder.decode(value, { stream: true });

// //   //             // Gemini SSE sends lines like: "data: {...}"
// //   //             const lines = buffer.split("\n");
// //   //             buffer = lines.pop() ?? ""; // keep incomplete last line

// //   //             for (const line of lines) {
// //   //               const trimmed = line.trim();
// //   //               if (!trimmed.startsWith("data:")) continue;

// //   //               const jsonStr = trimmed.slice(5).trim();
// //   //               if (!jsonStr || jsonStr === "[DONE]") continue;

// //   //               try {
// //   //                 const parsed = JSON.parse(jsonStr);

// //   // const token =
// //   //   parsed?.choices?.[0]?.delta?.content ?? "";
// //   //                 if (token) {
// //   //                   controller.enqueue(
// //   //                     encoder.encode(
// //   //                       `data: ${JSON.stringify({ token, intent })}\n\n`
// //   //                     )
// //   //                   );
// //   //                 }

// //   //                 // Gemini signals completion via finishReason
// //   //                 if (parsed?.choices?.[0]?.finish_reason) {
// //   //   break;
// //   // }
// //   //               } catch {
// //   //                 // incomplete JSON chunk — skip
// //   //               }
// //   //             }
// //   //           }
// //   //         } catch (err) {
// //   //           console.error("Stream read error:", err);
// //   //         } finally {
// //   //           controller.enqueue(encoder.encode("data: [DONE]\n\n"));
// //   //           controller.close();
// //   //         }
// //   //       },
// //   //     });

// //   //     return new Response(stream, {
// //   //       headers: {
// //   //         "Content-Type":  "text/event-stream",
// //   //         "Cache-Control": "no-cache",
// //   //         "Connection":    "keep-alive",
// //   //         "X-Intent":      intent,
// //   //       },
// //   //     });

// //   //   } catch (err) {
// //   //     console.error("Route error:", err);
// //   //     return new Response(
// //   //       JSON.stringify({ error: "Internal server error" }),
// //   //       { status: 500, headers: { "Content-Type": "application/json" } }
// //   //     );
// //   //   }
// //   // }
// //   import { NextRequest } from "next/server";
// //   import { detectIntent, getIntentInstruction } from "@/lib/intentDetector";
// //   import knowledge from "@/data/knowledge.json";

// //   // ─────────────────────────────────────────────────────────────────────────────
// //   // Using OpenRouter API — supports many free models
// //   // Get FREE key at: https://openrouter.ai (free signup, no credit card)
// //   // Add to .env.local:
// //   //   OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxx
// //   //
// //   // Free models available:
// //   //   "openai/gpt-4o-mini"                       ← fast, smart (may need credits)
// //   //   "microsoft/phi-3-mini-128k-instruct:free"  ← completely free
// //   //   "meta-llama/llama-3.2-3b-instruct:free"    ← completely free, fast
// //   //   "google/gemma-2-9b-it:free"                ← completely free
// //   // ─────────────────────────────────────────────────────────────────────────────

// //   const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
// //   const MODEL = "openrouter/auto"; // ✅ 100% free

// //   // ── Context retrieval from knowledge.json ────────────────────────────────────
// //   function retrieveContext(userMessage: string): string {
// //     const q     = userMessage.toLowerCase();
// //     const parts: string[] = [];

// //     for (const service of knowledge.services) {
// //       if (
// //         q.includes(service.name.toLowerCase()) ||
// //         q.includes("service") ||
// //         q.includes("offer")
// //       ) {
// //         parts.push(`Service: ${service.name} — ${service.description}`);
// //       }
// //     }

// //     if (
// //       q.includes("price") || q.includes("cost") || q.includes("plan") ||
// //       q.includes("how much") || q.includes("₹")
// //     ) {
// //       for (const plan of knowledge.pricing) {
// //         if ("plan" in plan) {
// //           parts.push(
// //             `Plan: ${plan.plan} — ${plan.price}. Includes: ${(plan.includes ?? []).join(", ")}.`
// //           );
// //         }
// //       }
// //       parts.push("Annual plans get 20% discount.");
// //     }

// //     if (
// //       q.includes("process") || q.includes("how") ||
// //       q.includes("start")   || q.includes("begin")
// //     ) {
// //       parts.push(
// //         "Process: 1.Discovery → 2.Proposal → 3.Design → 4.Build → 5.Launch → 6.Support"
// //       );
// //     }

// //     if (q.includes("project") || q.includes("portfolio") || q.includes("example")) {
// //       for (const p of knowledge.projects) {
// //         parts.push(`Built: ${p.type} — ${p.description}`);
// //       }
// //     }

// //     if (parts.length === 0) {
// //       parts.push(
// //         `MakeWithUs builds websites, web apps & mobile apps. ` +
// //         `Services: ${knowledge.services.map(s => s.name).join(", ")}. ` +
// //         `Pricing from ₹50/month.`
// //       );
// //     }

// //     return parts.slice(0, 2).join("\n");
// //   }

// //   const SYSTEM_PROMPT = `You are the AI assistant for MakeWithUs — a studio that builds websites and apps.

// //   RULES (follow strictly):
// //   1. Reply in MAXIMUM 2 short sentences. Never more.
// //   2. No bullet points. No asterisks. Plain text only.
// //   3. Never say "I'm glad", "Great question", "Certainly", or any filler.
// //   4. End with ONE short question to guide the user forward.
// //   5. Only discuss MakeWithUs services, pricing, or the user's project needs.
// //   6. Sound human and confident, not like a corporate bot.

// //   EXAMPLE:
// //   User: "Do you build apps?"
// //   AI: "Yes, we build iOS, Android, and web apps from scratch. Are you thinking of a mobile app or a web platform?"`;

// //   export async function POST(req: NextRequest) {
// //     try {
// //       const { messages } = await req.json();

// //       if (!messages || !Array.isArray(messages) || messages.length === 0) {
// //         return new Response(
// //           JSON.stringify({ error: "No messages received" }),
// //           { status: 400, headers: { "Content-Type": "application/json" } }
// //         );
// //       }

// //       const lastUser = [...messages]
// //         .reverse()
// //         .find((m: { role: string }) => m.role === "user");

// //       if (!lastUser) {
// //         return new Response(
// //           JSON.stringify({ error: "No user message" }),
// //           { status: 400, headers: { "Content-Type": "application/json" } }
// //         );
// //       }

// //       const apiKey = process.env.OPENROUTER_API_KEY;
// //       if (!apiKey) {
// //         return new Response(
// //           JSON.stringify({ error: "❌ OPENROUTER_API_KEY not set in .env.local — get free key at openrouter.ai" }),
// //           { status: 500, headers: { "Content-Type": "application/json" } }
// //         );
// //       }

// //       const intent            = detectIntent(lastUser.content);
// //       const intentInstruction = getIntentInstruction(intent);
// //       const context           = retrieveContext(lastUser.content);
// //       const fullSystemPrompt  = `${SYSTEM_PROMPT}\n\nCONTEXT:\n${context}\n\nUSER INTENT: ${intent.toUpperCase()}\n${intentInstruction}`;

// //       // Build message array for OpenAI-compatible API
// //       const apiMessages = [
// //         { role: "system", content: fullSystemPrompt },
// //         ...messages.slice(-8).map((m: { role: string; content: string }) => ({
// //           role:    m.role === "assistant" ? "assistant" : "user",
// //           content: m.content,
// //         })),
// //       ];

// //       // ── Call OpenRouter streaming API ─────────────────────────────────────
// //       const apiRes = await fetch(OPENROUTER_URL, {
// //         method:  "POST",
// //         headers: {
// //           "Content-Type":  "application/json",
// //           "Authorization": `Bearer ${apiKey}`,
// //           "HTTP-Referer":  "https://makewithus.in",  // optional but recommended
// //           "X-Title":       "MakeWithUs AI Chat",      // optional
// //         },
// //         body: JSON.stringify({
// //           model:       MODEL,
// //           messages:    apiMessages,
// //           // stream:      true,
// //           stream: false,
// //           temperature: 0.6,
// //           max_tokens:  120,
// //         }),
// //       });

// //       if (!apiRes.ok) {
// //         let errBody = "";
// //         try { errBody = await apiRes.text(); } catch { /* ignore */ }

// //         // Friendly error messages
// //         let friendlyError = "AI service error. Please try again in a moment.";
// //         try {
// //           const parsed = JSON.parse(errBody);
// //           const code   = parsed?.error?.code || apiRes.status;
// //           if (code === 429) {
// //             friendlyError = "⏳ Rate limit reached. Please wait 30 seconds and try again.";
// //           } else if (code === 401 || code === 403) {
// //             friendlyError = "❌ Invalid API key. Check OPENROUTER_API_KEY in .env.local";
// //           } else if (code === 402) {
// //             friendlyError = "❌ No credits. Use a free model or add credits at openrouter.ai";
// //           }
// //         } catch { /* use default */ }

// //         console.error("[route] API error:", apiRes.status, errBody.slice(0, 300));
// //         return new Response(
// //           JSON.stringify({ error: friendlyError }),
// //           { status: 502, headers: { "Content-Type": "application/json" } }
// //         );
// //       }

// //       // ── Stream tokens back to ChatWidget ──────────────────────────────────
// //       const encoder = new TextEncoder();

// //       // const stream = new ReadableStream({
// //       //   async start(controller) {
// //       //     const reader  = apiRes.body!.getReader();
// //       //     const decoder = new TextDecoder();
// //       //     let   buffer  = "";

// //       //     try {
// //       //       while (true) {
// //       //         const { done, value } = await reader.read();
// //       //         if (done) break;

// //       //         buffer += decoder.decode(value, { stream: true });
// //       //         const lines = buffer.split("\n");
// //       //         buffer = lines.pop() ?? "";

// //       //         for (const line of lines) {
// //       //           const trimmed = line.trim();

// //       //           // Skip empty lines and non-data lines
// //       //           if (!trimmed || !trimmed.startsWith("data:")) continue;

// //       //           const jsonStr = trimmed.slice(5).trim();
// //       //           if (!jsonStr || jsonStr === "[DONE]") continue;

// //       //           try {
// //       //             const parsed = JSON.parse(jsonStr);
// //       //             const token  = parsed?.choices?.[0]?.delta?.content ?? "";

// //       //             if (token) {
// //       //               controller.enqueue(
// //       //                 encoder.encode(`data: ${JSON.stringify({ token, intent })}\n\n`)
// //       //               );
// //       //             }

// //       //             // Check if generation is complete
// //       //             if (parsed?.choices?.[0]?.finish_reason) {
// //       //               break;
// //       //             }
// //       //           } catch { /* incomplete JSON chunk — skip */ }
// //       //         }
// //       //       }
// //       //     } catch (err) {
// //       //       console.error("[route] Stream read error:", err);
// //       //     } finally {
// //       //       controller.enqueue(encoder.encode("data: [DONE]\n\n"));
// //       //       controller.close();
// //       //     }
// //       //   },
// //       // });

// //       // return new Response(stream, {
// //       //   headers: {
// //       //     "Content-Type":  "text/event-stream",
// //       //     "Cache-Control": "no-cache",
// //       //     "Connection":    "keep-alive",
// //       //     "X-Intent":      intent,
// //       //   },
// //       // });
// //       const data = await apiRes.json();

// // return Response.json({
// //   message: data.choices[0].message.content
// // });

// //     } catch (err) {
// //       console.error("[route] Unexpected error:", err);
// //       return new Response(
// //         JSON.stringify({ error: "Internal server error" }),
// //         { status: 500, headers: { "Content-Type": "application/json" } }
// //       );
// //     }
// //   }


// import { NextRequest } from "next/server";
// import { detectIntent, getIntentInstruction } from "@/lib/intentDetector";
// import knowledge from "@/data/knowledge.json";

// // ─────────────────────────────────────────────────────────────────────────────
// // FREE Gemini API — gemini-1.5-flash
// // 15 req/min · 1 million tokens/day · completely free
// // Get key → https://aistudio.google.com/app/apikey
// // Add to .env.local → GEMINI_API_KEY=AIza...
// // ─────────────────────────────────────────────────────────────────────────────
// const PRIMARY_MODEL  = "gemini-1.5-flash";
// const FALLBACK_MODEL = "gemini-1.5-flash-8b";

// function geminiURL(model: string) {
//   return `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`;
// }

// // ── Context retrieval ─────────────────────────────────────────────────────────
// function retrieveContext(userMessage: string): string {
//   const q     = userMessage.toLowerCase();
//   const parts: string[] = [];

//   for (const service of knowledge.services) {
//     if (
//       q.includes(service.name.toLowerCase()) ||
//       q.includes("service") ||
//       q.includes("offer")
//     ) {
//       parts.push(`Service: ${service.name} — ${service.description}`);
//     }
//   }

//   if (q.includes("price") || q.includes("cost") || q.includes("plan") ||
//       q.includes("how much") || q.includes("₹")) {
//     for (const plan of knowledge.pricing) {
//       if ("plan" in plan) {
//         parts.push(
//           `Plan: ${plan.plan} — ${plan.price}. Includes: ${(plan.includes ?? []).join(", ")}.`
//         );
//       }
//     }
//     parts.push("Annual plans get 20% discount.");
//   }

//   if (q.includes("process") || q.includes("how") ||
//       q.includes("start")   || q.includes("begin")) {
//     parts.push("Process: 1.Discovery → 2.Proposal → 3.Design → 4.Build → 5.Launch → 6.Support");
//   }

//   if (q.includes("project") || q.includes("portfolio") || q.includes("example")) {
//     for (const p of knowledge.projects) {
//       parts.push(`Built: ${p.type} — ${p.description}`);
//     }
//   }

//   if (parts.length === 0) {
//     parts.push(
//       `MakeWithUs builds websites, web apps & mobile apps. ` +
//       `Services: ${knowledge.services.map(s => s.name).join(", ")}. Pricing from ₹50/month.`
//     );
//   }

//   return parts.slice(0, 2).join("\n");
// }

// const SYSTEM_PROMPT = `You are the AI assistant for MakeWithUs — a studio that builds websites and apps.

// RULES (follow strictly):
// 1. Reply in MAXIMUM 2 short sentences. Never more.
// 2. No bullet points. No asterisks. Plain text only.
// 3. Never say "I'm glad", "Great question", "Certainly", or any filler.
// 4. End with ONE short question to guide the user forward.
// 5. Only discuss MakeWithUs services, pricing, or the user's project needs.
// 6. Sound human and confident, not like a corporate bot.

// EXAMPLE:
// User: "Do you build apps?"
// AI: "Yes, we build iOS, Android, and web apps from scratch. Are you thinking of a mobile app or a web platform?"`;

// // ── Call Gemini with a given model ────────────────────────────────────────────
// async function callGemini(
//   model:        string,
//   apiKey:       string,
//   systemPrompt: string,
//   messages:     { role: string; content: string }[]
// ): Promise<Response> {
//   const geminiMessages = messages.slice(-8).map(m => ({
//     role:  m.role === "assistant" ? "model" : "user",
//     parts: [{ text: m.content }],
//   }));

//   return fetch(`${geminiURL(model)}&key=${apiKey}`, {
//     method:  "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       system_instruction: { parts: [{ text: systemPrompt }] },
//       contents:           geminiMessages,
//       generationConfig: {
//         temperature:     0.6,
//         maxOutputTokens: 120,
//         topP:            0.85,
//       },
//     }),
//   });
// }

// // ── POST handler ──────────────────────────────────────────────────────────────
// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const { messages } = body;

//     if (!messages || !Array.isArray(messages) || messages.length === 0) {
//       return new Response(
//         JSON.stringify({ error: "No messages received" }),
//         { status: 400, headers: { "Content-Type": "application/json" } }
//       );
//     }

//     const lastUser = [...messages]
//       .reverse()
//       .find((m: { role: string }) => m.role === "user");

//     if (!lastUser) {
//       return new Response(
//         JSON.stringify({ error: "No user message" }),
//         { status: 400, headers: { "Content-Type": "application/json" } }
//       );
//     }

//     const apiKey = process.env.OPENROUTER_API_KEY;
//     if (!apiKey || apiKey.includes("XXXX")) {
//       return new Response(
//         JSON.stringify({ error: "❌ Add GEMINI_API_KEY to .env.local — get free key at aistudio.google.com/app/apikey" }),
//         { status: 500, headers: { "Content-Type": "application/json" } }
//       );
//     }

//     const intent            = detectIntent(lastUser.content);
//     const intentInstruction = getIntentInstruction(intent);
//     const context           = retrieveContext(lastUser.content);
//     const fullSystemPrompt  = `${SYSTEM_PROMPT}\n\nCONTEXT:\n${context}\n\nUSER INTENT: ${intent.toUpperCase()}\n${intentInstruction}`;

//     // Try primary model, fall back if rate-limited
//     let geminiRes = await callGemini(PRIMARY_MODEL, apiKey, fullSystemPrompt, messages);

//     if (geminiRes.status === 429) {
//       console.warn(`[route] ${PRIMARY_MODEL} rate limited → switching to ${FALLBACK_MODEL}`);
//       geminiRes = await callGemini(FALLBACK_MODEL, apiKey, fullSystemPrompt, messages);
//     }

//     if (!geminiRes.ok) {
//       let errBody = "";
//       try { errBody = await geminiRes.text(); } catch { /* ignore */ }

//       let friendlyError = "Gemini API error. Please try again in a moment.";
//       try {
//         const parsed = JSON.parse(errBody);
//         const code   = parsed?.error?.code;
//         if (code === 429) friendlyError = "⏳ Rate limit hit. Wait 30s and retry.";
//         if (code === 403) friendlyError = "❌ API key invalid. Check .env.local";
//         if (code === 400) friendlyError = "❌ Bad request — check your API key format.";
//       } catch { /* use default */ }

//       console.error("[route] Gemini error:", errBody);
//       return new Response(
//         JSON.stringify({ error: friendlyError }),
//         { status: 502, headers: { "Content-Type": "application/json" } }
//       );
//     }

//     // ── Stream tokens back to ChatWidget ──────────────────────────────────────
//     // ✅ FIX: This is SSE (text/event-stream), NOT JSON.
//     // ChatWidget must read this with a ReadableStream reader, NOT res.json().
//     // Each line looks like:  data: {"candidates":[{"content":{"parts":[{"text":"Hi"}]}}]}
//     // We parse each line, extract the text token, and re-emit as our own SSE format.
//     const encoder = new TextEncoder();

//     const stream = new ReadableStream({
//       async start(controller) {
//         const reader  = geminiRes.body!.getReader();
//         const decoder = new TextDecoder();
//         let   buffer  = "";

//         const send = (token: string) => {
//           controller.enqueue(
//             encoder.encode(`data: ${JSON.stringify({ token, intent })}\n\n`)
//           );
//         };

//         try {
//           while (true) {
//             const { done, value } = await reader.read();
//             if (done) break;

//             buffer += decoder.decode(value, { stream: true });

//             // Process complete lines only
//             const lines = buffer.split("\n");
//             buffer = lines.pop() ?? ""; // last incomplete line stays in buffer

//             for (const line of lines) {
//               const trimmed = line.trim();

//               // Skip empty lines and non-data lines
//               if (!trimmed.startsWith("data:")) continue;

//               const jsonStr = trimmed.slice(5).trim();
//               if (!jsonStr || jsonStr === "[DONE]") continue;

//               try {
//                 const parsed = JSON.parse(jsonStr);
//                 const token  = parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
//                 if (token) send(token);
//               } catch {
//                 // Incomplete JSON chunk — skip silently
//               }
//             }
//           }
//         } catch (err) {
//           console.error("[route] Stream read error:", err);
//         } finally {
//           // Always send DONE so client knows stream ended
//           controller.enqueue(encoder.encode("data: [DONE]\n\n"));
//           controller.close();
//         }
//       },
//     });

//     return new Response(stream, {
//       headers: {
//         "Content-Type":  "text/event-stream",
//         "Cache-Control": "no-cache",
//         "Connection":    "keep-alive",
//         "X-Intent":      intent,
//       },
//     });

//   } catch (err) {
//     console.error("[route] Unexpected error:", err);
//     return new Response(
//       JSON.stringify({ error: "Internal server error" }),
//       { status: 500, headers: { "Content-Type": "application/json" } }
//     );
//   }
// }


// import { NextRequest } from "next/server";
// import { detectIntent, getIntentInstruction } from "@/lib/intentDetector";
// import knowledge from "@/data/knowledge.json";

// const OPENROUTER_URL =
//   "https://openrouter.ai/api/v1/chat/completions";

// // FREE MODEL
// const MODEL = "meta-llama/llama-3.2-3b-instruct:free";

// // ── Context retrieval ─────────────────────────────────────────
// function retrieveContext(userMessage: string): string {
//   const q = userMessage.toLowerCase();
//   const parts: string[] = [];

//   for (const service of knowledge.services) {
//     if (
//       q.includes(service.name.toLowerCase()) ||
//       q.includes("service") ||
//       q.includes("offer")
//     ) {
//       parts.push(
//         `Service: ${service.name} — ${service.description}`
//       );
//     }
//   }

//   if (
//     q.includes("price") ||
//     q.includes("cost") ||
//     q.includes("plan") ||
//     q.includes("how much") ||
//     q.includes("₹")
//   ) {
//     for (const plan of knowledge.pricing) {
//       if ("plan" in plan) {
//         parts.push(
//           `Plan: ${plan.plan} — ${plan.price}. Includes: ${(plan.includes ?? []).join(", ")}.`
//         );
//       }
//     }

//     parts.push("Annual plans get 20% discount.");
//   }

//   if (
//     q.includes("process") ||
//     q.includes("how") ||
//     q.includes("start") ||
//     q.includes("begin")
//   ) {
//     parts.push(
//       "Process: 1.Discovery → 2.Proposal → 3.Design → 4.Build → 5.Launch → 6.Support"
//     );
//   }

//   if (
//     q.includes("project") ||
//     q.includes("portfolio") ||
//     q.includes("example")
//   ) {
//     for (const p of knowledge.projects) {
//       parts.push(`Built: ${p.type} — ${p.description}`);
//     }
//   }

//   if (parts.length === 0) {
//     parts.push(
//       `MakeWithUs builds websites, web apps & mobile apps. Services: ${knowledge.services
//         .map((s) => s.name)
//         .join(", ")}. Pricing from ₹50/month.`
//     );
//   }

//   return parts.slice(0, 2).join("\n");
// }

// const SYSTEM_PROMPT = `
// You are the AI assistant for MakeWithUs.

// RULES:
// 1. Maximum 2 short sentences.
// 2. No bullet points.
// 3. No filler text.
// 4. End with one short question.
// 5. Only discuss services, pricing, or project needs.
// `;

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const { messages } = body;

//     if (!messages || !Array.isArray(messages)) {
//       return Response.json(
//         { error: "No messages received" },
//         { status: 400 }
//       );
//     }

//     const lastUser = [...messages]
//       .reverse()
//       .find((m: { role: string }) => m.role === "user");

//     if (!lastUser) {
//       return Response.json(
//         { error: "No user message" },
//         { status: 400 }
//       );
//     }

//     const apiKey = process.env.OPENROUTER_API_KEY;

//     if (!apiKey) {
//       return Response.json(
//         {
//           error:
//             "OPENROUTER_API_KEY missing in .env.local",
//         },
//         { status: 500 }
//       );
//     }

//     const intent = detectIntent(lastUser.content);
//     const intentInstruction =
//       getIntentInstruction(intent);

//     const context = retrieveContext(
//       lastUser.content
//     );

//     const fullSystemPrompt = `
// ${SYSTEM_PROMPT}

// CONTEXT:
// ${context}

// USER INTENT:
// ${intent.toUpperCase()}

// ${intentInstruction}
// `;

//     const apiMessages = [
//       {
//         role: "system",
//         content: fullSystemPrompt,
//       },

//       ...messages.slice(-8).map(
//         (m: { role: string; content: string }) => ({
//           role:
//             m.role === "assistant"
//               ? "assistant"
//               : "user",
//           content: m.content,
//         })
//       ),
//     ];

//     const apiRes = await fetch(
//       OPENROUTER_URL,
//       {
//         method: "POST",

//         headers: {
//           "Content-Type": "application/json",

//           Authorization: `Bearer ${apiKey}`,

//           "HTTP-Referer":
//             "http://localhost:3000",

//           "X-Title": "MakeWithUs AI",
//         },

//         body: JSON.stringify({
//           model: MODEL,
//           messages: apiMessages,
//           stream: true,
//           temperature: 0.6,
//           max_tokens: 120,
//         }),
//       }
//     );

//     if (!apiRes.ok) {
//       const errText = await apiRes.text();

//       console.error(
//         "[route] OpenRouter error:",
//         errText
//       );

//       return Response.json(
//         {
//           error:
//             "OpenRouter API Error",
//         },
//         { status: 500 }
//       );
//     }

//     // ── STREAMING RESPONSE ─────────────────────────

//     const encoder = new TextEncoder();

//     const stream = new ReadableStream({
//       async start(controller) {
//         const reader =
//           apiRes.body!.getReader();

//         const decoder =
//           new TextDecoder();

//         let buffer = "";

//         try {
//           while (true) {
//             const { done, value } =
//               await reader.read();

//             if (done) break;

//             buffer += decoder.decode(
//               value,
//               { stream: true }
//             );

//             const lines =
//               buffer.split("\n");

//             buffer =
//               lines.pop() ?? "";

//             for (const line of lines) {
//               const trimmed =
//                 line.trim();

//               if (
//                 !trimmed.startsWith(
//                   "data:"
//                 )
//               )
//                 continue;

//               const jsonStr =
//                 trimmed
//                   .replace(
//                     /^data:\s*/,
//                     ""
//                   )
//                   .trim();

//               if (
//                 !jsonStr ||
//                 jsonStr === "[DONE]"
//               ) {
//                 continue;
//               }

//               try {
//                 const parsed =
//                   JSON.parse(jsonStr);

//                 const token =
//                   parsed?.choices?.[0]
//                     ?.delta?.content ?? "";

//                 if (token) {
//                   controller.enqueue(
//                     encoder.encode(
//                       `data: ${JSON.stringify({
//                         token,
//                         intent,
//                       })}\n\n`
//                     )
//                   );
//                 }
//               } catch {
//                 // skip invalid chunk
//               }
//             }
//           }
//         } catch (err) {
//           console.error(
//             "[route] Stream error:",
//             err
//           );
//         } finally {
//           controller.enqueue(
//             encoder.encode(
//               "data: [DONE]\n\n"
//             )
//           );

//           controller.close();
//         }
//       },
//     });

//     return new Response(stream, {
//       headers: {
//         "Content-Type":
//           "text/event-stream",

//         "Cache-Control":
//           "no-cache",

//         Connection:
//           "keep-alive",
//       },
//     });
//   } catch (err) {
//     console.error(
//       "[route] Unexpected error:",
//       err
//     );

//     return Response.json(
//       {
//         error:
//           "Internal server error",
//       },
//       { status: 500 }
//     );
//   }
// }


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
        `Service: ${service.name} — ${service.description}`
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