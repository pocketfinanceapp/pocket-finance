import type { MarketExchange, Sector } from "./types";

export interface TickerMeta {
  ticker: string;
  companyName: string;
  market: MarketExchange;
  sector: Sector;
  tags: string[];
  logoColor: string;
}

const TICKER_MAP: Record<string, TickerMeta> = {
  nvidia: {
    ticker: "NVDA",
    companyName: "NVIDIA Corporation",
    market: "NASDAQ",
    sector: "Technology",
    tags: ["NVDA", "AI", "Semiconductors"],
    logoColor: "#76b900",
  },
  apple: {
    ticker: "AAPL",
    companyName: "Apple Inc.",
    market: "NASDAQ",
    sector: "Technology",
    tags: ["AAPL", "Tech", "Consumer"],
    logoColor: "#555555",
  },
  microsoft: {
    ticker: "MSFT",
    companyName: "Microsoft Corporation",
    market: "NASDAQ",
    sector: "Technology",
    tags: ["MSFT", "Cloud", "AI"],
    logoColor: "#00a4ef",
  },
  tesla: {
    ticker: "TSLA",
    companyName: "Tesla, Inc.",
    market: "NASDAQ",
    sector: "Consumer",
    tags: ["TSLA", "EV", "Auto"],
    logoColor: "#cc0000",
  },
  amazon: {
    ticker: "AMZN",
    companyName: "Amazon.com, Inc.",
    market: "NASDAQ",
    sector: "Consumer",
    tags: ["AMZN", "E-commerce", "Cloud"],
    logoColor: "#ff9900",
  },
  google: {
    ticker: "GOOGL",
    companyName: "Alphabet Inc.",
    market: "NASDAQ",
    sector: "Technology",
    tags: ["GOOGL", "AI", "Search"],
    logoColor: "#4285f4",
  },
  alphabet: {
    ticker: "GOOGL",
    companyName: "Alphabet Inc.",
    market: "NASDAQ",
    sector: "Technology",
    tags: ["GOOGL", "AI", "Search"],
    logoColor: "#4285f4",
  },
  meta: {
    ticker: "META",
    companyName: "Meta Platforms, Inc.",
    market: "NASDAQ",
    sector: "Technology",
    tags: ["META", "Social", "AI"],
    logoColor: "#0668e1",
  },
  amd: {
    ticker: "AMD",
    companyName: "Advanced Micro Devices",
    market: "NASDAQ",
    sector: "Technology",
    tags: ["AMD", "Chips", "Semiconductors"],
    logoColor: "#ed1c24",
  },
  intel: {
    ticker: "INTC",
    companyName: "Intel Corporation",
    market: "NASDAQ",
    sector: "Technology",
    tags: ["INTC", "Chips", "Semiconductors"],
    logoColor: "#0071c5",
  },
  bitcoin: {
    ticker: "BTC",
    companyName: "Bitcoin",
    market: "NASDAQ",
    sector: "Crypto",
    tags: ["BTC", "Crypto", "Digital Assets"],
    logoColor: "#f7931a",
  },
  ethereum: {
    ticker: "ETH",
    companyName: "Ethereum",
    market: "NASDAQ",
    sector: "Crypto",
    tags: ["ETH", "Crypto", "DeFi"],
    logoColor: "#627eea",
  },
  jpmorgan: {
    ticker: "JPM",
    companyName: "JPMorgan Chase & Co.",
    market: "NYSE",
    sector: "Finance",
    tags: ["JPM", "Banks", "Finance"],
    logoColor: "#006747",
  },
  goldman: {
    ticker: "GS",
    companyName: "The Goldman Sachs Group",
    market: "NYSE",
    sector: "Finance",
    tags: ["GS", "Banks", "Wall Street"],
    logoColor: "#6cace4",
  },
  exxon: {
    ticker: "XOM",
    companyName: "Exxon Mobil Corporation",
    market: "NYSE",
    sector: "Energy",
    tags: ["XOM", "Oil", "Energy"],
    logoColor: "#e4002b",
  },
  bhp: {
    ticker: "BHP",
    companyName: "BHP Group",
    market: "ASX",
    sector: "Mining",
    tags: ["BHP", "Mining", "ASX"],
    logoColor: "#e3530d",
  },
  coinbase: {
    ticker: "COIN",
    companyName: "Coinbase Global, Inc.",
    market: "NASDAQ",
    sector: "Crypto",
    tags: ["COIN", "Crypto", "Exchange"],
    logoColor: "#0052ff",
  },
  "johnson & johnson": {
    ticker: "JNJ",
    companyName: "Johnson & Johnson",
    market: "NYSE",
    sector: "Healthcare",
    tags: ["JNJ", "Pharma", "Healthcare"],
    logoColor: "#d51900",
  },
  sony: {
    ticker: "SONY",
    companyName: "Sony Group Corporation",
    market: "Nikkei",
    sector: "Technology",
    tags: ["SONY", "Japan", "Electronics"],
    logoColor: "#000000",
  },
};

