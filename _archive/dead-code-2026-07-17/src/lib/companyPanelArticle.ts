import { getTickerMetaBySymbol } from "@/lib/tickerMap";
import type { NewsArticle } from "@/lib/types";

/** Minimal article stub so StockPanel can render a ticker-only company view. */
export function articleFromTicker(ticker: string): NewsArticle {
  const meta = getTickerMetaBySymbol(ticker);
  const now = new Date().toISOString();
  return {
    id: `explore-${ticker}`,
    headline: meta.companyName,
    subheading: "",
    body: "",
    imageUrl: "",
    market: meta.market,
    sector: meta.sector,
    ticker,
    companyName: meta.companyName,
    tags: meta.tags,
    publishedAt: now,
    sourceName: "",
    sourceId: null,
    sourceUrl: "",
    likes: 0,
    comments: 0,
    shares: 0,
  };
}
