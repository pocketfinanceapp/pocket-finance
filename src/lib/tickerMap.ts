import type { MarketExchange, Sector } from "./types";
import { isPrivateTicker } from "./privateTickers";
import {
  getCryptoBrandColor,
  getCryptoDisplayName,
  isCryptoAssetTicker,
} from "./cryptoBrand";

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
  BTC: meta("BTC", "Bitcoin", "CRYPTO", "Crypto", "#f7931a", ["BTC", "Crypto"]),
  ETH: meta("ETH", "Ethereum", "CRYPTO", "Crypto", "#627eea", ["ETH", "Crypto"]),
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
  GOOG: meta("GOOG", "Alphabet Inc. Class C", "NASDAQ", "Technology", "#4285f4"),
  SNAP: meta("SNAP", "Snap Inc.", "NYSE", "Technology", "#fffc00"),
  PINS: meta("PINS", "Pinterest, Inc.", "NYSE", "Technology", "#e60023"),
  MSTR: meta("MSTR", "MicroStrategy Inc.", "NASDAQ", "Technology", "#fa660f"),
  BABA: meta("BABA", "Alibaba Group", "NYSE", "Technology", "#ff6a00"),
  TCEHY: meta("TCEHY", "Tencent Holdings", "NYSE", "Technology", "#00a4e4"),
  INFY: meta("INFY", "Infosys Limited", "NYSE", "Technology", "#007cc3"),
  COP: meta("COP", "ConocoPhillips", "NYSE", "Energy", "#ed1c24"),
  NEM: meta("NEM", "Newmont Corporation", "NYSE", "Mining", "#ffc72c"),
  SPY: meta("SPY", "SPDR S&P 500 ETF", "NYSE", "Finance", "#1e3a5f"),
  QQQ: meta("QQQ", "Invesco QQQ Trust", "NASDAQ", "Finance", "#006747"),
  DIA: meta("DIA", "SPDR Dow Jones ETF", "NYSE", "Finance", "#003b7a"),
  IWM: meta("IWM", "iShares Russell 2000 ETF", "NYSE", "Finance", "#7c3aed"),
  SOXX: meta("SOXX", "iShares Semiconductor ETF", "NASDAQ", "Technology", "#00a4ef"),
  XLK: meta("XLK", "Technology Select Sector SPDR", "NYSE", "Technology", "#3b6ef5"),
  NET: meta("NET", "Cloudflare, Inc.", "NYSE", "Technology", "#f38020"),
  CRWD: meta("CRWD", "CrowdStrike Holdings", "NASDAQ", "Technology", "#e01e5a"),
  PANW: meta("PANW", "Palo Alto Networks", "NASDAQ", "Technology", "#fa582d"),
  DDOG: meta("DDOG", "Datadog, Inc.", "NASDAQ", "Technology", "#632ca6"),
  ZS: meta("ZS", "Zscaler, Inc.", "NASDAQ", "Technology", "#0092bc"),
  INTU: meta("INTU", "Intuit Inc.", "NASDAQ", "Technology", "#236cff"),
  BKNG: meta("BKNG", "Booking Holdings", "NASDAQ", "Consumer", "#003580"),
  RIOT: meta("RIOT", "Riot Platforms", "NASDAQ", "Crypto", "#7c4dff"),
  MARA: meta("MARA", "MARA Holdings", "NASDAQ", "Crypto", "#ff6b00"),
  PDD: meta("PDD", "PDD Holdings", "NASDAQ", "Consumer", "#e02e24"),
  JD: meta("JD", "JD.com, Inc.", "NASDAQ", "Consumer", "#e1251b"),
  SCHW: meta("SCHW", "Charles Schwab", "NYSE", "Finance", "#00a0df"),
  BLK: meta("BLK", "BlackRock, Inc.", "NYSE", "Finance", "#000000"),
  AXP: meta("AXP", "American Express", "NYSE", "Finance", "#006fcf"),
  ABBV: meta("ABBV", "AbbVie Inc.", "NYSE", "Healthcare", "#071d49"),
  TMO: meta("TMO", "Thermo Fisher Scientific", "NYSE", "Healthcare", "#e71316"),
  MRK: meta("MRK", "Merck & Co.", "NYSE", "Healthcare", "#00857c"),
  PG: meta("PG", "Procter & Gamble", "NYSE", "Consumer", "#003da5"),
  TGT: meta("TGT", "Target Corporation", "NYSE", "Consumer", "#cc0000"),
  NOW: meta("NOW", "ServiceNow, Inc.", "NYSE", "Technology", "#81b5a1"),
  TXN: meta("TXN", "Texas Instruments", "NASDAQ", "Technology", "#cc0000"),
  AMAT: meta("AMAT", "Applied Materials", "NASDAQ", "Technology", "#00629b"),
  LRCX: meta("LRCX", "Lam Research", "NASDAQ", "Technology", "#005587"),
  SLB: meta("SLB", "SLB N.V.", "NYSE", "Energy", "#005eb8"),
  VZ: meta("VZ", "Verizon Communications", "NYSE", "Technology", "#cd040b"),
  CMCSA: meta("CMCSA", "Comcast Corporation", "NASDAQ", "Technology", "#000000"),
  CAT: meta("CAT", "Caterpillar Inc.", "NYSE", "Technology", "#ffcd11"),
  DE: meta("DE", "Deere & Company", "NYSE", "Technology", "#367c2b"),
  RTX: meta("RTX", "RTX Corporation", "NYSE", "Technology", "#002d72"),
  LMT: meta("LMT", "Lockheed Martin", "NYSE", "Technology", "#003087"),
  SOL: meta("SOL", "Solana", "CRYPTO", "Crypto", "#9945ff", ["SOL", "Crypto"]),
  BNB: meta("BNB", "BNB", "CRYPTO", "Crypto", "#f3ba2f", ["BNB", "Crypto"]),
  XRP: meta("XRP", "XRP", "CRYPTO", "Crypto", "#0a74da", ["XRP", "Crypto"]),
  ADA: meta("ADA", "Cardano", "CRYPTO", "Crypto", "#0033ad", ["ADA", "Crypto"]),
  DOGE: meta("DOGE", "Dogecoin", "CRYPTO", "Crypto", "#c2a633", ["DOGE", "Crypto"]),
  AVAX: meta("AVAX", "Avalanche", "CRYPTO", "Crypto", "#e84142", ["AVAX", "Crypto"]),
  DOT: meta("DOT", "Polkadot", "CRYPTO", "Crypto", "#e6007a", ["DOT", "Crypto"]),
  LINK: meta("LINK", "Chainlink", "CRYPTO", "Crypto", "#375bd2", ["LINK", "Crypto"]),
  MATIC: meta("MATIC", "Polygon", "CRYPTO", "Crypto", "#8247e5", ["MATIC", "Crypto"]),
  SHIB: meta("SHIB", "Shiba Inu", "CRYPTO", "Crypto", "#ffa409", ["SHIB", "Crypto"]),
  LTC: meta("LTC", "Litecoin", "CRYPTO", "Crypto", "#345d9d", ["LTC", "Crypto"]),
  UNI: meta("UNI", "Uniswap", "CRYPTO", "Crypto", "#ff007a", ["UNI", "Crypto"]),
  ATOM: meta("ATOM", "Cosmos", "CRYPTO", "Crypto", "#2e3148", ["ATOM", "Crypto"]),
  TRX: meta("TRX", "TRON", "CRYPTO", "Crypto", "#ef0027", ["TRX", "Crypto"]),
  TON: meta("TON", "Toncoin", "CRYPTO", "Crypto", "#0098ea", ["TON", "Crypto"]),
  NEAR: meta("NEAR", "NEAR Protocol", "CRYPTO", "Crypto", "#00c08b", ["NEAR", "Crypto"]),
  APT: meta("APT", "Aptos", "CRYPTO", "Crypto", "#00bfff", ["APT", "Crypto"]),
  ARB: meta("ARB", "Arbitrum", "CRYPTO", "Crypto", "#28a0f0", ["ARB", "Crypto"]),

  // Market-profile constituents that previously lacked identity metadata
  SAP: meta("SAP", "SAP SE", "NYSE", "Technology", "#008fd3"),
  NVS: meta("NVS", "Novartis AG", "NYSE", "Healthcare", "#0460a9"),
  ROG: meta("ROG", "Roche Holding AG", "SIX", "Healthcare", "#e11b22"),
  UBS: meta("UBS", "UBS Group AG", "NYSE", "Finance", "#e6001a"),
  NESN: meta("NESN", "Nestlé S.A.", "SIX", "Consumer", "#005ea8"),
  ABBN: meta("ABBN", "ABB Ltd", "SIX", "Technology", "#ff000f"),
  ZURN: meta("ZURN", "Zurich Insurance Group", "SIX", "Finance", "#003d6b"),
  VALE: meta("VALE", "Vale S.A.", "NYSE", "Mining", "#007e54"),
  PETR: meta("PETR", "Petrobras", "B3", "Energy", "#00853f"),
  ITUB: meta("ITUB", "Itaú Unibanco", "NYSE", "Finance", "#ec7000"),
  BBD: meta("BBD", "Banco Bradesco", "NYSE", "Finance", "#cc092f"),
  ABEV: meta("ABEV", "Ambev S.A.", "NYSE", "Consumer", "#cf0a2c"),
  WEGE: meta("WEGE", "WEG S.A.", "B3", "Technology", "#0055a5"),
  AMX: meta("AMX", "América Móvil", "NYSE", "Technology", "#005dab"),
  WALMEX: meta("WALMEX", "Walmart de México", "BMV", "Consumer", "#0071ce"),
  BIMBO: meta("BIMBO", "Grupo Bimbo", "BMV", "Consumer", "#0033a0"),
  CEMEX: meta("CEMEX", "Cemex S.A.B.", "BMV", "Mining", "#f36c21"),
  FEMSA: meta("FEMSA", "FEMSA", "BMV", "Consumer", "#c8102e"),
  ARAMCO: meta("ARAMCO", "Saudi Aramco", "TADAWUL", "Energy", "#00a651"),
  RJHI: meta("RJHI", "Al Rajhi Bank", "TADAWUL", "Finance", "#006b3f"),
  SABIC: meta("SABIC", "SABIC", "TADAWUL", "Energy", "#004b87"),
  STC: meta("STC", "Saudi Telecom", "TADAWUL", "Technology", "#6d1a7f"),
  MAADEN: meta("MAADEN", "Ma'aden", "TADAWUL", "Mining", "#8b5e00"),
  SAM: meta("SAM", "Samsung Electronics", "KRX", "Technology", "#1428a0"),
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

  // These ~45 companies already had a full BASE_METAS entry (ticker,
  // sector, logo color) but no text-matchable name alias, so whenever
  // Marketaux's own entity match came back empty for an article about one
  // of them, inferTickerFromFields had nothing to find and silently fell
  // through to the generic "Broad Market" theme — e.g. a "BlackRock Shares
  // Rally After Assets Soar Past $15 Trillion" headline swiping right to
  // "this story doesn't have a company profile" instead of BlackRock's.
  // Aliases below are deliberately full/distinctive names, not bare
  // 3-4 letter words, to avoid false-positive matches on ordinary English
  // (e.g. "target", "riot", "booking", "sap" are skipped as too generic).
  ["royal bank of canada", "RY"],
  ["bnp paribas", "BNP"],
  ["pinterest", "PINS"],
  ["microstrategy", "MSTR"],
  ["alibaba", "BABA"],
  ["tencent", "TCEHY"],
  ["infosys", "INFY"],
  ["conocophillips", "COP"],
  ["newmont", "NEM"],
  ["cloudflare", "NET"],
  ["crowdstrike", "CRWD"],
  ["palo alto networks", "PANW"],
  ["datadog", "DDOG"],
  ["zscaler", "ZS"],
  ["intuit", "INTU"],
  ["booking holdings", "BKNG"],
  ["riot platforms", "RIOT"],
  ["jd.com", "JD"],
  ["charles schwab", "SCHW"],
  ["blackrock", "BLK"],
  ["american express", "AXP"],
  ["abbvie", "ABBV"],
  ["thermo fisher scientific", "TMO"],
  ["thermo fisher", "TMO"],
  ["merck", "MRK"],
  ["procter & gamble", "PG"],
  ["procter and gamble", "PG"],
  ["target corporation", "TGT"],
  ["servicenow", "NOW"],
  ["texas instruments", "TXN"],
  ["applied materials", "AMAT"],
  ["lam research", "LRCX"],
  ["verizon", "VZ"],
  ["comcast", "CMCSA"],
  ["caterpillar", "CAT"],
  ["deere & company", "DE"],
  ["john deere", "DE"],
  ["lockheed martin", "LMT"],
  ["novartis", "NVS"],
  ["roche holding", "ROG"],
  ["ubs group", "UBS"],
  ["nestle", "NESN"],
  ["nestlé", "NESN"],
  ["zurich insurance", "ZURN"],
  ["petrobras", "PETR"],
  ["itau unibanco", "ITUB"],
  ["itaú unibanco", "ITUB"],
  ["banco bradesco", "BBD"],
  ["ambev", "ABEV"],
  ["america movil", "AMX"],
  ["américa móvil", "AMX"],
  ["walmart de mexico", "WALMEX"],
  ["grupo bimbo", "BIMBO"],
  ["saudi aramco", "ARAMCO"],
  ["al rajhi bank", "RJHI"],
  ["saudi telecom", "STC"],
  ["ma'aden", "MAADEN"],
  ["samsung electronics", "SAM"],
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

