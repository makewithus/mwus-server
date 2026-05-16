
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
      return `
The user seems interested in working with MakeWithUs.

1. Understand what they want to build.
2. Ask relevant follow-up questions.
3. Offer WhatsApp connection.

End with:
"Would you like me to connect you directly with our team on WhatsApp?"
`;

    case "pricing":
      return `
The user is asking about pricing.

Use ONLY the pricing from knowledge.json.

Pricing:
- Static Website / Landing Page: Starts from ₹30,000 (International: $1,000)
- Application Development: Starts from ₹1,50,000
- UI/UX & Graphic Design: Starts from ₹25,000
- Enterprise Systems: Based on project scope
- SEO Services: Pricing depends on goals, competition, website size, and target audience.

Never mention Starter or Pro plans.

End with:
"Would you like an estimate based on your requirements?"
`;

    case "service":
      return `
The user is asking about a service.

IMPORTANT RULES:
- Use ONLY services found in knowledge.json.
- Never say a service is unavailable if it exists in knowledge.json.
- SEO Services ARE available.
- UI/UX Design IS available.
- Enterprise Systems ARE available.
- Website Development IS available.
- Application Development IS available.

If the user mentions SEO:
Explain SEO services and included features:
On-page SEO, Technical SEO, Speed Optimization, Keyword Research, Content Optimization, Google Indexing, Analytics.

Then ask ONE guiding question.

Example:
"Yes, we offer SEO Services. We help with on-page SEO, technical SEO, speed optimization, keyword research, and more. Are you targeting local SEO or international ranking?"
`;

    case "info":
    default:
      return `
The user wants general information.

Use ONLY information from knowledge.json.

Mention:
- Services
- Company approach
- Projects
- FAQs

Keep answers concise and helpful.

End with a follow-up question.
`;
  }
}