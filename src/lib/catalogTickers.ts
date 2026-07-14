import type { MarketFilter } from "./filters";
import { isCryptoAssetTicker } from "./cryptoBrand";
import { isPrivateTicker } from "./privateTickers";
import { isMarketThemeTicker } from "./marketThemes";
import { MARKET_FILTERS } from "./filters";
import { getMarketProfile } from "./marketProfiles";
import { getKnownTickerSymbols } from "./tickerMap";
import { TOP_MOVERS, TOP_MOVER_TABS } from "./topMovers";
import {
  getSeededEquityMarketCap,
  getStockProfileCompetitorTickers,
} from "./stockData";

const COMPANY_EXCLUDED = new Set([
  "BTC",
  "ETH",
  "MARKET",
  "OIL",
  "GOLD",
  "FED",
  "RATES",
  "ENERGY",
]);

function isBrowsableCompanyTicker(ticker: string): boolean {
  const upper = ticker.toUpperCase();
  if (!upper || upper.length > 6) return false;
  if (COMPANY_EXCLUDED.has(upper)) return false;
  if (isCryptoAssetTicker(upper)) return false;
  if (isMarketThemeTicker(upper)) return false;
  if (isPrivateTicker(upper)) return false;
  return /^[A-Z][A-Z0-9.-]{0,9}$/.test(upper);
}

/**
 * Approximate market caps (USD) for well-known names so Browse leads with
 * the largest companies even when STOCK_PROFILES lack a seeded cap.
 * Values are relative ranking anchors, not live quotes.
 */
const APPROX_MARKET_CAP_USD: Record<string, number> = {
  AAPL: 3_500_000_000_000,
  MSFT: 3_400_000_000_000,
  NVDA: 3_300_000_000_000,
  GOOGL: 2_200_000_000_000,
  GOOG: 2_200_000_000_000,
  AMZN: 2_150_000_000_000,
  META: 1_900_000_000_000,
  BRK: 1_000_000_000_000,
  TSM: 950_000_000_000,
  AVGO: 900_000_000_000,
  LLY: 800_000_000_000,
  TSLA: 780_000_000_000,
  JPM: 650_000_000_000,
  V: 620_000_000_000,
  WMT: 600_000_000_000,
  XOM: 520_000_000_000,
  MA: 500_000_000_000,
  UNH: 480_000_000_000,
  JNJ: 400_000_000_000,
  ORCL: 390_000_000_000,
  HD: 380_000_000_000,
  PG: 370_000_000_000,
  COST: 360_000_000_000,
  NFLX: 340_000_000_000,
  ABBV: 330_000_000_000,
  BAC: 320_000_000_000,
  KO: 290_000_000_000,
  CRM: 280_000_000_000,
  AMD: 270_000_000_000,
  PEP: 250_000_000_000,
  MRK: 245_000_000_000,
  CVX: 240_000_000_000,
  TMO: 230_000_000_000,
  ADBE: 220_000_000_000,
  DIS: 210_000_000_000,
  CSCO: 200_000_000_000,
  ACN: 195_000_000_000,
  MCD: 190_000_000_000,
  INTU: 185_000_000_000,
  IBM: 180_000_000_000,
  QCOM: 175_000_000_000,
  GE: 170_000_000_000,
  AMAT: 165_000_000_000,
  TXN: 160_000_000_000,
  CAT: 155_000_000_000,
  VZ: 150_000_000_000,
  UBER: 145_000_000_000,
  NOW: 140_000_000_000,
  ISRG: 135_000_000_000,
  BX: 130_000_000_000,
  GS: 125_000_000_000,
  SPGI: 120_000_000_000,
  BA: 115_000_000_000,
  MS: 110_000_000_000,
  BLK: 105_000_000_000,
  PLTR: 100_000_000_000,
  INTC: 95_000_000_000,
  BABA: 220_000_000_000,
  TCEHY: 450_000_000_000,
  TM: 250_000_000_000,
  SONY: 120_000_000_000,
  SAP: 280_000_000_000,
  ASML: 320_000_000_000,
  SHEL: 210_000_000_000,
  BP: 90_000_000_000,
  BHP: 140_000_000_000,
  RY: 150_000_000_000,
  SHOP: 100_000_000_000,
  NESN: 260_000_000_000,
  NVS: 220_000_000_000,
  ARM: 140_000_000_000,
  MU: 120_000_000_000,
  CRWD: 90_000_000_000,
  SMCI: 30_000_000_000,
  MSTR: 80_000_000_000,
  SNAP: 15_000_000_000,
  PYPL: 70_000_000_000,
};

function companySizeScore(ticker: string): number {
  const upper = ticker.toUpperCase();
  const approx = APPROX_MARKET_CAP_USD[upper];
  if (typeof approx === "number") return approx;

  const seeded = getSeededEquityMarketCap(upper);
  if (seeded != null && seeded > 0) return seeded;

  return 0;
}

/** Union of tickers already modeled across maps, movers, and market constituents */
export function getBrowsableCompanyTickers(): string[] {
  const tickers = new Set<string>();

  for (const symbol of getKnownTickerSymbols()) {
    if (isBrowsableCompanyTicker(symbol)) tickers.add(symbol);
  }

  for (const tab of TOP_MOVER_TABS) {
    for (const mover of TOP_MOVERS[tab.id]) {
      if (isBrowsableCompanyTicker(mover.ticker)) tickers.add(mover.ticker);
    }
  }

  for (const marketId of MARKET_FILTERS) {
    for (const constituent of getMarketProfile(marketId).constituents) {
      if (isBrowsableCompanyTicker(constituent)) tickers.add(constituent);
    }
  }

  for (const symbol of getStockProfileCompetitorTickers()) {
    if (isBrowsableCompanyTicker(symbol)) tickers.add(symbol);
  }

  // Biggest companies first (approx / seeded market cap), then A–Z.
  return [...tickers].sort((a, b) => {
    const sizeDiff = companySizeScore(b) - companySizeScore(a);
    if (sizeDiff !== 0) return sizeDiff;
    return a.localeCompare(b);
  });
}

/** Major global exchanges represented in the app catalog */
export function getBrowsableMarketIds(): MarketFilter[] {
  return [...MARKET_FILTERS];
}
