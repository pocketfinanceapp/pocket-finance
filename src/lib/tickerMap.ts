import type { MarketExchange, Sector } from "./types";
import { isPrivateTicker } from "./privateTickers";

export interface TickerMeta {
  ticker: string;
  companyName: string;
  market: MarketExchange;
  sector: Sector;
  tags: string[];
  logoColor: string;
}

function meta(
  ticker: string,
  companyName: string,
  market: MarketExchange,
  sector: Sector,
  logoColor: string,
  tags: string[] = [ticker]
): TickerMeta {
  return { ticker, companyName, market, sector, tags, logoColor };
}

/** Canonical metadata keyed by ticker symbol */
const BASE_METAS: Record<string, TickerMeta> = {
  AAPL: meta("AAPL", "Apple Inc.", "NASDAQ", "Technology", "#555555"),
  MSFT: meta("MSFT", "Microsoft Corporation", "NASDAQ", "Technology", "#00a4ef"),
  GOOGL: meta("GOOGL", "Alphabet Inc.", "NASDAQ", "Technology", "#4285f4"),
  AMZN: meta("AMZN", "Amazon.com, Inc.", "NASDAQ", "Consumer", "#ff9900"),
  TSLA: meta("TSLA", "Tesla, Inc.", "NASDAQ", "Consumer", "#cc0000"),
  META: meta("META", "Meta Platforms, Inc.", "NASDAQ", "Technology", "#0668e1"),
  NVDA: meta("NVDA", "NVIDIA Corporation", "NASDAQ", "Technology", "#76b900"),
  NFLX: meta("NFLX", "Netflix, Inc.", "NASDAQ", "Technology", "#e50914"),
  AMD: meta("AMD", "Advanced Micro Devices", "NASDAQ", "Technology", "#ed1c24"),
  INTC: meta("INTC", "Intel Corporation", "NASDAQ", "Technology", "#0071c5"),
  AVGO: meta("AVGO", "Broadcom Inc.", "NASDAQ", "Technology", "#cc092f"),
  LULU: meta("LULU", "Lululemon Athletica", "NASDAQ", "Consumer", "#d31334"),
  BTC: meta("BTC", "Bitcoin", "NASDAQ", "Crypto", "#f7931a", ["BTC", "Crypto"]),
  ETH: meta("ETH", "Ethereum", "NASDAQ", "Crypto", "#627eea", ["ETH", "Crypto"]),
  JPM: meta("JPM", "JPMorgan Chase & Co.", "NYSE", "Finance", "#006747"),
  GS: meta("GS", "Goldman Sachs Group", "NYSE", "Finance", "#6cace4"),
  XOM: meta("XOM", "Exxon Mobil Corporation", "NYSE", "Energy", "#e4002b"),
  BHP: meta("BHP", "BHP Group", "ASX", "Mining", "#e3530d"),
  COIN: meta("COIN", "Coinbase Global, Inc.", "NASDAQ", "Crypto", "#0052ff"),
  JNJ: meta("JNJ", "Johnson & Johnson", "NYSE", "Healthcare", "#d51900"),
  SONY: meta("SONY", "Sony Group Corporation", "Nikkei", "Technology", "#000000"),
  BA: meta("BA", "Boeing Company", "NYSE", "Technology", "#0033a0"),
  DIS: meta("DIS", "The Walt Disney Company", "NYSE", "Consumer", "#113ccf"),
  WMT: meta("WMT", "Walmart Inc.", "NYSE", "Consumer", "#0071ce"),
  KO: meta("KO", "The Coca-Cola Company", "NYSE", "Consumer", "#f40009"),
  PEP: meta("PEP", "PepsiCo, Inc.", "NASDAQ", "Consumer", "#004b93"),
  NKE: meta("NKE", "Nike, Inc.", "NYSE", "Consumer", "#111111"),
  SBUX: meta("SBUX", "Starbucks Corporation", "NASDAQ", "Consumer", "#00704a"),
  PYPL: meta("PYPL", "PayPal Holdings, Inc.", "NASDAQ", "Finance", "#003087"),
  CRM: meta("CRM", "Salesforce, Inc.", "NYSE", "Technology", "#00a1e0"),
  ORCL: meta("ORCL", "Oracle Corporation", "NYSE", "Technology", "#f80000"),
  ADBE: meta("ADBE", "Adobe Inc.", "NASDAQ", "Technology", "#ff0000"),
  IBM: meta("IBM", "IBM Corporation", "NYSE", "Technology", "#054ada"),
  CSCO: meta("CSCO", "Cisco Systems, Inc.", "NASDAQ", "Technology", "#1ba0d7"),
  QCOM: meta("QCOM", "Qualcomm Incorporated", "NASDAQ", "Technology", "#3253dc"),
  UBER: meta("UBER", "Uber Technologies, Inc.", "NYSE", "Technology", "#000000"),
  ABNB: meta("ABNB", "Airbnb, Inc.", "NASDAQ", "Consumer", "#ff5a5f"),
  SHOP: meta("SHOP", "Shopify Inc.", "NYSE", "Technology", "#96bf48"),
  PLTR: meta("PLTR", "Palantir Technologies", "NYSE", "Technology", "#101828"),
  RIVN: meta("RIVN", "Rivian Automotive", "NASDAQ", "Consumer", "#1a1a1a"),
  F: meta("F", "Ford Motor Company", "NYSE", "Consumer", "#003478"),
  GM: meta("GM", "General Motors Company", "NYSE", "Consumer", "#0070c9"),
  TM: meta("TM", "Toyota Motor Corporation", "Nikkei", "Consumer", "#eb0a1e"),
  V: meta("V", "Visa Inc.", "NYSE", "Finance", "#1a1f71"),
  MA: meta("MA", "Mastercard Incorporated", "NYSE", "Finance", "#eb001b"),
  BRK: meta("BRK", "Berkshire Hathaway", "NYSE", "Finance", "#003b7a"),
  BAC: meta("BAC", "Bank of America Corp.", "NYSE", "Finance", "#012169"),
  WFC: meta("WFC", "Wells Fargo & Company", "NYSE", "Finance", "#cd1409"),
  C: meta("C", "Citigroup Inc.", "NYSE", "Finance", "#056dae"),
  MS: meta("MS", "Morgan Stanley", "NYSE", "Finance", "#002b51"),
  CVX: meta("CVX", "Chevron Corporation", "NYSE", "Energy", "#0066b2"),
  SHEL: meta("SHEL", "Shell plc", "LSE", "Energy", "#fbce07"),
  BP: meta("BP", "BP p.l.c.", "LSE", "Energy", "#009a44"),
  MRNA: meta("MRNA", "Moderna, Inc.", "NASDAQ", "Healthcare", "#c8102e"),
  PFE: meta("PFE", "Pfizer Inc.", "NYSE", "Healthcare", "#0093d0"),
  LLY: meta("LLY", "Eli Lilly and Company", "NYSE", "Healthcare", "#d52b1e"),
  MU: meta("MU", "Micron Technology, Inc.", "NASDAQ", "Technology", "#0071c5"),
  SNOW: meta("SNOW", "Snowflake Inc.", "NYSE", "Technology", "#29b5e8"),
  SPOT: meta("SPOT", "Spotify Technology", "NYSE", "Technology", "#1db954"),
  HOOD: meta("HOOD", "Robinhood Markets", "NASDAQ", "Finance", "#00c805"),
  SQ: meta("SQ", "Block, Inc.", "NYSE", "Finance", "#3d3d3d"),
  ASML: meta("ASML", "ASML Holding", "NASDAQ", "Technology", "#0f238c"),
  TSM: meta("TSM", "Taiwan Semiconductor", "NYSE", "Technology", "#1a3c8e"),
  ARM: meta("ARM", "Arm Holdings", "NASDAQ", "Technology", "#0091bd"),
  SMCI: meta("SMCI", "Super Micro Computer", "NASDAQ", "Technology", "#e31937"),
  COST: meta("COST", "Costco Wholesale", "NASDAQ", "Consumer", "#e31837"),
  HD: meta("HD", "The Home Depot", "NYSE", "Consumer", "#f96302"),
  MCD: meta("MCD", "McDonald's Corporation", "NYSE", "Consumer", "#ffc72c"),
  UNH: meta("UNH", "UnitedHealth Group", "NYSE", "Healthcare", "#002677"),
  OPENAI: meta("OPENAI", "OpenAI", "NASDAQ", "Technology", "#412991"),
  ANTHROPIC: meta("ANTHROPIC", "Anthropic", "NASDAQ", "Technology", "#CC9B7A"),
  SPACEX: meta("SPACEX", "SpaceX", "NASDAQ", "Technology", "#374151"),
  TATA: meta("TATA", "Tata Group", "BSE", "Finance", "#486aae"),
  RY: meta("RY", "Royal Bank of Canada", "TSX", "Finance", "#0051a5"),
  BNP: meta("BNP", "BNP Paribas", "Euronext", "Finance", "#00915a"),
  LVMH: meta("LVMH", "LVMH", "LSE", "Consumer", "#1a1a1a"),
};

