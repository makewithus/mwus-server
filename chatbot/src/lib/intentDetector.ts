export type Intent = "info" | "pricing" | "service" | "lead";

const INTENT_PATTERNS: Record<Intent, string[]> = {
    info: [
    "what is",
    "who are",
    "about",
    "tell me",
    "explain",
    "how does",
    "what do you do",
    "your company",
    "makewithus",
    "portfolio",
    "projects",
    "examples",
    "case study",
    "services"
  ],

  pricing: [
    "price",
    "cost",
    "how much",
    "pricing",
    "fee",
    "charge",
    "budget",
    "quote",
    "estimate",
    "₹",
    "$",
    "minimum budget",
    "payment",
    "website cost",
    "app cost",
    "seo pricing",
    "design cost"
  ],

  service: [
    "website",
    "web",
    "landing page",
    "app",
    "mobile app",
    "application",
    "design",
    "ui",
    "ux",
    "graphic design",
    "develop",
    "build",
    "create",
    "ecommerce",
    "shopify",
    "seo",
    "dashboard",
    "backend",
    "enterprise system"
  ],

  lead: [
    "get started",
    "start",
    "contact",
    "reach out",
    "hire",
    "work with",
    "interested",
    "book",
    "schedule",
    "call",
    "want to build",
    "need a website",
    "need an app",
    "let's work",
    "ready",
    "next step",
    "want a quote",
    "how do i begin"
  ]
};


export function detectIntent(message: string): Intent {
  const lower = message.toLowerCase();
  for (const keyword of INTENT_PATTERNS.lead) {
    if (lower.includes(keyword)) return "lead";
  }
  for (const keyword of INTENT_PATTERNS.pricing) {
    if (lower.includes(keyword)) return "pricing";
  }
  for (const keyword of INTENT_PATTERNS.service) {
    if (lower.includes(keyword)) return "service";
  }
  return "info";
}

export function getIntentInstruction(intent: Intent): string {
  switch (intent) {
    case "lead":
      return `The user seems ready to take action.
Summarize what you understand about their need in 1-2 lines.
Then say you can help them get started and ask for their name and what they need.
End with: "Want me to connect you directly with our team on WhatsApp?"`;
    case "pricing":
      return `The user is asking about pricing.
Give a clear, brief answer about our plans (Starter ₹9/month, Pro ₹49/month).
Mention the annual discount.
End with: "Which plan sounds right for you?" or "Want a custom quote?"`;
    case "service":
      return `The user is interested in a specific service.
Briefly confirm you offer it.
Then ask ONE guiding question to understand their need better.
Do NOT just list all features — guide them forward.`;
    case "info":
    default:
      return `The user wants general information.
Answer clearly and concisely.
End with a follow-up question to keep them engaged.`;
  }
}