/**
 * Marketaux identifies entities directly, but on a "markets wrap"-style
 * story that never actually mentions oil/gold/an index by name in the
 * headline, a single incidental commodity/index word buried in the
 * description (e.g. "...Oil declined.") can still win as the top-scored
 * entity and drag the whole article into the wrong theme (a Kospi/chips
 * selloff story getting tagged "Crude Oil"). Only trust Marketaux's pick
 * for a macro/commodity theme ticker when the headline itself genuinely
 * supports that theme; otherwise fall back to our own text inference.
 */
export function macroThemeConfirmedByTitle(symbol: string, title: string): boolean {
  switch (symbol.trim().toUpperCase()) {
    case "OIL":
      return OIL_RE.test(title) && !OIL_COMPANY_RE.test(title);
    case "GOLD":
      return GOLD_RE.test(title);
    case "SPX":
      return SPX_RE.test(title);
    case "QQQ":
      return QQQ_RE.test(title);
    case "DJI":
      return DJI_RE.test(title);
    case "FED":
      return FED_RE.test(title);
    default:
      return true;
  }
}

const TITLE_WEIGHT = 3;
const DESC_WEIGHT = 1;

function addTickerScore(
  scores: Map<string, number>,
  ticker: string,
  points: number
): void {
  if (points <= 0) return;
  scores.set(ticker, (scores.get(ticker) ?? 0) + points);
}

