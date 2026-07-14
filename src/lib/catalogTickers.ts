import type { MarketFilter } from "./filters";
import { isCryptoAssetTicker } from "./cryptoBrand";
import { isPrivateTicker } from "./privateTickers";
import { isMarketThemeTicker } from "./marketThemes";
import { MARKET_FILTERS } from "./filters";
import { getMarketProfile } from "./marketProfiles";
import { getKnownTickerSymbols } from "./tickerMap";
import { TOP_MOVERS, TOP_MOVER_TABS } from "./topMovers";
import { getStockProfileCompetitorTickers } from "./stockData";

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

/** Prefer these exchanges when building the default “most relevant” company order. */
const PRIORITY_MARKET_ORDER: MarketFilter[] = [
  "NASDAQ",
  "NYSE",
  "LSE",
  "Euronext",
  "XETRA",
  "Nikkei",
  "HKEX",
  "TWSE",
  "TSX",
  "ASX",
  "SGX",
  "BSE",
  "SSE",
  "KRX",
  "SIX",
  "B3",
  "BMV",
  "TADAWUL",
];

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

  // Most relevant first: top movers → flagship constituents by major market → A–Z rest
  const ordered: string[] = [];
  const seen = new Set<string>();
  const push = (ticker: string) => {
    const upper = ticker.toUpperCase();
    if (!tickers.has(upper) || seen.has(upper)) return;
    seen.add(upper);
    ordered.push(upper);
  };

  for (const mover of TOP_MOVERS.active) push(mover.ticker);
  for (const mover of TOP_MOVERS.gainers) push(mover.ticker);
  for (const mover of TOP_MOVERS.losers) push(mover.ticker);

  for (const marketId of PRIORITY_MARKET_ORDER) {
    for (const constituent of getMarketProfile(marketId).constituents) {
      push(constituent);
    }
  }

  for (const marketId of MARKET_FILTERS) {
    if ((PRIORITY_MARKET_ORDER as readonly string[]).includes(marketId)) continue;
    for (const constituent of getMarketProfile(marketId).constituents) {
      push(constituent);
    }
  }

  for (const ticker of [...tickers].sort((a, b) => a.localeCompare(b))) {
    push(ticker);
  }

  return ordered;
}

/** Major global exchanges represented in the app catalog */
export function getBrowsableMarketIds(): MarketFilter[] {
  return [...MARKET_FILTERS];
}
