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

  return [...tickers].sort((a, b) => a.localeCompare(b));
}

/** Major global exchanges represented in the app catalog */
export function getBrowsableMarketIds(): MarketFilter[] {
  return [...MARKET_FILTERS];
}
