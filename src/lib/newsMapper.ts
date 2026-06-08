import { SECTOR_FILTERS } from "./filters";
import type { MarketExchange, NewsArticle, Sector } from "./types";
import { hasUsableFeedImage } from "./feedImage";
import { cleanArticleDescription } from "./articleText";
import { cleanArticleTitle, extractSourceFromTitle } from "./sourceBranding";
import { inferTickerFromFields, resolveMarketForTicker } from "./tickerMap";
import { hashId, pseudoRandom } from "./utils";

interface NewsApiArticle {
  source?: { id?: string | null; name?: string };
  author?: string | null;
  title?: string;
  description?: string | null;
  url?: string;
  urlToImage?: string | null;
  publishedAt?: string;
  content?: string | null;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80";

function assignSector(metaSector: Sector, index: number): Sector {
  const pool = SECTOR_FILTERS as readonly Sector[];
  if (index % 3 === 0) return pool[index % pool.length];
  return metaSector;
}

export function mapNewsApiArticle(raw: NewsApiArticle, index: number): NewsArticle {
  const rawTitle = raw.title ?? "Market Update";
  const fromTitle = extractSourceFromTitle(rawTitle);
  const sourceName =
    raw.source?.name?.trim() || fromTitle || "Financial News";
  const sourceId = raw.source?.id ?? null;
  const title = cleanArticleTitle(rawTitle);
  const description = cleanArticleDescription(raw.description ?? "");
  const meta = inferTickerFromFields(
    title,
    description || raw.description || ""
  );
  const id = hashId((raw.url ?? title) + index);
  const body =
    raw.content?.replace(/\[\+\d+ chars\]$/, "").trim() ||
    `${description || "Latest developments shaping global markets."}\n\nInvestors are watching closely as ${meta.companyName} and peers react to shifting macro conditions. Analysts note that sentiment remains mixed amid rate expectations and earnings season positioning.\n\nTrading volumes have picked up across major indices, with technology and financials leading sector moves. Market participants continue to balance growth exposure against defensive positioning.`;

  return {
    id,
    headline: title,
    subheading: description,
    body,
    imageUrl: hasUsableFeedImage(raw.urlToImage) ? raw.urlToImage! : "",
    market: resolveMarketForTicker(meta.ticker),
    sector: assignSector(meta.sector, index),
    ticker: meta.ticker,
    companyName: meta.companyName,
    tags: meta.tags,
    publishedAt: raw.publishedAt ?? new Date().toISOString(),
    sourceName,
    sourceId,
    sourceUrl: raw.url ?? "#",
    likes: Math.floor(pseudoRandom(id + "likes", 800, 25000)),
    comments: Math.floor(pseudoRandom(id + "comments", 40, 900)),
    shares: Math.floor(pseudoRandom(id + "shares", 200, 5000)),
  };
}

const DEMO_SEEDS: Omit<NewsArticle, "id" | "likes" | "comments" | "shares" | "publishedAt">[] = [
  {
    headline: "Nvidia Hits Record High as AI Demand Surges",
    subheading: "Chip giant leads rally in tech sector.",
    body: "NVIDIA Corporation shares climbed as enterprise AI spending accelerated across cloud customers.",
    imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200&q=80",
    market: "NASDAQ",
    sector: "Technology",
    ticker: "NVDA",
    companyName: "NVIDIA Corporation",
    tags: ["NVDA", "AI"],
    sourceName: "Reuters",
    sourceId: "reuters",
    sourceUrl: "https://www.reuters.com",
  },
  {
    headline: "Fed Signals Cautious Path on Rate Cuts",
    subheading: "Treasury yields slip after Powell remarks.",
    body: "Federal Reserve officials emphasized data dependence while investors priced in fewer cuts this year.",
    imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1200&q=80",
    market: "NYSE",
    sector: "Finance",
    ticker: "JPM",
    companyName: "JPMorgan Chase",
    tags: ["Fed", "Rates"],
    sourceName: "Bloomberg",
    sourceId: "bloomberg",
    sourceUrl: "https://www.bloomberg.com",
  },
  {
    headline: "Oil Prices Climb on Middle East Supply Concerns",
    subheading: "Energy stocks outperform broad market.",
    body: "Crude benchmarks rose more than 2% as traders assessed shipping risks and OPEC+ discipline.",
    imageUrl: "https://images.unsplash.com/photo-1473174001180-2235e91393b4?w=1200&q=80",
    market: "NYSE",
    sector: "Energy",
    ticker: "XOM",
    companyName: "Exxon Mobil",
    tags: ["Oil", "Energy"],
    sourceName: "CNBC",
    sourceId: "cnbc",
    sourceUrl: "https://www.cnbc.com",
  },
  {
    headline: "ASX Miners Rally on Iron Ore Rebound",
    subheading: "BHP and Rio lead the materials sector higher.",
    body: "Australian mining giants gained as commodity traders bid up iron ore futures in Asia trade.",
    imageUrl: "https://images.unsplash.com/photo-1590283608315-2a909a829f24?w=1200&q=80",
    market: "ASX",
    sector: "Mining",
    ticker: "BHP",
    companyName: "BHP Group",
    tags: ["ASX", "Mining"],
    sourceName: "AFR",
    sourceId: "afr",
    sourceUrl: "https://www.afr.com",
  },
  {
    headline: "Bitcoin ETFs See Another Week of Inflows",
    subheading: "Crypto sentiment improves after volatility fade.",
    body: "Spot bitcoin fund inflows topped $1B as institutional allocators added digital asset exposure.",
    imageUrl: "https://images.unsplash.com/photo-1518546305927-5a555bb7020e?w=1200&q=80",
    market: "NASDAQ",
    sector: "Crypto",
    ticker: "BTC",
    companyName: "Bitcoin",
    tags: ["BTC", "ETF"],
    sourceName: "CoinDesk",
    sourceId: "coindesk",
    sourceUrl: "https://www.coindesk.com",
  },
  {
    headline: "Luxury Retailers Warn on China Slowdown",
    subheading: "Consumer discretionary faces headwinds.",
    body: "European luxury houses cited softer Chinese demand in quarterly updates, pressuring sector multiples.",
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80",
    market: "LSE",
    sector: "Consumer",
    ticker: "LVMH",
    companyName: "LVMH",
    tags: ["Retail", "China"],
    sourceName: "FT",
    sourceId: "ft",
    sourceUrl: "https://www.ft.com",
  },
  {
    headline: "Nikkei Touches Multi-Year High on Weak Yen",
    subheading: "Exporters boost Tokyo benchmark.",
    body: "Japanese equities extended gains as the yen softened, lifting automakers and electronics names.",
    imageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=80",
    market: "Nikkei",
    sector: "Technology",
    ticker: "SONY",
    companyName: "Sony Group",
    tags: ["Japan", "FX"],
    sourceName: "Nikkei",
    sourceId: "nikkei",
    sourceUrl: "https://www.nikkei.com",
  },
  {
    headline: "Healthcare Giants Beat Earnings Estimates",
    subheading: "Pharma names lift defensive bids.",
    body: "Large-cap healthcare reported stronger-than-expected margins, supporting fund flows into defensives.",
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80",
    market: "NYSE",
    sector: "Healthcare",
    ticker: "JNJ",
    companyName: "Johnson & Johnson",
    tags: ["Pharma", "Earnings"],
    sourceName: "WSJ",
    sourceId: "wsj",
    sourceUrl: "https://www.wsj.com",
  },
  {
    headline: "Hong Kong Stocks Rebound on Property Stimulus",
    subheading: "Real estate developers surge in HKEX trade.",
    body: "Hang Seng rallied after policymakers outlined support measures for the struggling property sector.",
    imageUrl: "https://images.unsplash.com/photo-1486406146925-ccea4c66f37c?w=1200&q=80",
    market: "HKEX",
    sector: "Real Estate",
    ticker: "CKA",
    companyName: "CK Asset",
    tags: ["HKEX", "Property"],
    sourceName: "SCMP",
    sourceId: "scmp",
    sourceUrl: "https://www.scmp.com",
  },
  {
    headline: "TSX Gains as Bank Earnings Impress",
    subheading: "Canadian lenders post solid loan growth.",
    body: "Toronto stocks advanced as major banks reported resilient credit quality and net interest income.",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80",
    market: "TSX",
    sector: "Finance",
    ticker: "RY",
    companyName: "Royal Bank of Canada",
    tags: ["Canada", "Banks"],
    sourceName: "Globe and Mail",
    sourceId: "globe",
    sourceUrl: "https://www.theglobeandmail.com",
  },
  {
    headline: "Singapore REITs Rise on Rate Cut Bets",
    subheading: "SGX property trusts attract yield buyers.",
    body: "Straits Times Index moved higher as REITs rallied on falling bond yields and occupancy recovery.",
    imageUrl: "https://images.unsplash.com/photo-1565514020179-026b92a84f56?w=1200&q=80",
    market: "SGX",
    sector: "Real Estate",
    ticker: "CAPL",
    companyName: "CapitaLand",
    tags: ["SGX", "REIT"],
    sourceName: "Business Times",
    sourceId: "bt",
    sourceUrl: "https://www.businesstimes.com.sg",
  },
  {
    headline: "European Banks Outperform on Merger Talk",
    subheading: "Euronext lenders lead regional rally.",
    body: "Speculation around cross-border tie-ups lifted European financials, boosting the Euronext 100.",
    imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80",
    market: "Euronext",
    sector: "Finance",
    ticker: "BNP",
    companyName: "BNP Paribas",
    tags: ["Europe", "Banks"],
    sourceName: "Les Echos",
    sourceId: "lechos",
    sourceUrl: "https://www.lesechos.fr",
  },
];

export const DEMO_ARTICLES: NewsArticle[] = DEMO_SEEDS.map((seed, i) => {
  const id = `demo-${i}`;
  return {
    ...seed,
    id,
    publishedAt: new Date(Date.now() - i * 45 * 60 * 1000).toISOString(),
    likes: Math.floor(pseudoRandom(id + "likes", 800, 25000)),
    comments: Math.floor(pseudoRandom(id + "comments", 40, 900)),
    shares: Math.floor(pseudoRandom(id + "shares", 200, 5000)),
  };
});