/** Themed / index tickers */
export const THEME_SPX: TickerMeta = meta(
  "SPX",
  "S&P 500 Index",
  "NYSE",
  "Finance",
  "#6b7280",
  ["SPX", "Index"]
);
export const THEME_QQQ: TickerMeta = meta(
  "QQQ",
  "Nasdaq 100",
  "NASDAQ",
  "Finance",
  "#6b7280",
  ["QQQ", "Nasdaq"]
);
export const THEME_DJI: TickerMeta = meta(
  "DJI",
  "Dow Jones Industrial Average",
  "NYSE",
  "Finance",
  "#6b7280",
  ["DJI", "Dow"]
);
export const THEME_OIL: TickerMeta = meta(
  "OIL",
  "Crude Oil",
  "NYSE",
  "Energy",
  "#f97316",
  ["OIL", "Energy"]
);
export const THEME_GOLD: TickerMeta = meta(
  "GOLD",
  "Gold",
  "NYSE",
  "Mining",
  "#d4af37",
  ["GOLD", "Commodities"]
);
export const THEME_FED: TickerMeta = meta(
  "FED",
  "Federal Reserve",
  "NYSE",
  "Finance",
  "#1e3a5f",
  ["FED", "Rates"]
);
export const THEME_MARKET: TickerMeta = meta(
  "MARKET",
  "Broad Market",
  "NYSE",
  "Finance",
  "#6b7280",
  ["MARKET", "Economy"]
);

