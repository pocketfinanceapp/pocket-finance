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

/** US-listed tickers eligible for live Massive price quotes */
export function isUsListedStockTicker(ticker: string): boolean {
  const upper = ticker.toUpperCase();
  if (isPrivateTicker(upper)) return false;
  if (NON_LIVE_TICKERS.has(upper)) return false;

  const market = getTickerMetaBySymbol(upper).market;
  return market === "NASDAQ" || market === "NYSE";
}
