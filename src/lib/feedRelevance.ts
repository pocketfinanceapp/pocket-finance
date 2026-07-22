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
  "walkout",
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
  "red carpet",
  "reality show",
] as const;

/**
 * Dry procedural wire/PR boilerplate — technically finance-adjacent (so it
 * doesn't trip DEPRIORITISE_KEYWORDS above), but low-substance enough that a
 * feed full of it reads as thin. Softly deprioritised rather than removed —
 * still real, sourced content some users may want.
 */
const LOW_SUBSTANCE_WIRE_PATTERNS = [
  "form 8.3",
  "rule 8.3",
  "opening position disclosure",
  "dealing disclosure",
  "definitive proxy",
  "proxy statement",
  "save the date",
  "conference call and webcast",
  "conference call invitation",
  "to host conference call",
  "to host earnings call",
  "to participate in conference",
  "investor conference schedule",
  "webcast information",
  "notice of annual general meeting",
  "notice of extraordinary general meeting",
] as const;

/**
 * Non-finance PR/marketing-industry press releases — a different category
 * from LOW_SUBSTANCE_WIRE_PATTERNS above (those are dry *finance* wire
 * boilerplate; these are marketing/advertising/PR trade content that isn't
 * about finance at all). Some low-quality aggregator sources republish this
 * kind of thing verbatim from marketing-industry wire feeds, and it can
 * still pick up a stray finance keyword (e.g. "investment", "market") and a
 * ticker mention from a sponsor logo, which was letting pieces like a
 * "Campaign Connect Indonesia" marketing-conference release through with a
 * real market tag despite having nothing to do with finance.
 */
const NON_FINANCE_PR_PATTERNS = [
  "marketing conference",
  "advertising conference",
  "advertising awards",
  "marketing awards",
  "creative awards",
  "media summit",
  "marketing summit",
  "advertising summit",
  "campaign connect",
  "influencer marketing",
  "digital marketing agency",
  "creative agency",
  "brand summit",
  "pr awards",
  "public relations awards",
] as const;

/**
 * Sources known to republish low-substance wire/PR content (marketing
 * releases, syndicated boilerplate) that Marketaux still tags with a real
 * ticker/market, letting it slip past the usual finance-relevance signals.
 * Soft penalty, not exclusion — a source can still occasionally carry a
 * genuine finance story.
 */
const LOW_QUALITY_AGGREGATOR_SOURCES = ["manilatimes"] as const;

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
    if (text.includes(keyword)) score -= 32;
  }

  for (const phrase of LOW_SUBSTANCE_WIRE_PATTERNS) {
    if (text.includes(phrase)) {
      score -= 22;
      break;
    }
  }

  for (const phrase of NON_FINANCE_PR_PATTERNS) {
    if (text.includes(phrase)) {
      score -= 35;
      break;
    }
  }

  if (LOW_QUALITY_AGGREGATOR_SOURCES.some((name) => sourceBlob.includes(name))) {
    score -= 15;
  }

  // Politics without market angle
  if (
    /\b(trump|biden|congress|senate|election|white house|parliament|pardon)\b/.test(
      text
    ) &&
    !/\b(market|stock|rate|tariff|trade|economy|gdp|inflation|fed|earnings|investor|shares|ipo)\b/.test(
      text
    )
  ) {
    score -= 30;
  }

  // Soft penalty when story lacks any finance signal at all
  const hasFinanceSignal =
    (ticker && !GENERIC_TICKERS.has(ticker)) ||
    FINANCE_KEYWORDS.some((keyword) => text.includes(keyword)) ||
    isGenuinelyCryptoRelated(article) ||
    article.market === "COMMODITIES";

  if (!hasFinanceSignal) {
    score -= 18;
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
