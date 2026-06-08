export interface PrivateCompanyProfile {
  fullName: string;
  founded: string;
  headquarters: string;
  ceo: string;
  description: string;
  valuation: string;
  milestones: string[];
  color: string;
}

/** Known private / non-listed companies — no public market data */
export const PRIVATE_TICKERS = new Set([
  "OPENAI",
  "SPACEX",
  "ANTHROPIC",
  "STRIPE",
  "KLARNA",
  "CHIME",
]);

const PRIVATE_COMPANY_PROFILES: Record<string, PrivateCompanyProfile> = {
  SPACEX: {
    fullName: "Space Exploration Technologies Corp.",
    founded: "2002",
    headquarters: "Hawthorne, California",
    ceo: "Elon Musk",
    description:
      "Designs, manufactures, and launches advanced rockets and spacecraft. Leads the commercial space industry with reusable launch vehicles and the Starlink satellite network.",
    valuation: "$350B",
    milestones: [
      "2008 — First privately developed liquid-fuel rocket to reach orbit",
      "2015 — First successful Falcon 9 booster landing",
      "2020 — First crewed mission to the ISS via Crew Dragon",
      "2023 — Starship completes first integrated flight test",
    ],
    color: "#374151",
  },
  OPENAI: {
    fullName: "OpenAI",
    founded: "2015",
    headquarters: "San Francisco, California",
    ceo: "Sam Altman",
    description:
      "AI research and deployment company behind ChatGPT and the GPT model family. Partners with Microsoft and drives the generative AI wave across enterprise and consumer products.",
    valuation: "$300B",
    milestones: [
      "2015 — Founded as an AI research lab",
      "2022 — ChatGPT reaches 100M users in two months",
      "2024 — GPT-4o multimodal model released",
      "2025 — Record $40B funding round closes",
    ],
    color: "#412991",
  },
  ANTHROPIC: {
    fullName: "Anthropic",
    founded: "2021",
    headquarters: "San Francisco, California",
    ceo: "Dario Amodei",
    description:
      "AI safety company developing Claude, a family of large language models. Focuses on constitutional AI and enterprise-grade assistants for coding, research, and analysis.",
    valuation: "$60B",
    milestones: [
      "2021 — Founded by former OpenAI researchers",
      "2023 — Claude 2 released to the public",
      "2024 — Claude 3 model family launches",
      "2025 — $3.5B Series E funding round",
    ],
    color: "#CC9B7A",
  },
  STRIPE: {
    fullName: "Stripe, Inc.",
    founded: "2010",
    headquarters: "San Francisco, California",
    ceo: "Patrick Collison",
    description:
      "Payment infrastructure platform for internet businesses. Powers checkout, billing, and financial operations for millions of companies worldwide.",
    valuation: "$70B",
    milestones: [
      "2010 — Founded by Patrick and John Collison",
      "2014 — Series C at $3.5B valuation",
      "2021 — Peak private valuation of $95B",
      "2023 — Expands embedded finance and treasury products",
    ],
    color: "#635BFF",
  },
  KLARNA: {
    fullName: "Klarna Bank AB",
    founded: "2005",
    headquarters: "Stockholm, Sweden",
    ceo: "Sebastian Siemiatkowski",
    description:
      "Buy-now-pay-later and shopping fintech serving 150M+ consumers globally. Pioneered flexible payments at checkout for major retailers and e-commerce brands.",
    valuation: "$15B",
    milestones: [
      "2005 — Founded in Stockholm, Sweden",
      "2017 — Becomes Europe's highest-valued fintech",
      "2021 — Peak valuation reaches $46B",
      "2024 — Returns to profitability ahead of IPO plans",
    ],
    color: "#FFB3C7",
  },
  CHIME: {
    fullName: "Chime Financial, Inc.",
    founded: "2013",
    headquarters: "San Francisco, California",
    ceo: "Chris Britt",
    description:
      "Neobank offering fee-free mobile banking, early direct deposit, and credit-building tools. One of the largest U.S. fintech neobanks by active account holders.",
    valuation: "$25B",
    milestones: [
      "2013 — Founded as an alternative to traditional banks",
      "2020 — Surpasses 8 million customers",
      "2021 — $25B valuation in funding round",
      "2024 — Secured Chime Card launches nationally",
    ],
    color: "#1EC677",
  },
};

export function isPrivateTicker(ticker: string): boolean {
  return PRIVATE_TICKERS.has(ticker.toUpperCase());
}

export function getPrivateCompanyProfile(
  ticker: string
): PrivateCompanyProfile | null {
  return PRIVATE_COMPANY_PROFILES[ticker.toUpperCase()] ?? null;
}
