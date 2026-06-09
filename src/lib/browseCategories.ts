import type { NewsArticle } from "./types";

export const BROWSE_CATEGORIES = [
  "Markets",
  "Technology",
  "Economy",
  "Crypto",
  "Energy",
  "Healthcare",
  "Real Estate",
  "Banking",
  "Commodities",
  "World Markets",
] as const;

export type BrowseCategory = (typeof BROWSE_CATEGORIES)[number];

export const BROWSE_CATEGORY_KEYWORDS: Record<BrowseCategory, string[]> = {
  Markets: ["stocks", "market", "trading", "equities", "s&p", "nasdaq", "dow"],
  Technology: ["technology", "software", "semiconductor", "tech", "chip", "ai"],
  Economy: [
    "economy",
    "gdp",
    "inflation",
    "interest rate",
    "fed",
    "federal reserve",
    "recession",
    "employment",
    "jobs",
    "unemployment",
    "trade",
    "tariff",
    "deficit",
    "debt",
    "fiscal",
    "monetary",
    "central bank",
    "rate cut",
    "rate hike",
    "cpi",
    "ppi",
    "economic",
  ],
  Crypto: ["bitcoin", "crypto", "blockchain", "ethereum", "digital asset"],
  Energy: ["energy", "oil", "gas", "renewable", "solar", "wind power"],
  Healthcare: ["health", "pharma", "biotech", "drug", "hospital", "medical"],
  "Real Estate": [
    "property",
    "housing",
    "reit",
    "rent",
    "mortgage",
    "construction",
    "commercial property",
    "residential",
    "real estate",
  ],
  Banking: [
    "bank",
    "finance",
    "fed",
    "interest rate",
    "lending",
    "mortgage",
    "credit",
    "deposit",
    "loan",
    "central bank",
    "jpmorgan",
    "goldman",
    "wells fargo",
    "citigroup",
    "hsbc",
  ],
  Commodities: [
    "oil",
    "gold",
    "silver",
    "copper",
    "wheat",
    "corn",
    "iron ore",
    "natural gas",
    "crude",
    "brent",
    "wti",
    "commodity",
    "commodities",
    "raw materials",
    "metals",
    "lithium",
    "coal",
    "lng",
  ],
  "World Markets": [
    "international",
    "global",
    "europe",
    "asia",
    "emerging",
    "foreign",
    "world",
    "japan",
    "china",
    "uk",
  ],
};

export function categoryToSlug(category: BrowseCategory): string {
  return category.toLowerCase().replace(/\s+/g, "-");
}

export function categoryFromSlug(slug: string): BrowseCategory | null {
  const normalized = slug.toLowerCase().replace(/-/g, " ");
  const match = BROWSE_CATEGORIES.find(
    (c) => c.toLowerCase() === normalized || categoryToSlug(c) === slug.toLowerCase()
  );
  return match ?? null;
}

export function articleMatchesBrowseCategory(
  article: NewsArticle,
  category: BrowseCategory
): boolean {
  const keywords = BROWSE_CATEGORY_KEYWORDS[category];
  const text = [
    article.headline,
    article.subheading,
    article.body,
    ...article.tags,
    article.ticker,
    article.sector,
  ]
    .join(" ")
    .toLowerCase();

  return keywords.some((keyword) => text.includes(keyword));
}

export function filterArticlesByBrowseCategory(
  articles: NewsArticle[],
  category: BrowseCategory
): NewsArticle[] {
  return articles.filter((a) => articleMatchesBrowseCategory(a, category));
}
