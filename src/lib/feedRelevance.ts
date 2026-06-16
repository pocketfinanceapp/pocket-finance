import { isGenuinelyCryptoRelated } from "./feedCategory";
import type { NewsArticle } from "./types";
import { isUsListedStockTicker } from "./usStockTickers";

const GENERIC_TICKERS = new Set([
  "MARKET",
  "SPX",
  "QQQ",
  "DJI",
  "OIL",
  "GOLD",
  "FED",
]);

const FINANCE_SOURCES = [
  "reuters",
  "bloomberg",
  "cnbc",
  "wall street journal",
  "wsj",
  "financial times",
  "barron",
  "marketwatch",
  "yahoo finance",
  "seeking alpha",
  "afr",
  "australian financial review",
  "business insider",
  "investing.com",
  "coindesk",
  "cointelegraph",
] as const;

const FINANCE_KEYWORDS = [
  "earnings",
  "revenue",
  "profit",
  "loss",
  "guidance",
  "outlook",
  "forecast",
  "ipo",
  "merger",
  "acquisition",
  "takeover",
  "dividend",
  "buyback",
  "stock",
  "shares",
  "equity",
  "market",
  "nasdaq",
  "nyse",
  "asx",
  "s&p",
  "dow",
  "rally",
  "selloff",
  "surge",
  "plunge",
  "record high",
  "record low",
  "fed",
  "federal reserve",
  "central bank",
  "interest rate",
  "rate cut",
  "rate hike",
  "inflation",
  "cpi",
  "gdp",
  "jobs report",
  "bond",
  "yield",
  "treasury",
  "commodity",
  "crude",
  "oil",
  "gold",
  "iron ore",
  "copper",
  "bitcoin",
  "ethereum",
  "crypto",
  "blockchain",
  "etf",
  "macro",
  "monetary policy",
  "fiscal",
  "quarterly",
  "annual results",
  "financial results",
  "balance sheet",
  "valuation",
  "analyst",
  "price target",
  "upgrade",
  "downgrade",
] as const;

const DEPRIORITISE_KEYWORDS = [
  "pardon",
  "graduation",
  "graduates",
  "campus",
  "university protest",
  "celebrity",
  "murder",
  "killed",
  "shooting",
  "crime",
  "accident",
  "emergency landing",
  "private jet",
  "plane crash",
  "wedding",
  "divorce",
  "reality tv",
  "fashion week",
  "sports",
  "world cup",
  "olympics",
  "movie",
  "album release",
  "tiktok trend",
  "influencer",
  "restaurant review",
  "travel guide",
  "weather forecast",
  "wildfire evacuation",
  "earthquake",
  "flood",
] as const;

function articleBlob(article: NewsArticle): string {
  return [
    article.headline,
    article.subheading,
    article.body.slice(0, 400),
    article.ticker,
    article.companyName,
    article.sector,
    article.market,
    article.sourceName,
    ...article.tags,
  ]
    .join(" ")
    .toLowerCase();
}

/** Higher = more finance-relevant for feed ranking. */
export function computeFinanceRelevanceScore(article: NewsArticle): number {
  let score = 0;
  const text = articleBlob(article);
  const sourceBlob = `${article.sourceName} ${article.sourceId ?? ""}`.toLowerCase();

  if (FINANCE_SOURCES.some((name) => sourceBlob.includes(name))) {
    score += 18;
  }

  const ticker = article.ticker?.trim().toUpperCase() ?? "";
  if (ticker && !GENERIC_TICKERS.has(ticker)) {
    score += isUsListedStockTicker(ticker) ? 22 : 14;
  }

  if (article.market !== "US MARKETS") {
    score += 8;
  }

  if (
    article.sector === "Finance" ||
    article.sector === "Crypto" ||
    article.sector === "Energy" ||
    article.sector === "Mining"
  ) {
    score += 10;
  }

  if (isGenuinelyCryptoRelated(article)) score += 12;
  if (article.market === "COMMODITIES") score += 12;

  for (const keyword of FINANCE_KEYWORDS) {
    if (text.includes(keyword)) score += 4;
  }

  for (const keyword of DEPRIORITISE_KEYWORDS) {
    if (text.includes(keyword)) score -= 28;
  }

  // Politics without market angle
  if (
    /\b(trump|biden|congress|senate|election|white house|parliament)\b/.test(
      text
    ) &&
    !/\b(market|stock|rate|tariff|trade|economy|gdp|inflation|fed|earnings)\b/.test(
      text
    )
  ) {
    score -= 20;
  }

  return score;
}

/** Stable finance-first ordering — deprioritises general news, keeps all articles. */
export function rankByFinanceRelevance(
  articles: NewsArticle[]
): NewsArticle[] {
  return [...articles].sort((a, b) => {
    const scoreDiff =
      computeFinanceRelevanceScore(b) - computeFinanceRelevanceScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    return (
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  });
}
