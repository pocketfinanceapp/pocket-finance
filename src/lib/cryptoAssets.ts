import { getTickerMetaBySymbol, type TickerMeta } from "./tickerMap";
import { CRYPTO_ASSET_TICKERS } from "./cryptoBrand";

export { CRYPTO_ASSET_TICKERS, isCryptoAssetTicker } from "./cryptoBrand";
export type { CryptoAssetTicker } from "./cryptoBrand";

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
