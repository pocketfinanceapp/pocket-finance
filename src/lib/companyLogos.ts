/** Public CDN logos for listed equities (permitted brand display). */
const FINNHUB_LOGO = (ticker: string) =>
  `https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/${encodeURIComponent(ticker)}.png`;

const CRYPTO_LOGOS: Record<string, string> = {
  BTC: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
  ETH: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
};

export function getCompanyLogoUrl(ticker: string): string | null {
  const upper = ticker.trim().toUpperCase();
  if (!upper) return null;
  if (CRYPTO_LOGOS[upper]) return CRYPTO_LOGOS[upper];
  if (/^[A-Z]{1,5}$/.test(upper)) return FINNHUB_LOGO(upper);
  return null;
}
