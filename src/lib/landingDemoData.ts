import type { NewsArticle } from "@/lib/types";
import type { PocketBriefing } from "@/lib/briefing";

const NOW = "2026-07-15T10:00:00.000Z";

function article(
  id: string,
  headline: string,
  ticker: string,
  companyName: string,
  subheading: string
): NewsArticle {
  return {
    id,
    headline,
    subheading,
    body: subheading,
    imageUrl: "",
    market: "NASDAQ",
    sector: "Technology",
    ticker,
    companyName,
    tags: [ticker, "AI"],
    publishedAt: NOW,
    sourceName: "Market Wire",
    sourceId: "market-wire",
    sourceUrl: "https://example.com/article",
    likes: 128,
    comments: 24,
    shares: 12,
  };
}

export const LANDING_FEED_ARTICLES: NewsArticle[] = [
  article(
    "landing-1",
    "AI chip demand drives semiconductor stocks higher",
    "SOXX",
    "iShares Semiconductor ETF",
    "Chipmakers rally as data-centre AI spending accelerates across the supply chain."
  ),
  article(
    "landing-2",
    "NVIDIA extends gains on data-centre demand outlook",
    "NVDA",
    "NVIDIA Corporation",
    "Investors weigh strong AI infrastructure orders against valuation concerns."
  ),
  article(
    "landing-3",
    "Bitcoin holds above key level as ETF inflows steady",
    "BTC",
    "Bitcoin",
    "Crypto markets stay firm while macro traders watch rate expectations."
  ),
];

export const LANDING_BRIEFING: PocketBriefing = {
  lede: "Semiconductor ETFs are leading tech as AI infrastructure spending stays hot — chipmakers are the clearest near-term beneficiaries.",
  sections: [
    {
      title: "What happened",
      paragraphs: [
        "SOXX and peer chip ETFs rose after fresh signals that hyperscaler capex plans remain elevated.",
        "Investors rotated back into semis after a brief pause in the prior session.",
      ],
    },
    {
      title: "Why it matters",
      paragraphs: [
        "Semiconductors sit at the centre of the AI trade — when demand holds, the whole tech complex tends to follow.",
      ],
    },
  ],
  takeaway:
    "Watch SOXX for breadth: broad ETF strength usually means the AI hardware cycle still has momentum.",
};

/**
 * Demo data for the swipe-right "About this company" panel — mirrors
 * BusinessInfoPanel's Wikidata/Wikipedia-sourced fields. No price, chart,
 * or financial data (that feature was retired); this is editorial company
 * background only.
 */
export const LANDING_COMPANY = {
  ticker: "NVDA",
  companyName: "NVIDIA Corporation",
  color: "#76B900",
  description:
    "American technology company known for designing graphics processing units and AI computing hardware.",
  founded: "1993",
  headquarters: "Santa Clara, California",
  industry: "Semiconductors",
} as const;

export const LANDING_SENTIMENT: readonly {
  ticker: string;
  name: string;
  color: string;
  sentiment: "bullish" | "neutral" | "bearish";
}[] = [
  { ticker: "NVDA", name: "NVIDIA", color: "#76B900", sentiment: "bullish" },
  { ticker: "AAPL", name: "Apple Inc.", color: "#4a4a4a", sentiment: "neutral" },
  { ticker: "MSFT", name: "Microsoft", color: "#00A4EF", sentiment: "bullish" },
  { ticker: "BTC", name: "Bitcoin", color: "#F7931A", sentiment: "bullish" },
] as const;

/**
 * Demo data for the Explore feature card — real trending tickers (sentiment,
 * not price) and regions, mirroring ExplorePage. Replaces the old
 * Companies/Markets/Crypto "Browse" tabs, which showed static fake prices.
 */
export const LANDING_EXPLORE = {
  tabs: ["Trending", "Regions"] as const,
  trending: LANDING_SENTIMENT,
  regions: [
    { code: "us", name: "United States" },
    { code: "au", name: "Australia" },
    { code: "gb", name: "United Kingdom" },
    { code: "jp", name: "Japan" },
  ],
} as const;
