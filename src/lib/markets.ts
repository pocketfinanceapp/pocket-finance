import type { MarketFilter } from "./filters";

export interface GlobalMarket {
  id: MarketFilter;
  name: string;
  indexName: string;
  country: string;
  flag: string;
  value: number;
  changePercent: number;
}

export const GLOBAL_MARKETS: GlobalMarket[] = [
  {
    id: "ASX",
    name: "ASX",
    indexName: "S&P/ASX 200",
    country: "Australia",
    flag: "🇦🇺",
    value: 8234.12,
    changePercent: 0.42,
  },
  {
    id: "NASDAQ",
    name: "NASDAQ",
    indexName: "NASDAQ Composite",
    country: "United States",
    flag: "🇺🇸",
    value: 18924.77,
    changePercent: 0.56,
  },
  {
    id: "NYSE",
    name: "NYSE",
    indexName: "NYSE Composite",
    country: "United States",
    flag: "🇺🇸",
    value: 19842.31,
    changePercent: 0.21,
  },
  {
    id: "LSE",
    name: "LSE",
    indexName: "FTSE 100",
    country: "United Kingdom",
    flag: "🇬🇧",
    value: 8412.33,
    changePercent: -0.12,
  },
  {
    id: "Nikkei",
    name: "Nikkei 225",
    indexName: "Nikkei 225",
    country: "Japan",
    flag: "🇯🇵",
    value: 39872.5,
    changePercent: 0.31,
  },
  {
    id: "HKEX",
    name: "HKEX",
    indexName: "Hang Seng",
    country: "Hong Kong",
    flag: "🇭🇰",
    value: 17892.44,
    changePercent: -0.28,
  },
  {
    id: "TSX",
    name: "TSX",
    indexName: "S&P/TSX Composite",
    country: "Canada",
    flag: "🇨🇦",
    value: 23118.65,
    changePercent: 0.15,
  },
  {
    id: "Euronext",
    name: "Euronext",
    indexName: "Euronext 100",
    country: "Europe",
    flag: "🇪🇺",
    value: 1542.88,
    changePercent: 0.09,
  },
  {
    id: "SGX",
    name: "SGX",
    indexName: "Straits Times",
    country: "Singapore",
    flag: "🇸🇬",
    value: 3342.17,
    changePercent: 0.38,
  },
  {
    id: "BSE",
    name: "BSE India",
    indexName: "S&P BSE Sensex",
    country: "India",
    flag: "🇮🇳",
    value: 82341.2,
    changePercent: 0.62,
  },
  {
    id: "SSE",
    name: "SSE China",
    indexName: "SSE Composite",
    country: "China",
    flag: "🇨🇳",
    value: 3124.86,
    changePercent: -0.44,
  },
  {
    id: "KRX",
    name: "KRX Korea",
    indexName: "KOSPI",
    country: "South Korea",
    flag: "🇰🇷",
    value: 2748.92,
    changePercent: 0.27,
  },
];

export function getMarketById(id: MarketFilter): GlobalMarket | undefined {
  return GLOBAL_MARKETS.find((m) => m.id === id);
}

export function formatIndexValue(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** @deprecated Use GLOBAL_MARKETS */
export const MAJOR_INDICES = GLOBAL_MARKETS.slice(0, 5).map((m) => ({
  id: m.id.toLowerCase(),
  name: m.indexName,
  region: m.country,
  value: m.value,
  changePercent: m.changePercent,
}));
