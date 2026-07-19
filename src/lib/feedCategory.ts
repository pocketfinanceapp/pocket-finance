import type { NewsArticle, Sector } from "./types";

const SECTOR_TAGS: Record<Sector, string> = {
  Technology: "TECH",
  Finance: "FINANCE",
  Energy: "ENERGY",
  Mining: "MINING",
  Healthcare: "HEALTH",
  Consumer: "CONSUMER",
  Crypto: "CRYPTO",
  "Real Estate": "REAL ESTATE",
};

const EXCHANGE_TAGS = new Set([
  "NASDAQ",
  "NYSE",
  "ASX",
  "LSE",
  "Nikkei",
  "HKEX",
  "TSX",
  "Euronext",
  // Added alongside the suffix/index-ticker market resolution fix — without
  // these, any article resolving to one of these (correct) exchanges just
  // silently fell back to a generic sector tag ("FINANCE", "TECH", etc.)
  // instead of showing the real market on the feed card.
  "SGX",
  "BSE",
  "SSE",
  "KRX",
  "TWSE",
  "XETRA",
  "SIX",
  "B3",
  "BMV",
  "TADAWUL",
  "JAPAN",
  "HONG KONG",
  "AUSTRALIA",
  "EUROPE",
]);

const CRYPTO_TICKERS = new Set(["BTC", "ETH", "COIN"]);

const CRYPTO_KEYWORDS = [
  "bitcoin",
  "ethereum",
  "crypto",
  "cryptocurrency",
  "blockchain",
  "digital asset",
  "defi",
  "web3",
  "stablecoin",
] as const;

function getCryptoTopicLabel(article: NewsArticle): string {
  const text = articleText(article);
  if (text.includes("bitcoin")) return "BITCOIN";
  if (/\betf\b/.test(text) || text.includes("exchange-traded fund")) return "ETF";
  return "CRYPTO";
}

function articleText(article: NewsArticle): string {
  return `${article.headline} ${article.subheading} ${article.tags.join(" ")}`.toLowerCase();
}

/** Content-first category when mapped sector/market metadata is wrong. */
function inferContentCategoryTag(article: NewsArticle): string | null {
  const text = articleText(article);

  if (
    /\b(xbox|playstation|microsoft|apple|google|alphabet|nvidia|semiconductor|openai|software|cloud computing)\b/.test(
      text
    )
  ) {
    return "TECH";
  }
  if (
    /\b(oil|crude|opec|exxon|chevron|natural gas|petroleum|barrel)\b/.test(text)
  ) {
    return "ENERGY";
  }
  if (
    /\b(bhp|rio tinto|iron ore|copper|lithium|mining|metals)\b/.test(text)
  ) {
    return "MINING";
  }
  if (
    /\b(jpmorgan|goldman|bank of america|interest rate|bond yield|treasury|mortgage rate|central bank)\b/.test(
      text
    )
  ) {
    return "FINANCE";
  }
  if (isGenuinelyCryptoRelated(article)) {
    return getCryptoTopicLabel(article);
  }

  return null;
}

/** True only when headline, description, tags, or ticker indicate crypto content. */
export function isGenuinelyCryptoRelated(article: NewsArticle): boolean {
  const ticker = article.ticker?.trim().toUpperCase();
  if (ticker && CRYPTO_TICKERS.has(ticker)) return true;
  if (article.tags.some((tag) => CRYPTO_TICKERS.has(tag.toUpperCase()))) return true;

  const text = articleText(article);
  return CRYPTO_KEYWORDS.some((keyword) => text.includes(keyword));
}

function isIpoStory(article: NewsArticle): boolean {
  const text = `${article.headline} ${article.subheading}`.toLowerCase();
  return (
    /\bipo\b/.test(text) ||
    text.includes("initial public offering") ||
    text.includes("public offering") ||
    text.includes("goes public") ||
    text.includes("going public") ||
    text.includes("debut on nasdaq") ||
    text.includes("debut on nyse")
  );
}

function resolveExchangeTag(
  displayMarket: string,
  articleMarket: NewsArticle["market"]
): string | null {
  if (EXCHANGE_TAGS.has(displayMarket)) return displayMarket;
  if (EXCHANGE_TAGS.has(articleMarket)) return articleMarket;
  return null;
}

/** Top category label for feed cards — market/topic first, crypto only when relevant. */
export function getFeedCategoryTag(
  article: NewsArticle,
  displayMarket: string
): string {
  const upperTags = article.tags.map((tag) => tag.toUpperCase());
  if (upperTags.includes("AI")) return "AI";

  if (isIpoStory(article)) {
    const exchange = resolveExchangeTag(displayMarket, article.market);
    if (exchange) return exchange;
    return "US MARKETS";
  }

  // Topic labels are more useful than exchange labels for crypto/ETF stories,
  // even when the related instrument trades on Nasdaq (e.g. Bitcoin ETF inflows).
  if (isGenuinelyCryptoRelated(article)) {
    return getCryptoTopicLabel(article);
  }

  const exchange = resolveExchangeTag(displayMarket, article.market);
  if (exchange) return exchange;

  const contentTag = inferContentCategoryTag(article);
  if (contentTag) return contentTag;

  if (displayMarket === "US MARKETS") return "US MARKETS";
  if (article.market === "COMMODITIES") return "COMMODITIES";

  // Ignore mis-assigned Crypto sector unless content is genuinely crypto-related.
  if (article.sector !== "Crypto") {
    return SECTOR_TAGS[article.sector] ?? displayMarket.toUpperCase();
  }

  return displayMarket === "US MARKETS"
    ? "US MARKETS"
    : SECTOR_TAGS[article.sector] ?? "MARKETS";
}
