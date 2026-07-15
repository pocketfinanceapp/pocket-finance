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

export const LANDING_STOCK = {
  ticker: "NVDA",
  companyName: "NVIDIA Corporation",
  price: 131.38,
  change: 1.84,
  changePercent: 1.42,
  marketCap: "3.24T",
  peRatio: "35.2",
  revenue: "130.5B",
  color: "#76B900",
  chartPoints: [118, 121, 119, 124, 122, 127, 125, 129, 128, 131.38],
} as const;

export const LANDING_BROWSE = {
  tabs: ["Companies", "Markets", "Crypto"] as const,
  rows: {
    Companies: [
      { ticker: "AAPL", name: "Apple Inc.", color: "#4a4a4a" },
      { ticker: "MSFT", name: "Microsoft", color: "#00A4EF" },
      { ticker: "NVDA", name: "NVIDIA", color: "#76B900" },
      { ticker: "GOOGL", name: "Alphabet", color: "#4285F4" },
    ],
    Markets: [
      { ticker: "NASDAQ", name: "Nasdaq Composite", color: "#3B6EF5" },
      { ticker: "SPX", name: "S&P 500", color: "#00C6C6" },
      { ticker: "NIKKEI", name: "Nikkei 225", color: "#7BA3FF" },
    ],
    Crypto: [
      { ticker: "BTC", name: "Bitcoin", color: "#F7931A" },
      { ticker: "ETH", name: "Ethereum", color: "#627EEA" },
      { ticker: "SOL", name: "Solana", color: "#9945FF" },
    ],
  },
} as const;