/**
 * True only for headlines genuinely ABOUT the broad market/an index itself,
 * never for a single-company story that merely mentions an index for
 * context (e.g. "Apple Leads Dow Higher on Strong Earnings" is an Apple
 * story, not a broad-market one). Bare `/\bdow\b/` and `/\bs&p 500\b/`
 * checks used to short-circuit here — a headline just containing the word
 * "Dow" was enough to force the generic "Broad Market" tag ahead of any
 * per-company scoring, which meant real single-company stories could get
 * misclassified as a market-theme story with no company profile to show.
 * These now require an index-level action verb, not just a mention.
 */
function isGeneralMarketTitle(title: string): boolean {
  const lower = title.trim().toLowerCase();
  if (lower.startsWith("stock market today")) return true;
  if (/:\s*markets?\s+wrap\s*$/i.test(lower)) return true;

  const indexAction =
    /(jones|industrial|30|futures?|closes?|opens?|ends?|falls?|rises?|gains?|drops?|slides?|climbs?|jumps?|sinks?|rallies|tumbles?|surges?|plunges?|recovers?|hits?|extends?)/;

  return (
    lower.includes("leads upside") ||
    lower.includes("market rise") ||
    lower.includes("market rally") ||
    new RegExp(`\\bdow\\s+${indexAction.source}\\b`, "i").test(title) ||
    new RegExp(`\\bs&p\\s*500\\s+${indexAction.source}\\b`, "i").test(title) ||
    lower.includes("nasdaq rise") ||
    lower.includes("wholesale inflation")
  );
}

function isSpaceXPrimaryTopic(title: string, description: string): boolean {
  const titleLower = title.toLowerCase();
  const full = `${title} ${description}`.toLowerCase();
  if (!/\bspacex\b/i.test(full)) return false;

  if (/\bspacex\b/i.test(titleLower)) return true;

  return /\bspacex\b[^.]{0,120}\b(ipo|initial public offering|valuation|listing|offering|starship|falcon|rocket|launch|satellite|starlink)\b|\b(ipo|initial public offering|listing)\b[^.]{0,120}\bspacex\b/i.test(
    full
  );
}

function applyMuskTeslaHeuristics(
  title: string,
  description: string,
  scores: Map<string, number>
): void {
  const text = `${title} ${description}`.toLowerCase();
  const musk =
    /\belon\s+musk\b|\bmusk'?s\b|\bmusk\b/i.test(text);
  const teslaContext = /\btesla\b|\btsla\b/i.test(text);
  const wealthContext =
    /\bnet worth\b|\bwealth\b|\bfortune\b|\bbillionaire\b|\brichest\b|\bnet\s+value\b/i.test(
      text
    );

  if (musk && (teslaContext || wealthContext)) {
    addTickerScore(scores, "TSLA", TITLE_WEIGHT * 2);
    if (!isSpaceXPrimaryTopic(title, description)) {
      scores.delete("SPACEX");
    }
  }
}

function scoreTextForTickers(
  text: string,
  weight: number,
  scores: Map<string, number>
): void {
  const trimmed = text.trim();
  if (!trimmed) return;

  for (const symbol of SCANNABLE_SYMBOLS) {
    if (matchSymbol(trimmed, symbol)) {
      addTickerScore(scores, symbol, weight);
    }
  }

  for (const [key, entry] of NAME_KEYS) {
    if (matchName(trimmed, key)) {
      addTickerScore(scores, entry.ticker, weight);
    }
  }

  const themed = inferThemedTicker(trimmed);
  if (themed) {
    addTickerScore(scores, themed.ticker, weight);
  }
}

