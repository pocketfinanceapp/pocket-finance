import { isPrivateTicker } from "./privateTickers";
import { isMarketThemeTicker } from "./marketThemes";
import { getTickerMetaBySymbol } from "./tickerMap";

const NON_LIVE_TICKERS = new Set([
  "BTC",
  "ETH",
  "OIL",
  "GOLD",
  "FED",
  "RATES",
  "ENERGY",
  "MARKET",
  "SPX",
  "QQQ",
  "DJI",
]);

/** Thematic / index tickers with no real tradeable market price */
export function isNonStockMarketTicker(ticker: string): boolean {
  return isMarketThemeTicker(ticker);
}

export function isCryptoTicker(ticker: string): boolean {
  const upper = ticker.toUpperCase();
  return upper === "BTC" || upper === "ETH";
}

/** Show price / % change on watchlist only for real tradeable tickers */
export function shouldShowWatchlistPrice(ticker: string): boolean {
  const upper = ticker.toUpperCase();
  if (isPrivateTicker(upper)) return false;
  if (isMarketThemeTicker(upper)) return false;

  if (upper === "BTC" || upper === "ETH") return true;

  const market = getTickerMetaBySymbol(upper).market;
  return market === "NASDAQ" || market === "NYSE";
}

/** US-listed tickers eligible for live Massive price quotes */
export function isUsListedStockTicker(ticker: string): boolean {
  const upper = ticker.toUpperCase();
  if (isPrivateTicker(upper)) return false;
  if (NON_LIVE_TICKERS.has(upper)) return false;

  const market = getTickerMetaBySymbol(upper).market;
  return market === "NASDAQ" || market === "NYSE";
}
