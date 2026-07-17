import type { MarketFilter } from "./filters";

export type QuoteDelayKind = "realtime" | "delay_20m" | "eod";

export interface QuoteDelayInfo {
  kind: QuoteDelayKind;
  /** Short badge text shown in UI */
  label: string;
  /** Title for the info popup */
  title: string;
  /** Body explaining what the delay means */
  explanation: string;
}

const REALTIME: QuoteDelayInfo = {
  kind: "realtime",
  label: "Real-time",
  title: "Real-time",
  explanation:
    "Quotes update during market hours with no intentional end-of-day lag. Prices still settle briefly after each trade and may differ slightly from your broker.",
};

const DELAY_20M: QuoteDelayInfo = {
  kind: "delay_20m",
  label: "20 min delay",
  title: "20-minute delay",
  explanation:
    "Australia exchange data from Twelve Data is delayed by about 20 minutes. The price shown is accurate as of that lag, not the latest tick.",
};

const EOD: QuoteDelayInfo = {
  kind: "eod",
  label: "EOD",
  title: "End of day (EOD)",
  explanation:
    "End of day: Twelve Data provides the last available closing price for this country on your plan — not an intraday live tick. Values update after the local market session closes.",
};

/** Venture-covered exchanges we keep in Markets UI (with truthful delay labels). */
export const COVERED_MARKET_IDS: readonly MarketFilter[] = [
  "NASDAQ",
  "NYSE",
  "LSE",
  "ASX",
  "TSX",
  "Euronext",
  "XETRA",
  "SIX",
  "BSE",
  "B3",
  "BMV",
  "Nikkei",
  "HKEX",
  "SGX",
  "TWSE",
  "SSE",
  "KRX",
  "TADAWUL",
] as const;

const MARKET_DELAY: Record<MarketFilter, QuoteDelayInfo> = {
  NASDAQ: REALTIME,
  NYSE: REALTIME,
  LSE: REALTIME,
  ASX: DELAY_20M,
  TSX: EOD,
  Euronext: EOD,
  XETRA: EOD,
  SIX: EOD,
  BSE: EOD,
  B3: EOD,
  BMV: EOD,
  Nikkei: EOD,
  HKEX: EOD,
  SGX: EOD,
  TWSE: EOD,
  SSE: EOD,
  KRX: EOD,
  TADAWUL: EOD,
};

export function isCoveredMarket(id: string): id is MarketFilter {
  return (COVERED_MARKET_IDS as readonly string[]).includes(id);
}

export function getMarketDelayInfo(market: MarketFilter): QuoteDelayInfo {
  return MARKET_DELAY[market] ?? EOD;
}

/** Delay label for a company ticker based on its listing market. */
export function getTickerDelayInfo(market: string): QuoteDelayInfo {
  if (market === "NASDAQ" || market === "NYSE") return REALTIME;
  if (market === "LSE") return REALTIME;
  if (market === "ASX") return DELAY_20M;
  if (isCoveredMarket(market)) return getMarketDelayInfo(market);
  return EOD;
}
