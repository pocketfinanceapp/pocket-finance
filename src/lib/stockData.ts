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
  for (let i = 0; i < points; i++) {
    const pct = pseudoRandom(`${seed}-${i}`, -0.02, 0.02);
    const price = basePrice * (1 + pct);
    data.push({
      time: labels[i] ?? `${i}`,
      price: Math.round(price * 100) / 100,
    });
  }
  data[data.length - 1] = {
    time: labels[labels.length - 1] ?? "Now",
    price: Math.round(basePrice * 100) / 100,
  };
  return data;
}

/** Prefer the live/display price; fall back to profile price for high-value crypto */
export function resolveChartBasePrice(
  displayPrice: number,
  profilePrice: number | undefined,
  ticker: string
): number {
  const upper = ticker.toUpperCase();
  const profile = profilePrice ?? 0;

  if (displayPrice > 1000) return displayPrice;
  if ((upper === "BTC" || upper === "ETH") && profile > 1000) return profile;
  if (displayPrice > 0) return displayPrice;
  return profile;
}

/** Chart points within ±2% of the displayed price */
export function getChartPointsForPrice(
  basePrice: number,
  ticker: string,
  range: ChartRange,
  profilePrice?: number
): ChartPoint[] {
  const resolved = resolveChartBasePrice(basePrice, profilePrice, ticker);
  if (resolved <= 0) return [];

  const labels = CHART_LABELS[range];
  return generateChart(
    `${ticker}-${range}-${resolved}`,
    resolved,
    labels.length,
    labels
  );
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
  AAPL: {
    ticker: "AAPL",
    name: "Apple Inc.",
    price: 227.52,
    change: 2.18,
    changePercent: 0.97,
    logoColor: "#555555",
    marketCap: "$3.1T",
    revenue: "$391.0B",
    peRatio: "28.5",
    eps: "$6.42",
    ebitda: "$134.8B",
    dividendYield: "0.44%",
    competitors: [
      { ticker: "MSFT", name: "Microsoft Corporation", price: 425.18, changePercent: 0.68, color: "#00a4ef" },
      { ticker: "GOOGL", name: "Alphabet Inc.", price: 178.92, changePercent: 1.12, color: "#4285f4" },
      { ticker: "SAM", name: "Samsung Electronics", price: 58.4, changePercent: -0.22, color: "#1428a0" },
    ],
  },
  NVDA: {
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    price: 131.38,
    change: -3.07,
    changePercent: -2.29,
    logoColor: "#76b900",
    marketCap: "$2.8T",
    revenue: "$60.9B",
    peRatio: "35.2",
    eps: "$11.93",
    ebitda: "$36.1B",
    dividendYield: "0.03%",
    competitors: [
      { ticker: "AMD", name: "Advanced Micro Devices", price: 168.32, changePercent: 1.45, color: "#ed1c24" },
      { ticker: "QCOM", name: "Qualcomm Incorporated", price: 195.41, changePercent: 0.92, color: "#3253dc" },
      { ticker: "INTC", name: "Intel Corporation", price: 31.86, changePercent: -0.31, color: "#0071c5" },
    ],
  },
  META: {
    ticker: "META",
    name: "Meta Platforms, Inc.",
    price: 512.4,
    change: 8.12,
    changePercent: 1.61,
    logoColor: "#0668e1",
    marketCap: "$1.4T",
    revenue: "$156.2B",
    peRatio: "24.1",
    eps: "$21.08",
    ebitda: "$72.4B",
    dividendYield: "0.38%",
    competitors: [
      { ticker: "GOOGL", name: "Alphabet Inc.", price: 178.92, changePercent: 1.12, color: "#4285f4" },
      { ticker: "SNAP", name: "Snap Inc.", price: 11.42, changePercent: -0.8, color: "#fffc00" },
      { ticker: "PINS", name: "Pinterest, Inc.", price: 34.18, changePercent: 0.55, color: "#e60023" },
    ],
  },
  GOOGL: {
    ticker: "GOOGL",
    name: "Alphabet Inc.",
    price: 178.92,
    change: 1.98,
    changePercent: 1.12,
    logoColor: "#4285f4",
    marketCap: "$2.1T",
    revenue: "$339.9B",
    peRatio: "22.3",
    eps: "$7.91",
    ebitda: "$112.4B",
    dividendYield: "0.48%",
    competitors: [
      { ticker: "META", name: "Meta Platforms, Inc.", price: 512.4, changePercent: 0.88, color: "#0668e1" },
      { ticker: "MSFT", name: "Microsoft Corporation", price: 425.18, changePercent: 0.68, color: "#00a4ef" },
      { ticker: "AMZN", name: "Amazon.com, Inc.", price: 198.5, changePercent: 0.45, color: "#ff9900" },
    ],
  },
  TSLA: {
    ticker: "TSLA",
    name: "Tesla, Inc.",
    price: 248.42,
    change: -3.18,
    changePercent: -1.26,
    logoColor: "#cc0000",
    marketCap: "$890B",
    revenue: "$96.8B",
    peRatio: "45.2",
    eps: "$3.12",
    ebitda: "$14.2B",
    dividendYield: "—",
    competitors: [
      { ticker: "F", name: "Ford Motor Company", price: 11.24, changePercent: 0.32, color: "#003478" },
      { ticker: "GM", name: "General Motors", price: 44.82, changePercent: -0.15, color: "#0070c9" },
      { ticker: "RIVN", name: "Rivian Automotive", price: 12.68, changePercent: 2.1, color: "#1a1a1a" },
    ],
  },
  BTC: {
    ticker: "BTC",
    name: "Bitcoin",
    price: 67240.5,
    change: 1240.2,
    changePercent: 1.88,
    logoColor: "#f7931a",
    marketCap: "$1.9T",
    revenue: "—",
    peRatio: "N/A",
    eps: "N/A",
    ebitda: "—",
    dividendYield: "—",
    volume24h: "$42.6B",
    circulatingSupply: "19.8M BTC",
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
  MU: {
    ticker: "MU",
    name: "Micron Technology, Inc.",
    price: 98.42,
    change: 1.86,
    changePercent: 1.93,
    logoColor: "#0071c5",
    marketCap: "$180B",
    revenue: "$25.1B",
    peRatio: "28.4",
    eps: "$1.30",
    ebitda: "$8.2B",
    dividendYield: "0.45%",
    competitors: [
      { ticker: "NVDA", name: "NVIDIA Corporation", price: 131.38, changePercent: -2.29, color: "#76b900" },
      { ticker: "AMD", name: "Advanced Micro Devices", price: 168.32, changePercent: 1.45, color: "#ed1c24" },
      { ticker: "INTC", name: "Intel Corporation", price: 31.86, changePercent: -0.31, color: "#0071c5" },
    ],
  },
  BAC: {
    ticker: "BAC",
    name: "Bank of America Corp.",
    price: 38.24,
    change: 0.42,
    changePercent: 1.11,
    logoColor: "#012169",
    marketCap: "$340B",
    revenue: "$98.6B",
    peRatio: "14.2",
    eps: "$3.42",
    ebitda: "$45.2B",
    dividendYield: "2.4%",
    competitors: [
      { ticker: "JPM", name: "JPMorgan Chase & Co.", price: 198.5, changePercent: 0.65, color: "#006747" },
      { ticker: "WFC", name: "Wells Fargo & Company", price: 58.12, changePercent: 0.48, color: "#cd1409" },
      { ticker: "C", name: "Citigroup Inc.", price: 62.4, changePercent: 0.32, color: "#056dae" },
    ],
  },
};

const CRYPTO_TICKERS = new Set(["BTC", "ETH"]);

function isMissingFinancial(value: string): boolean {
  const v = value.trim();
  return !v || v === "—" || v === "-" || v === "N/A";
}

/** Plausible demo financials for unknown tickers */
function demoFinancials(seed: string, isCrypto: boolean) {
  if (isCrypto) {
    const capT = pseudoRandom(`${seed}-cap`, 0.5, 2.5);
    return {
      marketCap: `$${capT.toFixed(2)}T`,
      revenue: "—",
      peRatio: "N/A",
      eps: "N/A",
      ebitda: "—",
      dividendYield: "—",
      volume24h: `$${pseudoRandom(`${seed}-vol`, 8, 68).toFixed(1)}B`,
      circulatingSupply: `${pseudoRandom(`${seed}-sup`, 80, 120).toFixed(1)}M ${seed}`,
    };
  }

  const capB = pseudoRandom(`${seed}-cap`, 15, 3200);
  const marketCap =
    capB >= 1000
      ? `$${(capB / 1000).toFixed(2)}T`
      : `$${capB.toFixed(0)}B`;

  return {
    marketCap,
    revenue: `$${pseudoRandom(`${seed}-rev`, 8, 420).toFixed(1)}B`,
    peRatio: pseudoRandom(`${seed}-pe`, 8, 72).toFixed(1),
    eps: `$${pseudoRandom(`${seed}-eps`, 0.8, 22).toFixed(2)}`,
    ebitda: `$${pseudoRandom(`${seed}-ebitda`, 12, 180).toFixed(1)}B`,
    dividendYield: `${pseudoRandom(`${seed}-div`, 0, 3.2).toFixed(2)}%`,
  };
}

function withDemoFinancials(
  profile: Omit<StockProfile, "chartData">,
  seed: string
): Omit<StockProfile, "chartData"> {
  const demo = demoFinancials(seed, CRYPTO_TICKERS.has(profile.ticker));
  return {
    ...profile,
    marketCap: isMissingFinancial(profile.marketCap)
      ? demo.marketCap
      : profile.marketCap,
    revenue: isMissingFinancial(profile.revenue)
      ? demo.revenue
      : profile.revenue,
    peRatio: isMissingFinancial(profile.peRatio) ? demo.peRatio : profile.peRatio,
    eps: isMissingFinancial(profile.eps) ? demo.eps : profile.eps,
    ebitda: isMissingFinancial(profile.ebitda) ? demo.ebitda : profile.ebitda,
    dividendYield: isMissingFinancial(profile.dividendYield)
      ? demo.dividendYield
      : profile.dividendYield,
    volume24h:
      profile.volume24h ??
      ("volume24h" in demo ? demo.volume24h : undefined),
    circulatingSupply:
      profile.circulatingSupply ??
      ("circulatingSupply" in demo ? demo.circulatingSupply : undefined),
  };
}

export function getStockProfile(ticker: string): StockProfile {
  const upper = ticker.toUpperCase();
  const meta = getTickerMetaBySymbol(upper);
  const stored = STOCK_PROFILES[upper];

  const raw: Omit<StockProfile, "chartData"> = stored ?? {
    ticker: upper,
    name: meta.companyName,
    logoColor: meta.logoColor,
    price: pseudoRandom(upper, 50, 500),
    change: pseudoRandom(`${upper}-c`, 0.5, 15),
    changePercent: pseudoRandom(`${upper}-p`, -2, 4),
    marketCap: "",
    revenue: "",
    peRatio: "",
    eps: "",
    ebitda: "",
    dividendYield: "",
    competitors: [],
  };

  const base = withDemoFinancials(raw, upper);

  const chartData = {} as Record<ChartRange, ChartPoint[]>;
  (Object.keys(CHART_LABELS) as ChartRange[]).forEach((range) => {
    chartData[range] = generateChart(
      `${upper}-${range}`,
      base.price,
      CHART_LABELS[range].length,
      CHART_LABELS[range]
    );
  });

  return { ...base, chartData };
}