function pickBestTicker(scores: Map<string, number>): TickerMeta | null {
  let bestTicker: string | null = null;
  let bestScore = 0;

  for (const [ticker, score] of scores) {
    if (ticker === "MARKET") continue;
    if (score > bestScore) {
      bestScore = score;
      bestTicker = ticker;
    }
  }

  if (!bestTicker || bestScore <= 0) return null;
  return TICKER_BY_SYMBOL[bestTicker] ?? getTickerMetaBySymbol(bestTicker);
}

/**
 * A hand-maintained alias list can never cover every company that might
 * appear in the news — there will always be smaller names (a biotech with
 * a single drug approval, a regional bank, etc.) that aren't in our ~170
 * entry catalog and that Marketaux itself doesn't tag with an entity. Rather
 * than let those silently fall into the "Broad Market" bucket (which then
 * tells the user, incorrectly, "this story is tagged under a market theme
 * rather than a specific company"), only use that fallback when the text
 * actually reads like a broad-market/economy piece.
 */
const BROAD_MARKET_SIGNAL_RE =
  /\bwall\s+street\b|\bstock\s+market\b|\bglobal\s+markets?\b|\bfutures\b|\bindices\b|\binflation\b|\bjobs\s+report\b|\bnonfarm\s+payrolls\b|\bunemployment\b|\bgdp\b|\brecession\b|\brate\s+(?:hike|cut|decision)\b|\btreasury\s+yields?\b|\bbond\s+market\b|\beconomic\s+data\b|\bconsumer\s+prices?\b|\btariffs?\b|\btrade\s+war\b|\bcentral\s+banks?\b|\bearnings\s+season\b|\bmarkets?\s+(?:rally|selloff|rout|slide|dip|surge|wrap)\b/i;

function hasBroadMarketSignal(text: string): boolean {
  return BROAD_MARKET_SIGNAL_RE.test(text);
}

// Headline words that can lead a sentence but are never themselves the
// company being reported on — guards the extractor below against capturing
// junk like "This Biotech Stock" or "The Fed" as a "company name".
const NON_COMPANY_LEAD_WORDS = new Set([
  "the", "this", "these", "those", "a", "an", "us", "u.s", "why", "how",
  "what", "when", "where", "here", "breaking", "watch", "opinion",
  "analysis", "explainer", "report", "reports", "stock", "stocks",
  "shares", "market", "markets", "global", "world", "asian", "european",
  "wall", "fed", "federal",
]);

function isPlausibleCompanyName(candidate: string): boolean {
  const trimmed = candidate.trim();
  if (trimmed.length < 2 || trimmed.length > 40) return false;
  const firstWord = trimmed.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z.]/g, "");
  return Boolean(firstWord) && !NON_COMPANY_LEAD_WORDS.has(firstWord);
}

// "BlackRock Shares Rally After..." / "Acme Corp Stock Jumps on..." — one of
// the most common single-company headline templates in financial news.
const SHARES_STOCK_LEAD_RE =
  /^([A-Z][A-Za-z0-9.&'-]*(?:\s+[A-Z][A-Za-z0-9.&'-]*){0,3})\s+(?:Shares?|Stock)\s+(?:Rall(?:y|ies)|Falls?|Fall|Jumps?|Soars?|Soar|Plunges?|Plunge|Tumbles?|Tumble|Sinks?|Sink|Slides?|Slide|Surges?|Surge|Climbs?|Climb|Drops?|Drop|Gains?|Gain|Rises?|Rise|Sheds?|Slips?|Slip|Rebounds?)\b/;

// "Celcuity just won FDA approval..." / "Acme Corp's CEO said..." — a
// leading proper noun followed by a reporting verb or possessive, used to
// recover a company name mentioned only in the description.
const ATTRIBUTION_LEAD_RE =
  /^([A-Z][A-Za-z0-9.&'-]*(?:\s+[A-Z][A-Za-z0-9.&'-]*){0,3})(?:'s\b|\s+(?:just|said|reported|announced|posted|plans?|is|was|has|had|will|won|filed|raised|cut|swung|forecasts?)\b)/;

function extractLikelyCompanyName(title: string, description: string): string | null {
  const titleTrimmed = title.trim();
  const descTrimmed = description.trim();

  const sharesMatch = titleTrimmed.match(SHARES_STOCK_LEAD_RE);
  if (sharesMatch && isPlausibleCompanyName(sharesMatch[1])) {
    return sharesMatch[1].trim();
  }

  const titleAttrMatch = titleTrimmed.match(ATTRIBUTION_LEAD_RE);
  if (titleAttrMatch && isPlausibleCompanyName(titleAttrMatch[1])) {
    return titleAttrMatch[1].trim();
  }

  const descAttrMatch = descTrimmed.match(ATTRIBUTION_LEAD_RE);
  if (descAttrMatch && isPlausibleCompanyName(descAttrMatch[1])) {
    return descAttrMatch[1].trim();
  }

  return null;
}

/**
 * Best-effort placeholder for a company we can't map to a real ticker
 * symbol — not a macro/commodity ticker, so the swipe-right panel treats it
 * as a company (attempts a Wikidata lookup by name, and if that comes up
 * empty, shows the honest "we don't have background info on X yet" state
 * instead of the misleading "tagged under a market theme" one).
 */
function buildUnidentifiedCompanyMeta(name: string): TickerMeta {
  const pseudoTicker =
    name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) || "CO";
  return {
    ticker: pseudoTicker,
    companyName: name,
    market: "NYSE",
    sector: "Finance",
    tags: [pseudoTicker],
    logoColor: getTickerAccentColor(pseudoTicker),
  };
}

