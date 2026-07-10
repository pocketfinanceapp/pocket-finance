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
}

export interface Comment {
  id: string;
  username: string;
  avatar: string;
  avatarColor: string;
  text: string;
  timeAgo: string;
  parentId?: string | null;
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
  competitors: Competitor[];
  chartData: Record<ChartRange, ChartPoint[]>;
}
