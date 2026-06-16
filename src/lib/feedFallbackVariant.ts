import { isGenuinelyCryptoRelated } from "./feedCategory";
import type { NewsArticle } from "./types";

export type FeedFallbackVariant =
  | "crypto"
  | "mining"
  | "energy"
  | "finance"
  | "tech"
  | "markets";

const CRYPTO_TICKERS = new Set(["BTC", "ETH", "COIN", "SOL", "XRP", "DOGE"]);
const MINING_TICKERS = new Set(["BHP", "RIO", "FMG", "VALE", "RIO.L"]);
const ENERGY_TICKERS = new Set(["XOM", "CVX", "COP", "SLB", "OXY", "BP"]);
const FINANCE_TICKERS = new Set([
  "JPM",
  "BAC",
  "GS",
  "MS",
  "WFC",
  "C",
  "BLK",
  "SCHW",
]);
const TECH_TICKERS = new Set([
  "NVDA",
  "AAPL",
  "MSFT",
  "GOOGL",
  "GOOG",
  "META",
  "AMD",
  "INTC",
  "AVGO",
  "TSM",
  "AMZN",
]);

const MINING_KEYWORDS = [
  "mining",
  "iron ore",
  "copper",
  "lithium",
  "bhp",
  "rio tinto",
  "fortescue",
  "materials",
  "metals",
  "asx",
] as const;

const ENERGY_KEYWORDS = [
  "oil",
  "crude",
  "natural gas",
  "energy",
  "petroleum",
  "refinery",
  "opec",
  "barrel",
] as const;

const FINANCE_KEYWORDS = [
  "bank",
  "banking",
  "interest rate",
  "rate cut",
  "rate hike",
  "bond",
  "yield",
  "treasury",
  "fed",
  "central bank",
  "monetary",
  "financials",
  "lending",
  "mortgage",
] as const;

const TECH_KEYWORDS = [
  "artificial intelligence",
  " ai ",
  "semiconductor",
  "chip",
  "cloud",
  "software",
  "nvidia",
  "tech stock",
] as const;

function blob(article: NewsArticle): string {
  return [
    article.headline,
    article.subheading,
    article.ticker,
    article.sector,
    article.market,
    ...article.tags,
  ]
    .join(" ")
    .toLowerCase();
}

function tickerUpper(article: NewsArticle): string {
  return article.ticker?.trim().toUpperCase() ?? "";
}

/** Pick a category-specific fallback visual when no usable hero image. */
export function resolveFeedFallbackVariant(
  article: NewsArticle
): FeedFallbackVariant {
  const ticker = tickerUpper(article);
  const text = blob(article);
  const tags = article.tags.map((t) => t.toUpperCase());

  if (
    article.sector === "Crypto" ||
    isGenuinelyCryptoRelated(article) ||
    CRYPTO_TICKERS.has(ticker) ||
    tags.some((t) => CRYPTO_TICKERS.has(t))
  ) {
    return "crypto";
  }

  if (
    article.sector === "Mining" ||
    article.market === "ASX" ||
    MINING_TICKERS.has(ticker) ||
    tags.some((t) => MINING_TICKERS.has(t)) ||
    MINING_KEYWORDS.some((k) => text.includes(k))
  ) {
    return "mining";
  }

  if (
    article.sector === "Energy" ||
    article.market === "COMMODITIES" ||
    ENERGY_TICKERS.has(ticker) ||
    tags.some((t) => ENERGY_TICKERS.has(t)) ||
    ENERGY_KEYWORDS.some((k) => text.includes(k))
  ) {
    return "energy";
  }

  if (
    article.sector === "Finance" ||
    FINANCE_TICKERS.has(ticker) ||
    tags.some((t) => FINANCE_TICKERS.has(t)) ||
    FINANCE_KEYWORDS.some((k) => text.includes(k))
  ) {
    return "finance";
  }

  if (
    article.sector === "Technology" ||
    tags.includes("AI") ||
    TECH_TICKERS.has(ticker) ||
    tags.some((t) => TECH_TICKERS.has(t)) ||
    TECH_KEYWORDS.some((k) => text.includes(k))
  ) {
    return "tech";
  }

  return "markets";
}
