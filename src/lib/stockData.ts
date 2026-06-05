import type { ChartPoint, ChartRange, StockProfile } from "./types";
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
      {
        ticker: "AMD",
        name: "Advanced Micro Devices",
        price: 168.32,
        changePercent: 1.45,
        color: "#ed1c24",
      },
      {
        ticker: "QCOM",
        name: "Qualcomm Incorporated",
        price: 195.41,
        changePercent: 0.92,
        color: "#3253dc",
      },
      {
        ticker: "INTC",
        name: "Intel Corporation",
        price: 31.86,
        changePercent: -0.31,
        color: "#0071c5",
      },
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
      {
        ticker: "MSFT",
        name: "Microsoft Corporation",
        price: 425.18,
        changePercent: 0.68,
        color: "#00a4ef",
      },
      {
        ticker: "GOOGL",
        name: "Alphabet Inc.",
        price: 178.92,
        changePercent: 1.12,
        color: "#4285f4",
      },
      {
        ticker: "SAM",
        name: "Samsung Electronics",
        price: 58.4,
        changePercent: -0.22,
        color: "#1428a0",
      },
    ],
  },
};

const DEFAULT_PROFILE = STOCK_PROFILES.NVDA;

export function getStockProfile(ticker: string): StockProfile {
  const base = STOCK_PROFILES[ticker] ?? {
    ...DEFAULT_PROFILE,
    ticker,
    name: `${ticker} Corporation`,
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
