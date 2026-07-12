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
  "MATIC",
  "SHIB",
  "LTC",
  "UNI",
  "ATOM",
  "TRX",
  "TON",
  "NEAR",
  "APT",
  "ARB",
] as const;

export type CryptoAssetTicker = (typeof CRYPTO_ASSET_TICKERS)[number];

const CRYPTO_BRAND_COLORS: Record<string, string> = {
  BTC: "#F7931A",
  ETH: "#627EEA",
  SOL: "#9945FF",
  BNB: "#F3BA2F",
  XRP: "#0A74DA",
  ADA: "#0033AD",
  DOGE: "#C2A633",
  AVAX: "#E84142",
  DOT: "#E6007A",
  LINK: "#375BD2",
  MATIC: "#8247E5",
  SHIB: "#FFA409",
  LTC: "#345D9D",
  UNI: "#FF007A",
  ATOM: "#2E3148",
  TRX: "#EF0027",
  TON: "#0098EA",
  NEAR: "#00C08B",
  APT: "#00BFFF",
  ARB: "#28A0F0",
};

const CRYPTO_NAMES: Record<string, string> = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  SOL: "Solana",
  BNB: "BNB",
  XRP: "XRP",
  ADA: "Cardano",
  DOGE: "Dogecoin",
  AVAX: "Avalanche",
  DOT: "Polkadot",
  LINK: "Chainlink",
  MATIC: "Polygon",
  SHIB: "Shiba Inu",
  LTC: "Litecoin",
  UNI: "Uniswap",
  ATOM: "Cosmos",
  TRX: "TRON",
  TON: "Toncoin",
  NEAR: "NEAR Protocol",
  APT: "Aptos",
  ARB: "Arbitrum",
};

const VIVID_FALLBACK_COLORS = [
  "#3B6EF5",
  "#00C6C6",
  "#E84142",
  "#9945FF",
  "#F3BA2F",
  "#00915A",
  "#E6007A",
  "#FF6B35",
  "#7C3AED",
  "#0EA5E9",
  "#D97706",
  "#DB2777",
] as const;

export function isCryptoAssetTicker(ticker: string): boolean {
  const upper = ticker.toUpperCase();
  return (CRYPTO_ASSET_TICKERS as readonly string[]).includes(upper);
}

export function getCryptoDisplayName(ticker: string): string {
  const upper = ticker.toUpperCase();
  return CRYPTO_NAMES[upper] ?? upper;
}

export function getCryptoBrandColor(ticker: string): string {
  const upper = ticker.toUpperCase();
  if (CRYPTO_BRAND_COLORS[upper]) return CRYPTO_BRAND_COLORS[upper];

  let hash = 0;
  for (const char of upper) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return VIVID_FALLBACK_COLORS[hash % VIVID_FALLBACK_COLORS.length];
}
