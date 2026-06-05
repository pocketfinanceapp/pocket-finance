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
    sector: "Technology",
    tags: ["BTC", "Crypto", "Digital Assets"],
    logoColor: "#f7931a",
  },
  ethereum: {
    ticker: "ETH",
    companyName: "Ethereum",
    market: "NASDAQ",
    sector: "Technology",
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
};

const DEFAULT_META: TickerMeta = {
  ticker: "SPY",
  companyName: "S&P 500 ETF",
  market: "NYSE",
  sector: "Finance",
  tags: ["Markets", "Stocks", "Economy"],
  logoColor: "#00c9b7",
};

export function inferTickerFromText(text: string): TickerMeta {
  const lower = text.toLowerCase();
  for (const [key, meta] of Object.entries(TICKER_MAP)) {
    if (lower.includes(key)) return meta;
  }
  return DEFAULT_META;
}
