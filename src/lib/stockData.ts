import type { ChartPoint, ChartRange, StockProfile } from "./types";
import { getTickerMetaBySymbol } from "./tickerMap";
import { pseudoRandom } from "./utils";

function generateChart(
  seed: string,
  basePrice: number,
  points: number,
  labels: string[]
): ChartPoint[] {
  const data: ChartPoint[] = [];
  let price = basePrice * 0.98;
  for (let i = 0; i < points; i++) {
    const drift = pseudoRandom(`${seed}-${i}`, -0.008, 0.012);
    price = price * (1 + drift);
    data.push({
      time: labels[i] ?? `${i}`,
      price: Math.round(price * 100) / 100,
    });
  }
  data[data.length - 1] = {
    time: labels[labels.length - 1] ?? "Now",
    price: basePrice,
  };
  return data;
}

const CHART_LABELS: Record<ChartRange, string[]> = {
  "1D": ["9:30 AM", "10:30 AM", "12:00 PM", "2:30 PM", "4:00 PM"],
  "1W": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  "1M": ["W1", "W2", "W3", "W4"],
  "3M": ["Jan", "Feb", "Mar"],
  "1Y": ["Q1", "Q2", "Q3", "Q4"],
  "5Y": ["2021", "2022", "2023", "2024", "2025"],
  MAX: ["2020", "2021", "2022", "2023", "2024", "2025"],
};

const STOCK_PROFILES: Record<string, Omit<StockProfile, "chartData">> = {
  NVDA: {
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    price: 1067.98,
    change: 24.37,
    changePercent: 2.34,
    logoColor: "#76b900",
    marketCap: "$2.63T",
    revenue: "$60.9B",
    peRatio: "71.45",
    eps: "$14.96",
    ebitda: "$36.1B",
    dividendYield: "0.03%",
    competitors: [
      { ticker: "AMD", name: "Advanced Micro Devices", price: 168.32, changePercent: 1.45, color: "#ed1c24" },
      { ticker: "QCOM", name: "Qualcomm Incorporated", price: 195.41, changePercent: 0.92, color: "#3253dc" },
      { ticker: "INTC", name: "Intel Corporation", price: 31.86, changePercent: -0.31, color: "#0071c5" },
    ],
  },
  AAPL: {
    ticker: "AAPL",
    name: "Apple Inc.",
    price: 227.52,
    change: 2.18,
    changePercent: 0.97,
    logoColor: "#555555",
    marketCap: "$3.48T",
    revenue: "$391.0B",
    peRatio: "35.12",
    eps: "$6.47",
    ebitda: "$134.8B",
    dividendYield: "0.44%",
    competitors: [
      { ticker: "MSFT", name: "Microsoft Corporation", price: 425.18, changePercent: 0.68, color: "#00a4ef" },
      { ticker: "GOOGL", name: "Alphabet Inc.", price: 178.92, changePercent: 1.12, color: "#4285f4" },
      { ticker: "SAM", name: "Samsung Electronics", price: 58.4, changePercent: -0.22, color: "#1428a0" },
    ],
  },
  GOOGL: {
    ticker: "GOOGL",
    name: "Alphabet Inc.",
    price: 178.92,
    change: 1.98,
    changePercent: 1.12,
    logoColor: "#4285f4",
    marketCap: "$2.21T",
    revenue: "$339.9B",
    peRatio: "26.84",
    eps: "$6.67",
    ebitda: "$112.4B",
    dividendYield: "0.48%",
    competitors: [
      { ticker: "META", name: "Meta Platforms, Inc.", price: 512.4, changePercent: 0.88, color: "#0668e1" },
      { ticker: "MSFT", name: "Microsoft Corporation", price: 425.18, changePercent: 0.68, color: "#00a4ef" },
      { ticker: "AMZN", name: "Amazon.com, Inc.", price: 198.5, changePercent: 0.45, color: "#ff9900" },
    ],
  },
  BTC: {
    ticker: "BTC",
    name: "Bitcoin",
    price: 67240.5,
    change: 1240.2,
    changePercent: 1.88,
    logoColor: "#f7931a",
    marketCap: "$1.32T",
    revenue: "—",
    peRatio: "—",
    eps: "—",
    ebitda: "—",
    dividendYield: "—",
    competitors: [
      { ticker: "ETH", name: "Ethereum", price: 3421.8, changePercent: 2.1, color: "#627eea" },
      { ticker: "COIN", name: "Coinbase Global", price: 245.6, changePercent: 1.4, color: "#0052ff" },
      { ticker: "MSTR", name: "MicroStrategy", price: 1680.2, changePercent: 3.2, color: "#d9232e" },
    ],
  },
  MSFT: {
    ticker: "MSFT",
    name: "Microsoft Corporation",
    price: 425.18,
    change: 2.87,
    changePercent: 0.68,
    logoColor: "#00a4ef",
    marketCap: "$3.16T",
    revenue: "$245.1B",
    peRatio: "36.21",
    eps: "$11.75",
    ebitda: "$128.5B",
    dividendYield: "0.72%",
    competitors: [
      { ticker: "GOOGL", name: "Alphabet Inc.", price: 178.92, changePercent: 1.12, color: "#4285f4" },
      { ticker: "AAPL", name: "Apple Inc.", price: 227.52, changePercent: 0.97, color: "#555555" },
      { ticker: "ORCL", name: "Oracle Corporation", price: 128.4, changePercent: 0.32, color: "#f80000" },
    ],
  },
};

const DEFAULT_PROFILE = STOCK_PROFILES.NVDA;

export function getStockProfile(ticker: string): StockProfile {
  const meta = getTickerMetaBySymbol(ticker);
  const stored = STOCK_PROFILES[ticker];

  const base = stored ?? {
    ...DEFAULT_PROFILE,
    ticker,
    name: meta.companyName,
    logoColor: meta.logoColor,
    price: pseudoRandom(ticker, 50, 500),
    change: pseudoRandom(`${ticker}-c`, 0.5, 15),
    changePercent: pseudoRandom(`${ticker}-p`, -2, 4),
  };

  const chartData = {} as Record<ChartRange, ChartPoint[]>;
  (Object.keys(CHART_LABELS) as ChartRange[]).forEach((range) => {
    chartData[range] = generateChart(
      `${ticker}-${range}`,
      base.price,
      CHART_LABELS[range].length,
      CHART_LABELS[range]
    );
  });

  return { ...base, chartData };
}