/** Scan title + description — highest weighted mention wins */
export function inferTickerFromFields(
  title: string,
  description = ""
): TickerMeta {
  if (isGeneralMarketTitle(title)) {
    return THEME_MARKET;
  }

  const scores = new Map<string, number>();

  scoreTextForTickers(title, TITLE_WEIGHT, scores);
  scoreTextForTickers(description, DESC_WEIGHT, scores);
  applyMuskTeslaHeuristics(title, description, scores);

  if (!isSpaceXPrimaryTopic(title, description)) {
    scores.delete("SPACEX");
  }

  const best = pickBestTicker(scores);
  if (best) return best;

  if (hasBroadMarketSignal(`${title} ${description}`)) {
    return THEME_MARKET;
  }

  const guessedName = extractLikelyCompanyName(title, description);
  if (guessedName) {
    return buildUnidentifiedCompanyMeta(guessedName);
  }

  return THEME_MARKET;
}

/** @deprecated Use inferTickerFromFields */
export function inferTickerFromText(text: string): TickerMeta {
  return inferTickerFromFields(text, "");
}

/**
 * Explicit Wikipedia search terms for macro/commodity/index theme tickers.
 * Our own internal display labels ("Broad Market") are UI shorthand, not
 * real-world topic names, so searching Wikidata for them directly wouldn't
 * reliably resolve — this maps each theme to the actual encyclopedia topic
 * it represents so the swipe-right panel can show real background info
 * (what crude oil is, what the Federal Reserve does, etc.) instead of a
 * static "no profile to show" placeholder.
 */
const MACRO_TOPIC_WIKI_SEARCH_TERMS: Record<string, string> = {
  OIL: "Petroleum",
  GOLD: "Gold as an investment",
  FED: "Federal Reserve",
  MARKET: "Stock market",
  SPX: "S&P 500",
  QQQ: "Nasdaq-100",
  DJI: "Dow Jones Industrial Average",
};

export function macroTopicWikiSearchTerm(ticker: string): string | null {
  return MACRO_TOPIC_WIKI_SEARCH_TERMS[ticker.trim().toUpperCase()] ?? null;
}

/**
 * Plain-language, factual explanation of how each macro/commodity/index
 * theme touches everyday life — deliberately static/hand-written rather
 * than AI-generated per article. Framed as "here's what this actually
 * touches" (gas prices, mortgage rates, retirement accounts), never as
 * "here's what to do about it" — we're not licensed to give investment
 * advice and don't want AI-generated copy drifting into that territory on
 * a per-article basis.
 */
const MACRO_TOPIC_EVERYDAY_IMPACT: Record<string, string> = {
  OIL: "Oil prices ripple into what you pay at the gas pump, for flights, and for anything trucked or shipped — they're also one of the bigger drivers of overall inflation.",
  GOLD: "Gold tends to move independently of stocks and the dollar, which is why it shows up in retirement portfolios and central bank reserves as a hedge during uncertain times.",
  FED: "The Federal Reserve sets a benchmark rate that ripples into mortgage rates, credit card APRs, savings account yields, and how expensive it is for businesses to borrow.",
  MARKET: "Broad market swings affect retirement accounts, 401(k)s, and pension funds — even people who never actively trade are often exposed through these accounts.",
  SPX: "The S&P 500 tracks 500 of the largest U.S. companies and is the benchmark most 401(k)s and index funds are measured against, so its moves reach far beyond active traders.",
  QQQ: "The Nasdaq-100 is heavily weighted toward technology companies, so its swings often reflect how the tech sector — and funds tracking it — are performing.",
  DJI: "The Dow tracks 30 large, well-known U.S. companies and is one of the most widely cited (though narrower) gauges of how 'the stock market' is doing on a given day.",
};

export function macroTopicEverydayImpact(ticker: string): string | null {
  return MACRO_TOPIC_EVERYDAY_IMPACT[ticker.trim().toUpperCase()] ?? null;
}

/**
 * Hand-curated industry clusters for "related companies" suggestions on the
 * swipe-right panel. Deliberately not derived from Wikidata's broad
 * "industry" claim or our own catalog-wide Sector field — both are too
 * coarse (a single "Technology" bucket spans chipmakers, cloud software,
 * and cybersecurity), which would make suggestions feel generic rather
 * than genuinely relevant. Each ticker appears in exactly one cluster.
 */
const RELATED_TICKER_CLUSTERS: string[][] = [
  ["AAPL", "MSFT", "GOOGL", "AMZN", "META"],
  ["NVDA", "AMD", "INTC", "AVGO", "QCOM", "TXN", "AMAT", "LRCX", "ASML", "TSM", "ARM", "SMCI", "MU"],
  ["CRM", "ORCL", "ADBE", "IBM", "NOW", "INTU", "SNOW", "DDOG"],
  ["CRWD", "PANW", "ZS", "NET"],
  ["SNAP", "PINS", "UBER", "ABNB", "SHOP", "PDD", "JD", "BABA", "TCEHY"],
  ["TSLA", "RIVN", "F", "GM", "TM"],
  ["JPM", "GS", "BAC", "WFC", "C", "MS", "SCHW", "BLK", "AXP"],
  ["V", "MA", "PYPL", "SQ", "HOOD"],
  ["XOM", "CVX", "SHEL", "BP", "COP", "SLB"],
  ["JNJ", "PFE", "MRNA", "LLY", "ABBV", "MRK", "UNH", "TMO"],
  ["KO", "PEP", "MCD", "SBUX", "NKE", "PG"],
  ["COIN", "MSTR", "RIOT", "MARA"],
  ["DIS", "NFLX", "SPOT", "SONY"],
  ["BA", "CAT", "DE", "RTX", "LMT"],
  ["VZ", "CMCSA"],
  ["BHP", "NEM", "VALE"],
  ["WMT", "COST", "HD", "TGT"],
];

const RELATED_TICKER_LOOKUP = new Map<string, string[]>();
for (const cluster of RELATED_TICKER_CLUSTERS) {
  for (const ticker of cluster) {
    if (!RELATED_TICKER_LOOKUP.has(ticker)) {
      RELATED_TICKER_LOOKUP.set(
        ticker,
        cluster.filter((t) => t !== ticker)
      );
    }
  }
}