/** Themed tickers for broad-market articles with no specific stock */
export const THEME_SPX: TickerMeta = {
  ticker: "SPX",
  companyName: "S&P 500 Index",
  market: "NYSE",
  sector: "Finance",
  tags: ["SPX", "Index", "Markets"],
  logoColor: "#6b7280",
};

export const THEME_OIL: TickerMeta = {
  ticker: "OIL",
  companyName: "Crude Oil",
  market: "NYSE",
  sector: "Energy",
  tags: ["OIL", "Energy", "Commodities"],
  logoColor: "#f97316",
};

export const THEME_MARKET: TickerMeta = {
  ticker: "MARKET",
  companyName: "Broad Market",
  market: "NYSE",
  sector: "Finance",
  tags: ["MARKET", "Economy", "News"],
  logoColor: "#6b7280",
};

/** Symbols referenced in demo / news that aren't keyed by company name */
const SYMBOL_OVERRIDES: Record<string, TickerMeta> = {
  SPX: THEME_SPX,
  OIL: THEME_OIL,
  MARKET: THEME_MARKET,
  XOM: TICKER_MAP.exxon,
  BHP: TICKER_MAP.bhp,
  COIN: TICKER_MAP.coinbase,
  JNJ: TICKER_MAP["johnson & johnson"],
  SONY: TICKER_MAP.sony,
  RY: {
    ticker: "RY",
    companyName: "Royal Bank of Canada",
    market: "TSX",
    sector: "Finance",
    tags: ["RY", "Canada", "Banks"],
    logoColor: "#0051a5",
  },
  BNP: {
    ticker: "BNP",
    companyName: "BNP Paribas",
    market: "Euronext",
    sector: "Finance",
    tags: ["BNP", "Europe", "Banks"],
    logoColor: "#00915a",
  },
  LVMH: {
    ticker: "LVMH",
    companyName: "LVMH",
    market: "LSE",
    sector: "Consumer",
    tags: ["LVMH", "Luxury", "Retail"],
    logoColor: "#1a1a1a",
  },
  CKA: {
    ticker: "CKA",
    companyName: "CK Asset Holdings",
    market: "HKEX",
    sector: "Real Estate",
    tags: ["CKA", "HKEX", "Property"],
    logoColor: "#c41230",
  },
  CAPL: {
    ticker: "CAPL",
    companyName: "CapitaLand",
    market: "SGX",
    sector: "Real Estate",
    tags: ["CAPL", "SGX", "REIT"],
    logoColor: "#003366",
  },
};

const TICKER_BY_SYMBOL: Record<string, TickerMeta> = {
  ...SYMBOL_OVERRIDES,
  ...Object.values(TICKER_MAP).reduce(
    (acc, meta) => {
      acc[meta.ticker] = meta;
      return acc;
    },
    {} as Record<string, TickerMeta>
  ),
};

const NAME_KEYS = Object.entries(TICKER_MAP).sort(
  (a, b) => b[0].length - a[0].length
);

const KNOWN_SYMBOLS = Object.keys(TICKER_BY_SYMBOL).sort(
  (a, b) => b.length - a.length
);

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchSymbol(text: string, symbol: string): boolean {
  const re = new RegExp(`(?:\\$|\\()${escapeRegex(symbol)}\\b|\\b${escapeRegex(symbol)}\\b`, "i");
  return re.test(text);
}

function matchName(text: string, name: string): boolean {
  const re = new RegExp(`\\b${escapeRegex(name)}\\b`, "i");
  return re.test(text);
}

