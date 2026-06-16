import type { NewsArticle } from "./types";
import { isUsListedStockTicker } from "./usStockTickers";

const GENERIC_SYMBOLS = new Set([
  "MARKET",
  "SPX",
  "QQQ",
  "DJI",
  "OIL",
  "GOLD",
  "FED",
  "ENERGY",
  "TECH",
  "FINANCE",
  "MINING",
  "CRYPTO",
  "NASDAQ",
  "NYSE",
  "ASX",
]);

const SECTOR_LABELS = new Set([
  "TECH",
  "FINANCE",
  "ENERGY",
  "MINING",
  "CRYPTO",
  "HEALTH",
  "CONSUMER",
  "REAL ESTATE",
  "US MARKETS",
  "COMMODITIES",
  "MARKETS",
]);

type ChipKind = "stock" | "topic";

function articleContent(article: NewsArticle): string {
  return `${article.headline} ${article.subheading}`.toLowerCase();
}

/** Tag/topic must be supported by the story text — avoids unrelated tag bleed in chips. */
function tagSupportedByContent(article: NewsArticle, tag: string): boolean {
  const upper = tag.trim().toUpperCase();
  if (!upper || SECTOR_LABELS.has(upper)) return false;

  const text = articleContent(article);
  const lower = tag.toLowerCase();

  if (text.includes(lower)) return true;

  if (article.companyName && text.includes(article.companyName.toLowerCase())) {
    return upper === article.ticker?.trim().toUpperCase();
  }

  return false;
}

export function resolveFeedChip(
  article: NewsArticle,
  categoryTag: string
): { label: string; kind: ChipKind } {
  const ticker = article.ticker?.trim().toUpperCase() ?? "";

  if (ticker && !GENERIC_SYMBOLS.has(ticker) && isUsListedStockTicker(ticker)) {
    return { label: ticker, kind: "stock" };
  }

  if (ticker && !GENERIC_SYMBOLS.has(ticker) && tagSupportedByContent(article, ticker)) {
    return isUsListedStockTicker(ticker)
      ? { label: ticker, kind: "stock" }
      : { label: ticker, kind: "topic" };
  }

  for (const tag of article.tags) {
    const symbol = tag.trim().toUpperCase();
    if (!symbol || GENERIC_SYMBOLS.has(symbol) || SECTOR_LABELS.has(symbol)) {
      continue;
    }
    if (!tagSupportedByContent(article, symbol)) continue;

    if (isUsListedStockTicker(symbol)) {
      return { label: symbol, kind: "stock" };
    }
    return { label: symbol, kind: "topic" };
  }

  return { label: categoryTag, kind: "topic" };
}