BASE_METAS.SPX = THEME_SPX;
BASE_METAS.QQQ = THEME_QQQ;
BASE_METAS.DJI = THEME_DJI;
BASE_METAS.OIL = THEME_OIL;
BASE_METAS.GOLD = THEME_GOLD;
BASE_METAS.FED = THEME_FED;
BASE_METAS.MARKET = THEME_MARKET;

/** Company name / alias → ticker symbol (60+ entries) */
const COMPANY_ALIASES: Array<[string, string]> = [
  ["lululemon", "LULU"],
  ["apple", "AAPL"],
  ["microsoft", "MSFT"],
  ["msft", "MSFT"],
  ["google", "GOOGL"],
  ["alphabet", "GOOGL"],
  ["amazon", "AMZN"],
  ["tesla", "TSLA"],
  ["meta platforms", "META"],
  ["meta", "META"],
  ["facebook", "META"],
  ["nvidia", "NVDA"],
  ["nvda", "NVDA"],
  ["netflix", "NFLX"],
  ["openai", "OPENAI"],
  ["anthropic", "ANTHROPIC"],
  ["spacex", "SPACEX"],
  ["tata", "TATA"],
  ["intel", "INTC"],
  ["broadcom", "AVGO"],
  ["advanced micro devices", "AMD"],
  ["amd", "AMD"],
  ["bitcoin", "BTC"],
  ["btc", "BTC"],
  ["ethereum", "ETH"],
  ["eth", "ETH"],
  ["jpmorgan", "JPM"],
  ["goldman sachs", "GS"],
  ["exxon", "XOM"],
  ["exxon mobil", "XOM"],
  ["bhp", "BHP"],
  ["coinbase", "COIN"],
  ["johnson & johnson", "JNJ"],
  ["sony", "SONY"],
  ["boeing", "BA"],
  ["disney", "DIS"],
  ["walmart", "WMT"],
  ["coca-cola", "KO"],
  ["coca cola", "KO"],
  ["pepsico", "PEP"],
  ["pepsi", "PEP"],
  ["nike", "NKE"],
  ["starbucks", "SBUX"],
  ["paypal", "PYPL"],
  ["salesforce", "CRM"],
  ["oracle", "ORCL"],
  ["adobe", "ADBE"],
  ["ibm", "IBM"],
  ["cisco", "CSCO"],
  ["qualcomm", "QCOM"],
  ["uber", "UBER"],
  ["airbnb", "ABNB"],
  ["shopify", "SHOP"],
  ["palantir", "PLTR"],
  ["rivian", "RIVN"],
  ["ford motor", "F"],
  ["ford", "F"],
  ["general motors", "GM"],
  ["toyota", "TM"],
  ["visa", "V"],
  ["mastercard", "MA"],
  ["berkshire hathaway", "BRK"],
  ["bank of america", "BAC"],
  ["wells fargo", "WFC"],
  ["citigroup", "C"],
  ["morgan stanley", "MS"],
  ["chevron", "CVX"],
  ["shell", "SHEL"],
  ["bp", "BP"],
  ["moderna", "MRNA"],
  ["pfizer", "PFE"],
  ["eli lilly", "LLY"],
  ["micron", "MU"],
  ["snowflake", "SNOW"],
  ["spotify", "SPOT"],
  ["robinhood", "HOOD"],
  ["block inc", "SQ"],
  ["square", "SQ"],
  ["asml", "ASML"],
  ["taiwan semiconductor", "TSM"],
  ["tsmc", "TSM"],
  ["arm holdings", "ARM"],
  ["super micro", "SMCI"],
  ["costco", "COST"],
  ["home depot", "HD"],
  ["mcdonald's", "MCD"],
  ["mcdonalds", "MCD"],
  ["unitedhealth", "UNH"],
];

