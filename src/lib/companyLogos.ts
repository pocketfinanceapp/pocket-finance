/** Public CDN logos for listed equities (permitted brand display). */

const FINNHUB_LOGO = (symbol: string) =>
  `https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/${encodeURIComponent(symbol)}.png`;

const PARQET_LOGO = (symbol: string) =>
  `https://assets.parqet.com/logos/symbol/${encodeURIComponent(symbol)}?format=png`;

/** Alternate symbols to try when the app ticker differs from logo CDNs */
const LOGO_SYMBOL_ALIASES: Record<string, string[]> = {
  GOOG: ["GOOGL"],
  BRK: ["BRK.B", "BRK-A", "BRK-B"],
  LVMH: ["MC", "MC.PA"],
  TATA: ["TTM"],
  SQ: ["XYZ", "BLOCK"],
  SHEL: ["RDS.A", "SHEL"],
};

/** Curated URLs for private companies and symbols missing from stock CDNs */
const MANUAL_LOGOS: Record<string, string> = {
  BTC: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
  ETH: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  SOL: "https://cryptologos.cc/logos/solana-sol-logo.png",
  BNB: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
  XRP: "https://cryptologos.cc/logos/xrp-xrp-logo.png",
  ADA: "https://cryptologos.cc/logos/cardano-ada-logo.png",
  DOGE: "https://cryptologos.cc/logos/dogecoin-doge-logo.png",
  AVAX: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
  DOT: "https://cryptologos.cc/logos/polkadot-new-dot-logo.png",
  LINK: "https://cryptologos.cc/logos/chainlink-link-logo.png",
  MATIC: "https://cryptologos.cc/logos/polygon-matic-logo.png",
  SHIB: "https://cryptologos.cc/logos/shiba-inu-shib-logo.png",
  LTC: "https://cryptologos.cc/logos/litecoin-ltc-logo.png",
  UNI: "https://cryptologos.cc/logos/uniswap-uni-logo.png",
  ATOM: "https://cryptologos.cc/logos/cosmos-atom-logo.png",
  TRX: "https://cryptologos.cc/logos/tron-trx-logo.png",
  TON: "https://cryptologos.cc/logos/toncoin-ton-logo.png",
  NEAR: "https://cryptologos.cc/logos/near-protocol-near-logo.png",
  APT: "https://cryptologos.cc/logos/aptos-apt-logo.png",
  ARB: "https://cryptologos.cc/logos/arbitrum-arb-logo.png",
  OPENAI:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/OpenAI_Logo.svg/512px-OpenAI_Logo.svg.png",
  SPACEX:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/SpaceX_Company_Logo.svg/512px-SpaceX_Company_Logo.svg.png",
  ANTHROPIC:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Anthropic_logo.svg/512px-Anthropic_logo.svg.png",
  STRIPE:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Stripe_Logo%2C_revised_2016.svg/512px-Stripe_Logo%2C_revised_2016.svg.png",
  KLARNA:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Klarna_Payment_Badge.svg/512px-Klarna_Payment_Badge.svg.png",
  CHIME:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Chime_%28company%29_logo.svg/512px-Chime_%28company%29_logo.svg.png",
};

function isStockSymbol(symbol: string): boolean {
  return /^[A-Z][A-Z0-9.-]{0,9}$/.test(symbol);
}

function uniqueUrls(urls: string[]): string[] {
  return [...new Set(urls.filter(Boolean))];
}

/** Ordered logo URLs to try — manual first, then CDN fallbacks per symbol alias */
export function getCompanyLogoUrls(ticker: string): string[] {
  const upper = ticker.trim().toUpperCase();
  if (!upper) return [];

  const urls: string[] = [];

  if (MANUAL_LOGOS[upper]) {
    urls.push(MANUAL_LOGOS[upper]);
  }

  const symbols = uniqueUrls([
    upper,
    ...(LOGO_SYMBOL_ALIASES[upper] ?? []),
  ]);

  for (const symbol of symbols) {
    if (!isStockSymbol(symbol)) continue;
    urls.push(PARQET_LOGO(symbol));
    if (/^[A-Z]{1,5}$/.test(symbol)) {
      urls.push(FINNHUB_LOGO(symbol));
    }
  }

  return uniqueUrls(urls);
}

/** @deprecated Use getCompanyLogoUrls — returns first candidate only */
export function getCompanyLogoUrl(ticker: string): string | null {
  return getCompanyLogoUrls(ticker)[0] ?? null;
}
