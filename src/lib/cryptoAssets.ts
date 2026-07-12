import { getTickerMetaBySymbol, type TickerMeta } from "./tickerMap";

export const CRYPTO_ASSET_TICKERS = [
  "BTC",
  "ETH",
  "SOL",
  "BNB",
  "XRP",
  "ADA",
  "DOGE",
  "AVAX",
  "DOT",
  "LINK",
  "COIN",
] as const;

export type CryptoAssetTicker = (typeof CRYPTO_ASSET_TICKERS)[number];

export interface CryptoAsset {
  ticker: string;
  meta: TickerMeta;
}

export function getCryptoAssets(): CryptoAsset[] {
  return CRYPTO_ASSET_TICKERS.map((ticker) => ({
    ticker,
    meta: getTickerMetaBySymbol(ticker),
  }));
}

export function isCryptoAssetTicker(ticker: string): boolean {
  const upper = ticker.toUpperCase();
  return (CRYPTO_ASSET_TICKERS as readonly string[]).includes(upper);
}