const TICKER_MAP: Record<string, TickerMeta> = {};
for (const [alias, symbol] of COMPANY_ALIASES) {
  const base = BASE_METAS[symbol];
  if (base) TICKER_MAP[alias] = base;
}

const TICKER_BY_SYMBOL: Record<string, TickerMeta> = { ...BASE_METAS };

const NAME_KEYS = Object.entries(TICKER_MAP).sort(
  (a, b) => b[0].length - a[0].length
);

/** Symbols to scan in text — MARKET excluded (matches common word "market") */
const SCANNABLE_SYMBOLS = Object.keys(TICKER_BY_SYMBOL)
  .filter((s) => s !== "MARKET")
  .sort((a, b) => b.length - a.length);

const DEPRECATED_TICKERS = new Set(["", "SPY", "MARKET"]);

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchSymbol(text: string, symbol: string): boolean {
  const sym = escapeRegex(symbol);
  return new RegExp(
    `(?:\\$${sym}(?![A-Za-z0-9])|\\(${sym}(?![A-Za-z0-9])|(?<![A-Za-z0-9])${sym}(?![A-Za-z0-9]))`,
    "i"
  ).test(text);
}

function matchName(text: string, name: string): boolean {
  return new RegExp(`\\b${escapeRegex(name)}\\b`, "i").test(text);
}

const SPX_RE =
  /\bs&p\s*500\b|\bs&p500\b|\bsp\s*500\b|\bspx\b|\bs&p\b/i;
const QQQ_RE =
  /\bnasdaq\s*(100|composite|index)\b|\binvesco\s+qqq\b|\bqqq\b/i;
