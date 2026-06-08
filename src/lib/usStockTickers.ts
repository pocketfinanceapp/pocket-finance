import { isPrivateTicker } from "./privateTickers";
import { getTickerMetaBySymbol } from "./tickerMap";

const NON_LIVE_TICKERS = new Set([
  "BTC",
  "ETH",
  "OIL",
  "GOLD",
  "FED",
  "MARKET",
  "SPX",
  "QQQ",
  "DJI",
]);

const WATCHLIST_NO_PRICE_TICKERS = new Set([
  "MARKET",
  "FED",
  "OIL",
  "GOLD",
  "SPX",
  "QQQ",
  "DJI",
]);

/** Show price / % change on watchlist only for real tradeable tickers */
export function shouldShowWatchlistPrice(ticker: string): boolean {
  const upper = ticker.toUpperCase();
  if (isPrivateTicker(upper)) return false;
  if (WATCHLIST_NO_PRICE_TICKERS.has(upper)) return false;

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
