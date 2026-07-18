export type MarketExchange =
  | "NASDAQ"
  | "NYSE"
  | "ASX"
  | "LSE"
  | "Nikkei"
  | "HKEX"
  | "TSX"
  | "Euronext"
  | "SGX"
  | "BSE"
  | "SSE"
  | "KRX"
  | "TWSE"
  | "XETRA"
  | "SIX"
  | "B3"
  | "BMV"
  | "TADAWUL"
  | "CRYPTO"
  | "COMMODITIES"
  | "US MARKETS"
  | "JAPAN"
  | "HONG KONG"
  | "AUSTRALIA"
  | "EUROPE";

export type Sector =
  | "Technology"
  | "Finance"
  | "Energy"
  | "Mining"
  | "Healthcare"
  | "Consumer"
  | "Crypto"
  | "Real Estate";

export interface NewsArticle {
  id: string;
  headline: string;
  subheading: string;
  body: string;
  imageUrl: string;
  market: MarketExchange;
  sector: Sector;
  ticker: string;
  companyName: string;
  tags: string[];
  publishedAt: string;
  sourceName: string;
  sourceId?: string | null;
  sourceUrl: string;
  likes: number;
  comments: number;
  shares: number;
  /**
   * Marketaux's own article UUID (undefined for NewsAPI/demo articles).
   * Used to look up "similar stories" via the news/similar endpoint.
   */
  marketauxUuid?: string | null;
  /**
   * Marketaux's NLP-derived sentiment score (-1 to +1) for the article's
   * best-matched entity. Undefined/null when unavailable — never fabricated.
   */
  sentimentScore?: number | null;
  /**
   * ISO 3166-1 alpha-2 country code (lowercase) of the article's
   * best-matched entity's exchange, as reported by Marketaux — e.g. "us",
   * "au", "eu". Powers country-based Explore filtering. Undefined for
   * NewsAPI/demo articles.
   */
  entityCountry?: string | null;
}

export interface Comment {
  id: string;
  username: string;
  avatar: string;
  avatarColor: string;
  avatarUrl?: string | null;
  userId?: string;
  text: string;
  timeAgo: string;
  parentId?: string | null;
  /** True when the author has deleted this comment — text is replaced with
   * a placeholder but the row stays so replies aren't orphaned. */
  isDeleted?: boolean;
}

/** @deprecated Use SavedArticleEntry — kept for stock panel helpers */
export interface WatchlistEntry {
  ticker: string;
  name: string;
  price: number;
  changePercent: number;
  logoColor: string;
  savedAt: string;
}

export interface SavedArticleEntry {
  id: string;
  articleId: string;
  articleTitle: string;
  articleUrl: string;
  ticker: string;
  savedAt: string;
}

export interface LikedArticleEntry {
  id: string;
  articleId: string;
  articleTitle: string;
  articleUrl: string;
  ticker: string;
  likedAt: string;
}

export type ChartRange = "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y" | "MAX";

export interface ChartPoint {
  time: string;
  price: number;
}

export interface Competitor {
  ticker: string;
  name: string;
  price: number;
  changePercent: number;
  color: string;
}

export interface StockProfile {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  logoColor: string;
  marketCap: string;
  revenue: string;
  peRatio: string;
  eps: string;
  ebitda: string;
  dividendYield: string;
  volume24h?: string;
  circulatingSupply?: string;
  totalSupply?: string;
  fdv?: string;
  allTimeHigh?: string;
  allTimeLow?: string;
  competitors: Competitor[];
  chartData: Record<ChartRange, ChartPoint[]>;
}