const INDEX_RE =
  /\bs&p\s*500\b|\bsp\s*500\b|\bspx\b|\bdow\s*jones\b|\bdjia\b|\bnasdaq\s+(composite|index)\b|\brussell\s*2000\b|\bstock\s+(index|indices|market)\b|\bmarket\s+futures\b|\bfutures\s+market\b|\bwall\s+street\b|\bindex\s+futures\b/i;

const OIL_RE =
  /\boil\s+prices?\b|\bcrude\s+oil\b|\bpetroleum\b|\bbrent\s+crude\b|\bwti\b|\boil\s+market\b|\bopec\b|\bnatural\s+gas\s+prices?\b|\bgas\s+prices?\b/i;

const OIL_COMPANY_RE = /\bexxon\b|\bxom\b|\bchevron\b|\bcvx\b|\bshell\b|\bbp\b|\bconocophillips\b/i;

/** Classify broad-market articles that don't map to a single stock */
function inferThemedTicker(text: string): TickerMeta {
  if (INDEX_RE.test(text)) return THEME_SPX;
  if (OIL_RE.test(text) && !OIL_COMPANY_RE.test(text)) return THEME_OIL;
  return THEME_MARKET;
}

/** Extract the most relevant ticker from article text — never returns SPY */
export function inferTickerFromText(text: string): TickerMeta {
  if (!text.trim()) return THEME_MARKET;

  // 1. Explicit ticker symbols ($AAPL, NVDA, (BTC))
  for (const symbol of KNOWN_SYMBOLS) {
    if (matchSymbol(text, symbol)) {
      return TICKER_BY_SYMBOL[symbol];
    }
  }

  // 2. Company / product names (longest keys first, word boundaries)
  for (const [key, meta] of NAME_KEYS) {
    if (matchName(text, key)) return meta;
  }

  // 3. Common aliases not stored as map keys
  if (/\bbitcoin\b|\bbtc\b/i.test(text)) return TICKER_MAP.bitcoin;
  if (/\bethereum\b|\beth\b/i.test(text)) return TICKER_MAP.ethereum;
  if (/\bexxon\b|\bxom\b/i.test(text)) return TICKER_MAP.exxon;
  if (/\bbhp\b|\biron ore\b/i.test(text)) return TICKER_MAP.bhp;
  if (/\bcoinbase\b/i.test(text)) return TICKER_MAP.coinbase;
  if (/\bsony\b/i.test(text)) return TICKER_MAP.sony;
  if (/\bjohnson\s*&\s*johnson\b|\bjnj\b/i.test(text))
    return TICKER_MAP["johnson & johnson"];

  return inferThemedTicker(text);
}

const DEPRECATED_TICKER = "SPY";

function isDeprecatedTicker(ticker: string | null | undefined): boolean {
  const upper = ticker?.trim().toUpperCase() ?? "";
  return !upper || upper === DEPRECATED_TICKER;
}

function articleInferenceText(article: {
  headline: string;
  subheading?: string;
  body?: string;
}): string {
  return [article.headline, article.subheading ?? "", article.body ?? ""].join(" ");
}

/** Display/save ticker for a feed article — re-infers when stored value is SPY or missing */
export function resolveArticleTicker(article: {
  ticker: string;
  headline: string;
  subheading?: string;
  body?: string;
}): string {
  const stored = article.ticker?.trim().toUpperCase() ?? "";
  if (!isDeprecatedTicker(stored)) return stored;
  return inferTickerFromText(articleInferenceText(article)).ticker;
}

/** Display ticker for feed cards and UI */
export function getArticleDisplayTicker(article: {
  ticker: string;
  headline: string;
  subheading?: string;
  body?: string;
}): string {
  return resolveArticleTicker(article);
}

/** Display ticker for a saved watchlist row — always inferred from title, never from DB */
export function resolveSavedTicker(entry: { articleTitle: string }): string {
  return inferTickerFromText(entry.articleTitle).ticker;
}

/** Resolve company name & logo for a ticker symbol */
export function getTickerMetaBySymbol(ticker: string): TickerMeta {
  const upper = ticker.toUpperCase();
  if (TICKER_BY_SYMBOL[upper]) return TICKER_BY_SYMBOL[upper];

  return {
    ticker: upper,
    companyName: upper,
    market: "NYSE",
    sector: "Finance",
    tags: [upper],
    logoColor: "#6b7280",
  };
}