/** Up to `limit` companies in the same industry cluster, for "you might also follow" suggestions. */
export function getRelatedTickers(ticker: string, limit = 3): TickerMeta[] {
  const upper = ticker.trim().toUpperCase();
  const siblings = RELATED_TICKER_LOOKUP.get(upper);
  if (!siblings || siblings.length === 0) return [];
  return siblings.slice(0, limit).map((sym) => getTickerMetaBySymbol(sym));
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

const VIVID_TICKER_COLORS = [
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
] as const;

function getTickerAccentColor(ticker: string): string {
  let hash = 0;
  for (const char of ticker) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return VIVID_TICKER_COLORS[hash % VIVID_TICKER_COLORS.length];
}

export function getKnownTickerSymbols(): string[] {
  return Object.keys(TICKER_BY_SYMBOL);
}

/**
 * Exchange suffix → market label, for tickers formatted like "WTC.AX" or
 * "8160.SR" that aren't in our local catalog. Marketaux (and most data
 * providers) append a country/exchange suffix to non-US tickers, so a
 * ticker WITH a suffix is never actually NYSE/NASDAQ — defaulting those to
 * NYSE (the old behavior) mislabeled every uncatalogued foreign stock as a
 * US one. Suffix-less tickers (the common case, e.g. "AAPL") still default
 * to NYSE below since that's the overwhelming majority in practice.
 */
const EXCHANGE_SUFFIX_MARKET: Record<string, MarketExchange> = {
  AX: "ASX", // Australia
  SR: "TADAWUL", // Saudi Arabia
  L: "LSE", // London
  HK: "HKEX", // Hong Kong
  T: "Nikkei", // Tokyo
  TO: "TSX", // Toronto
  V: "TSX", // TSX Venture
  SS: "SSE", // Shanghai
  SZ: "SSE", // Shenzhen
  KS: "KRX", // Korea
  KQ: "KRX",
  TW: "TWSE", // Taiwan
  TWO: "TWSE",
  DE: "XETRA", // Germany
  F: "XETRA",
  PA: "Euronext", // Paris
  AS: "Euronext", // Amsterdam
  BR: "Euronext", // Brussels
  LS: "Euronext", // Lisbon
  SW: "SIX", // Switzerland
  SA: "B3", // Brazil
  MX: "BMV", // Mexico
  SI: "SGX", // Singapore
  BO: "BSE", // India (BSE)
  NS: "BSE", // India (NSE — closest available label)
};

function marketFromTickerSuffix(upper: string): MarketExchange | null {
  const dotIndex = upper.lastIndexOf(".");
  if (dotIndex === -1) return null;
  const suffix = upper.slice(dotIndex + 1);
  if (!suffix) return null;
  if (EXCHANGE_SUFFIX_MARKET[suffix]) return EXCHANGE_SUFFIX_MARKET[suffix];
  // Unrecognized but present suffix still means "not a plain US ticker" —
  // EUROPE is used elsewhere as the generic non-US catch-all, which beats
  // falsely claiming NYSE.
  return "EUROPE";
}

/**
 * Global index tickers (Yahoo-style "^XXXX" symbols, e.g. "^AXJO" for the
 * ASX 200 or "^N225" for the Nikkei 225) carry no exchange suffix at all,
 * so marketFromTickerSuffix can't catch them — they'd otherwise fall
 * straight through to the NYSE default despite representing a specific
 * foreign market. US indices are handled separately via
 * US_MARKETS_DISPLAY_TICKERS/isMacroOrCommodityTicker.
 */
const INDEX_TICKER_MARKET: Record<string, MarketExchange> = {
  // US indices — kept explicit so they don't fall into the non-US EUROPE
  // catch-all below just because they start with "^".
  "^GSPC": "US MARKETS", // S&P 500
  "^DJI": "US MARKETS", // Dow Jones
  "^IXIC": "US MARKETS", // Nasdaq Composite
  "^RUT": "US MARKETS", // Russell 2000
  "^VIX": "US MARKETS",
  "^NDX": "US MARKETS", // Nasdaq 100

  "^AXJO": "ASX", // Australia — S&P/ASX 200
  "^AORD": "ASX",
  "^N225": "Nikkei", // Japan — Nikkei 225
  "^HSI": "HKEX", // Hong Kong — Hang Seng
  "^FTSE": "LSE", // UK — FTSE 100
  "^GDAXI": "XETRA", // Germany — DAX
  "^FCHI": "Euronext", // France — CAC 40
  "^STOXX50E": "Euronext",
  "^BSESN": "BSE", // India — Sensex
  "^NSEI": "BSE", // India — Nifty 50
  "^KS11": "KRX", // South Korea — KOSPI
  "^TWII": "TWSE", // Taiwan
  "^BVSP": "B3", // Brazil — Bovespa
  "^MXX": "BMV", // Mexico — IPC
  "^STI": "SGX", // Singapore
  "^SSEC": "SSE", // China — Shanghai Composite
  "^SZSC": "SSE", // China — Shenzhen Component
  "^TASI": "TADAWUL", // Saudi Arabia — Tadawul All Share
  "^SSMI": "SIX", // Switzerland — SMI
};

function marketFromIndexTicker(upper: string): MarketExchange | null {
  if (!upper.startsWith("^")) return null;
  return INDEX_TICKER_MARKET[upper] ?? "EUROPE";
}

/**
 * Marketaux's own entity country (from its exchange-country metadata) is
 * ground truth — far more reliable than guessing a market from the ticker
 * string. Covers Marketaux's full supported-country list. "us" is
 * deliberately omitted: US tickers are ambiguous between NASDAQ/NYSE, which
 * only the catalog/ticker-suffix logic can resolve.
 */
const COUNTRY_TO_MARKET: Record<string, MarketExchange> = {
  au: "ASX",
  nz: "ASX", // no dedicated NZX bucket — closest Oceania exchange we track
  gb: "LSE",
  ie: "Euronext", // Euronext Dublin
  fr: "Euronext",
  nl: "Euronext",
  pt: "Euronext", // Euronext Lisbon
  be: "Euronext",
  it: "Euronext", // Borsa Italiana, part of Euronext since 2021
  de: "XETRA",
  ch: "SIX",
  jp: "Nikkei",
  hk: "HKEX",
  cn: "SSE",
  kr: "KRX",
  tw: "TWSE",
  in: "BSE",
  sg: "SGX",
  ca: "TSX",
  br: "B3",
  mx: "BMV",
  sa: "TADAWUL",
  // Latin America — no dedicated exchange bucket per country
  ar: "LATAM",
  cl: "LATAM",
  co: "LATAM",
  pe: "LATAM",
  ec: "LATAM",
  uy: "LATAM",
  ve: "LATAM",
  bo: "LATAM",
  ni: "LATAM",
  pa: "LATAM",
  hn: "LATAM",
  // Middle East / North Africa (outside Saudi, which has its own exchange)
  il: "MENA",
  qa: "MENA",
  ir: "MENA",
  sy: "MENA",
  // Africa
  eg: "AFRICA",
  za: "AFRICA",
  // South/Southeast Asia without a dedicated exchange bucket
  id: "ASIA",
  th: "ASIA",
  pk: "ASIA",
  // Rest of Europe (real exchanges exist, but not ones we track individually)
  at: "EUROPE",
  by: "EUROPE",
  bg: "EUROPE",
  hr: "EUROPE",
  cz: "EUROPE",
  gr: "EUROPE",
  pl: "EUROPE",
  ro: "EUROPE",
  ru: "EUROPE",
  es: "EUROPE",
  tr: "EUROPE",
  ua: "EUROPE",
  am: "EUROPE",
};

function marketFromCountryCode(
  countryCode: string | null | undefined
): MarketExchange | null {
  if (!countryCode) return null;
  return COUNTRY_TO_MARKET[countryCode.toLowerCase()] ?? null;
}

/**
 * Keyword buckets for Marketaux's free-text entity `industry` field (e.g.
 * "Semiconductors", "Biotechnology", "Oil & Gas E&P", "REIT—Diversified"),
 * checked most-specific-first. Only ~180 well-known tickers have a
 * hand-curated sector in BASE_METAS above — every other ticker Marketaux
 * surfaces (the vast majority, given its 80+ market coverage) used to fall
 * straight to a hardcoded "Finance" default regardless of what industry the
 * company was actually in, which skewed Browse-by-topic hard toward Finance
 * and left Technology/Energy/Healthcare/etc. looking empty. This uses the
 * industry Marketaux already gives us instead of discarding it.
 */
const INDUSTRY_SECTOR_KEYWORDS: [pattern: RegExp, sector: Sector][] = [
  [/crypto|blockchain|bitcoin|digital assets/, "Crypto"],
  [/reit|real estate/, "Real Estate"],
  [/mining|gold|silver|copper|steel|aluminum|coal|precious metals|industrial metals/, "Mining"],
  [/oil|gas|energy|petroleum|uranium|solar|utilit/, "Energy"],
  [
    /health|biotech|pharma|drug manufactur|medical|diagnostic|hospital|therapeutic/,
    "Healthcare",
  ],
  [
    /software|semiconductor|technology|internet|computer|electronic|it services|information technology|telecom|communication equipment/,
    "Technology",
  ],
  [
    /consumer|retail|restaurant|apparel|automobile|auto (manufactur|parts)|beverage|food|grocery|leisure|travel|hotel|airline|footwear|household|personal products|tobacco/,
    "Consumer",
  ],
];

function sectorFromIndustry(industry: string | null | undefined): Sector | null {
  if (!industry) return null;
  const lower = industry.toLowerCase();
  for (const [pattern, sector] of INDUSTRY_SECTOR_KEYWORDS) {
    if (pattern.test(lower)) return sector;
  }
  return null;
}

export function getTickerMetaBySymbol(
  ticker: string,
  industryHint?: string | null
): TickerMeta {
  const upper = ticker.toUpperCase();
  if (TICKER_BY_SYMBOL[upper]) return TICKER_BY_SYMBOL[upper];

  if (isCryptoAssetTicker(upper)) {
    return {
      ticker: upper,
      companyName: getCryptoDisplayName(upper),
      market: "CRYPTO",
      sector: "Crypto",
      tags: [upper, "Crypto"],
      logoColor: getCryptoBrandColor(upper),
    };
  }

  return {
    ticker: upper,
    companyName: upper,
    market: marketFromIndexTicker(upper) ?? marketFromTickerSuffix(upper) ?? "NYSE",
    sector: sectorFromIndustry(industryHint) ?? "Finance",
    tags: [upper],
    logoColor: getTickerAccentColor(upper),
  };
}

const COMMODITY_DISPLAY_TICKERS = new Set(["OIL", "GOLD"]);
const US_MARKETS_DISPLAY_TICKERS = new Set([
  "FED",
  "RATES",
  "ENERGY",
  "MARKET",
  "SPX",
  "QQQ",
  "DJI",
]);

/**
 * True for macro/index/commodity theme tickers (e.g. "Broad Market",
 * "Crude Oil", "Federal Reserve") rather than an actual exchange-listed
 * company. These share the ticker-tag mechanism for feed filtering/display
 * but have no real company — no Wikipedia entity, no founder/HQ/owner facts
 * — so UI that renders a company profile (BusinessInfoPanel) should treat
 * them differently rather than showing an empty/broken-looking card.
 */
export function isMacroOrCommodityTicker(ticker: string): boolean {
  const upper = ticker.trim().toUpperCase();
  return COMMODITY_DISPLAY_TICKERS.has(upper) || US_MARKETS_DISPLAY_TICKERS.has(upper);
}

function isUsListedEquity(ticker: string): boolean {
  const upper = ticker.toUpperCase();
  if (isPrivateTicker(upper)) return false;
  if (isCryptoAssetTicker(upper)) return false;
  if (COMMODITY_DISPLAY_TICKERS.has(upper)) return false;
  if (US_MARKETS_DISPLAY_TICKERS.has(upper)) return false;

  const market = getTickerMetaBySymbol(upper).market;
  return market === "NASDAQ" || market === "NYSE";
}

function resolveMarketFromSource(
  sourceName?: string,
  sourceId?: string | null
): MarketExchange | null {
  const id = (sourceId ?? "").toLowerCase();
  const name = (sourceName ?? "").toLowerCase();
  const blob = `${id} ${name}`;

  if (id === "nikkei" || name.includes("nikkei")) return "JAPAN";
  if (id === "scmp" || blob.includes("south china morning")) return "HONG KONG";
  if (id === "afr" || name.includes("australian financial review"))
    return "AUSTRALIA";
  if (
    id === "bt" ||
    id === "business-times" ||
    blob.includes("business times") ||
    blob.includes("straits times") ||
    blob.includes("businesstimes.com")
  ) {
    return "SGX";
  }
  if (
    id === "ft" ||
    name.includes("financial times") ||
    id === "lse" ||
    name.includes("london stock exchange")
  ) {
    return "EUROPE";
  }

  return null;
}

/** Feed card exchange label — derived from ticker, not article index */
export function resolveMarketForTicker(
  ticker: string,
  entityCountry?: string | null
): MarketExchange {
  const upper = ticker.toUpperCase();

  if (isCryptoAssetTicker(upper)) return "CRYPTO";
  if (COMMODITY_DISPLAY_TICKERS.has(upper)) return "COMMODITIES";
  if (US_MARKETS_DISPLAY_TICKERS.has(upper)) return "US MARKETS";
  if (isPrivateTicker(upper)) return "NASDAQ";

  // A curated catalog entry is a deliberate choice — trust it over any
  // country signal (e.g. SONY is deliberately "Nikkei" even though its
  // NYSE-listed ADR articles may carry entityCountry "us").
  if (TICKER_BY_SYMBOL[upper]) {
    return TICKER_BY_SYMBOL[upper].market;
  }

  // For anything NOT in our catalog, Marketaux's own entity country is
  // ground truth — far more reliable than guessing from the ticker string
  // (this is what used to make every uncatalogued foreign ticker default
  // to NYSE, then later to a blanket "EUROPE" guess).
  const fromCountry = marketFromCountryCode(entityCountry);
  if (fromCountry) return fromCountry;

  const market = getTickerMetaBySymbol(upper).market;
  if (isUsListedEquity(upper)) {
    return market === "NASDAQ" || market === "NYSE" ? market : "NYSE";
  }

  return market;
}

/**
 * Explicit "(EXCHANGE:TICKER)" style tags directly in a headline are the
 * strongest possible market signal — the publisher is telling the reader
 * exactly what's being traded and where. Marketaux's entity extraction can
 * still pick an unrelated ticker as the top-scored entity for the article
 * (see inferCountryFromHeadline below), which used to leave e.g. a headline
 * literally reading "...(ASX:REH)...(ASX:REA)" tagged "NYSE" on the feed
 * card. Checked ahead of everything else in resolveMarketForArticle.
 */
const EXPLICIT_EXCHANGE_TICKER_RE =
  /\(\s*(ASX|NSE|BSE|LSE|TSX|HKEX|HKG|SEHK|SGX|KRX|TWSE|XETRA|SIX|NASDAQ|NYSE)\s*:\s*[A-Z0-9.]{1,10}\s*\)/i;

const EXCHANGE_PREFIX_TO_MARKET: Record<string, MarketExchange> = {
  ASX: "ASX",
  NSE: "BSE", // India — we only track one bucket (BSE) for the Indian market
  BSE: "BSE",
  LSE: "LSE",
  TSX: "TSX",
  HKEX: "HKEX",
  HKG: "HKEX",
  SEHK: "HKEX",
  SGX: "SGX",
  KRX: "KRX",
  TWSE: "TWSE",
  XETRA: "XETRA",
  SIX: "SIX",
  NASDAQ: "NASDAQ",
  NYSE: "NYSE",
};

export function explicitExchangeFromHeadline(
  headline: string | null | undefined
): MarketExchange | null {
  if (!headline) return null;
  const match = headline.match(EXPLICIT_EXCHANGE_TICKER_RE);
  if (!match) return null;
  return EXCHANGE_PREFIX_TO_MARKET[match[1].toUpperCase()] ?? null;
}

/**
 * Strong, unambiguous headline-only signals that a story is fundamentally
 * about a specific country's market — used in newsMapper.ts as a sanity
 * check against Marketaux's top-scored entity. A high-scoring entity can
 * still be a passing mention (a quoted analyst's employer, a comparison)
 * rather than the article's actual subject; when that happens with a
 * US-listed entity on a headline that reads as e.g. "Rupee rebound bets
 * vanish as soaring crude blunts inflows", the result is a "NYSE"/"NASDAQ"
 * badge on a story that has nothing to do with the US market. Keywords are
 * deliberately narrow and unambiguous so this only fires on a genuine
 * mismatch, not on stories that merely mention a country in passing.
 */
const HEADLINE_COUNTRY_SIGNALS: [pattern: RegExp, country: string][] = [
  [/\b(nifty|sensex|rupee|bse|nse)\b/i, "in"],
  [/\bhang seng\b/i, "hk"],
  [/\b(nikkei|topix)\b/i, "jp"],
  [/\bkospi\b/i, "kr"],
  [/\b(shanghai composite|shenzhen composite|csi 300|yuan|renminbi)\b/i, "cn"],
  [/\b(ftse 100|footsie)\b/i, "gb"],
  [/\bdax\b/i, "de"],
  [/\b(asx ?200|aussie dollar)\b/i, "au"],
  [/\b(tsx composite|toronto stock exchange|loonie)\b/i, "ca"],
];

export function inferCountryFromHeadline(headline: string): string | null {
  for (const [pattern, country] of HEADLINE_COUNTRY_SIGNALS) {
    if (pattern.test(headline)) return country;
  }
  return null;
}

/** Feed card exchange label — source region + US equity exchanges */
export function resolveMarketForArticle(article: {
  ticker: string;
  sourceName?: string;
  sourceId?: string | null;
  entityCountry?: string | null;
  headline?: string | null;
}): MarketExchange {
  const explicit = explicitExchangeFromHeadline(article.headline);
  if (explicit) return explicit;

  const fromSource = resolveMarketFromSource(
    article.sourceName,
    article.sourceId
  );
  if (fromSource) return fromSource;

  return resolveMarketForTicker(article.ticker, article.entityCountry);
}