const DJI_RE = /\bdow\s*jones\b|\bdjia\b|\bdow\s+industrial\b|\bdow\s+30\b/i;
const OIL_RE =
  /\boil\s+prices?\b|\bcrude\s+oil\b|\bpetroleum\b|\bbrent\s+crude\b|\bwti\b|\bopec\b|\bcrude\b/i;
const OIL_COMPANY_RE =
  /\bexxon\b|\bxom\b|\bchevron\b|\bcvx\b|\bshell\b|\bbp\b|\bconocophillips\b/i;
const GOLD_RE = /\bgold\s+prices?\b|\bgold\s+futures?\b|\bxau\b|\bspot\s+gold\b/i;
const FED_RE =
  /\bfederal\s+reserve\b|\bthe\s+fed\b|\bfed\s+(rate|rates|chair|meeting|policy|decision|funds)\b|\bfomc\b/i;

function inferThemedTicker(text: string): TickerMeta | null {
  if (SPX_RE.test(text)) return THEME_SPX;
  if (QQQ_RE.test(text)) return THEME_QQQ;
  if (DJI_RE.test(text)) return THEME_DJI;
  if (GOLD_RE.test(text)) return THEME_GOLD;
  if (FED_RE.test(text)) return THEME_FED;
  if (OIL_RE.test(text) && !OIL_COMPANY_RE.test(text)) return THEME_OIL;
  return null;
}

function findMatchInText(text: string): TickerMeta | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  for (const symbol of SCANNABLE_SYMBOLS) {
    if (matchSymbol(trimmed, symbol)) {
      return TICKER_BY_SYMBOL[symbol];
    }
  }

  for (const [key, entry] of NAME_KEYS) {
    if (matchName(trimmed, key)) return entry;
  }

  return inferThemedTicker(trimmed);
}

/** Scan title then description — first strong match wins */
export function inferTickerFromFields(
  title: string,
  description = ""
): TickerMeta {
  const titleHit = findMatchInText(title);
  if (titleHit) return titleHit;

  const descHit = findMatchInText(description);
  if (descHit) return descHit;

  return THEME_MARKET;
}

/** @deprecated Use inferTickerFromFields */
export function inferTickerFromText(text: string): TickerMeta {
  return inferTickerFromFields(text, "");
}

/** Resolve ticker from article title + description for display and persistence */
export function resolveArticleTicker(article: {
  ticker: string;
  headline: string;
  subheading?: string;
  body?: string;
}): string {
  return inferTickerFromFields(
    article.headline,
    article.subheading ?? ""
  ).ticker;
}

export function getArticleDisplayTicker(article: {
  ticker: string;
  headline: string;
  subheading?: string;
  body?: string;
}): string {
  return resolveArticleTicker(article);
}

export function resolveSavedTicker(entry: {
  articleTitle: string;
  articleDescription?: string;
}): string {
  return inferTickerFromFields(
    entry.articleTitle,
    entry.articleDescription ?? ""
  ).ticker;
}

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

const CRYPTO_DISPLAY_TICKERS = new Set(["BTC", "ETH"]);
const COMMODITY_DISPLAY_TICKERS = new Set(["OIL", "GOLD"]);
const US_MARKETS_DISPLAY_TICKERS = new Set([
  "FED",
  "MARKET",
  "SPX",
  "QQQ",
  "DJI",
]);

/** Feed card exchange label — derived from ticker, not article index */
export function resolveMarketForTicker(ticker: string): MarketExchange {
  const upper = ticker.toUpperCase();

  if (CRYPTO_DISPLAY_TICKERS.has(upper)) return "CRYPTO";
  if (COMMODITY_DISPLAY_TICKERS.has(upper)) return "COMMODITIES";
  if (US_MARKETS_DISPLAY_TICKERS.has(upper)) return "US MARKETS";
  if (isPrivateTicker(upper)) return "NASDAQ";

  return getTickerMetaBySymbol(upper).market;
}
