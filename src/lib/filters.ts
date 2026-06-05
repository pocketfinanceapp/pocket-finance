export const MARKET_FILTERS = [
  "ASX",
  "NASDAQ",
  "NYSE",
  "LSE",
  "Nikkei",
  "HKEX",
  "TSX",
  "Euronext",
  "SGX",
  "BSE",
  "SSE",
  "KRX",
] as const;

export type MarketFilter = (typeof MARKET_FILTERS)[number];

export const SECTOR_FILTERS = [
  "Technology",
  "Finance",
  "Energy",
  "Mining",
  "Healthcare",
  "Consumer",
  "Crypto",
  "Real Estate",
] as const;

/** Markets shown during onboarding */
export const ONBOARDING_MARKETS: MarketFilter[] = [
  "ASX",
  "NASDAQ",
  "NYSE",
  "LSE",
  "Nikkei",
  "HKEX",
  "TSX",
  "SGX",
];

export type SectorFilter = (typeof SECTOR_FILTERS)[number];

export function articleMatchesMarket(
  articleMarket: string,
  filter: MarketFilter
): boolean {
  const bucket = marketToFilter(articleMarket);
  return articleMarket === filter || bucket === filter;
}

/** Map article market label to filter bucket */
export function marketToFilter(market: string): MarketFilter | null {
  if ((MARKET_FILTERS as readonly string[]).includes(market)) {
    return market as MarketFilter;
  }

  const m = market.toUpperCase();

  if (m === "NASDAQ") return "NASDAQ";
  if (m === "NYSE") return "NYSE";
  if (m.includes("ASX")) return "ASX";
  if (m.includes("LSE") || m.includes("FTSE")) return "LSE";
  if (m.includes("NIKKEI") || m.includes("TSE")) return "Nikkei";
  if (m.includes("HKEX") || m.includes("HONG KONG") || m.includes("HANG SENG"))
    return "HKEX";
  if (m.includes("TSX") || m.includes("TORONTO")) return "TSX";
  if (m.includes("EURONEXT") || m.includes("PARIS") || m.includes("AMSTERDAM"))
    return "Euronext";
  if (m.includes("SGX") || m.includes("SINGAPORE") || m.includes("STRAITS"))
    return "SGX";
  if (m.includes("BSE") || m.includes("SENSEX") || m.includes("MUMBAI"))
    return "BSE";
  if (m.includes("SSE") || m.includes("SHANGHAI") || m.includes("SHENZHEN"))
    return "SSE";
  if (m.includes("KRX") || m.includes("KOSPI") || m.includes("KOREA"))
    return "KRX";

  return "NASDAQ";
}
