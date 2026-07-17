import { isCryptoAssetTicker } from "./cryptoAssets";
import { isPrivateTicker } from "./privateTickers";
import { isMarketThemeTicker } from "./marketThemes";
import { getTickerMetaBySymbol } from "./tickerMap";
import {
  isCoveredMarket,
  COVERED_MARKET_IDS,
} from "./twelveDataDelay";
import { isUnquotableTicker } from "./twelveDataSymbolOverrides";

const NON_LIVE_TICKERS = new Set([
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
  return isCryptoAssetTicker(ticker);
}

/** Show price / % change on watchlist only for quote-eligible equities */
export function shouldShowWatchlistPrice(ticker: string): boolean {
  return isQuoteEligibleTicker(ticker);
}

/** US-listed tickers (NASDAQ/NYSE) — kept for callers that need the US-only gate */
export function isUsListedStockTicker(ticker: string): boolean {
  const upper = ticker.toUpperCase();
  if (isPrivateTicker(upper)) return false;
  if (isCryptoAssetTicker(upper)) return false;
  if (NON_LIVE_TICKERS.has(upper)) return false;
  if (isMarketThemeTicker(upper)) return false;

  const market = getTickerMetaBySymbol(upper).market;
  return market === "NASDAQ" || market === "NYSE";
}

/**
 * Equities eligible for live Twelve Data quotes: Venture-covered listing
 * markets, excluding crypto/themes/private/known-unquotable symbols.
 */
export function isQuoteEligibleTicker(ticker: string): boolean {
  const upper = ticker.toUpperCase();
  if (isPrivateTicker(upper)) return false;
  if (isCryptoAssetTicker(upper)) return false;
  if (NON_LIVE_TICKERS.has(upper)) return false;
  if (isMarketThemeTicker(upper)) return false;
  if (isUnquotableTicker(upper)) return false;

  const market = getTickerMetaBySymbol(upper).market;
  return isCoveredMarket(market);
}

export { COVERED_MARKET_IDS };
