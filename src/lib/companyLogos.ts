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
    if (/^[A-Z]{1,5}$/.test(symbol)) {
      urls.push(FINNHUB_LOGO(symbol));
    }
    urls.push(PARQET_LOGO(symbol));
  }

  return uniqueUrls(urls);
}

/** @deprecated Use getCompanyLogoUrls — returns first candidate only */
export function getCompanyLogoUrl(ticker: string): string | null {
  return getCompanyLogoUrls(ticker)[0] ?? null;
}
