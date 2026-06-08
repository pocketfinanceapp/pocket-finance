import { applyPriceOverride } from "./priceOverrides";

export type TopMoverTab = "active" | "gainers" | "losers";

export interface TopMover {
  ticker: string;
  name: string;
  price: number;
  changePercent: number;
}

export const TOP_MOVER_TABS: { id: TopMoverTab; label: string }[] = [
  { id: "active", label: "Most Active" },
  { id: "gainers", label: "Day Gainers" },
  { id: "losers", label: "Day Losers" },
];

export const TOP_MOVERS: Record<TopMoverTab, TopMover[]> = {
  active: [
    { ticker: "NVDA", name: "NVIDIA Corporation", price: 205.1, changePercent: -6.2 },
    { ticker: "AAPL", name: "Apple Inc.", price: 201.45, changePercent: 0.84 },
    { ticker: "TSLA", name: "Tesla, Inc.", price: 248.32, changePercent: -2.15 },
    { ticker: "META", name: "Meta Platforms, Inc.", price: 612.8, changePercent: 1.32 },
    { ticker: "MSFT", name: "Microsoft Corporation", price: 415.6, changePercent: 0.55 },
  ],
  gainers: [
    { ticker: "AVGO", name: "Broadcom Inc.", price: 245.8, changePercent: 8.44 },
    { ticker: "ARM", name: "Arm Holdings plc", price: 132.5, changePercent: 6.21 },
    { ticker: "LLY", name: "Eli Lilly and Company", price: 1131.42, changePercent: 5.18 },
    { ticker: "ORCL", name: "Oracle Corporation", price: 198.3, changePercent: 4.87 },
    { ticker: "UBER", name: "Uber Technologies, Inc.", price: 88.45, changePercent: 3.92 },
  ],
  losers: [
    { ticker: "INTC", name: "Intel Corporation", price: 21.34, changePercent: -11.28 },
    { ticker: "MU", name: "Micron Technology, Inc.", price: 98.45, changePercent: -7.44 },
    { ticker: "QCOM", name: "QUALCOMM Incorporated", price: 152.3, changePercent: -5.88 },
    { ticker: "AMD", name: "Advanced Micro Devices, Inc.", price: 168.9, changePercent: -4.92 },
    { ticker: "NFLX", name: "Netflix, Inc.", price: 1042.5, changePercent: -3.15 },
  ],
};

function hashSeed(id: string): number {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/** Deterministic intraday sparkline normalized to 0–100 */
export function getMoverSparkline(mover: TopMover): number[] {
  const seed = hashSeed(mover.ticker);
  const up = mover.changePercent >= 0;
  const points: number[] = [];
  let v = 50 + (seed % 10);

  for (let i = 0; i < 8; i++) {
    const noise = ((seed >> (i * 2)) & 5) - 2;
    v += (up ? 1.4 : -1.4) + noise * 0.6;
    points.push(Math.max(10, Math.min(90, v)));
  }

  if (up) points[7] = Math.max(points[7], points[0] + 5);
  else points[7] = Math.min(points[7], points[0] - 5);

  return points;
}

function withPriceOverride(mover: TopMover): TopMover {
  const resolved = applyPriceOverride(mover.ticker, {
    price: mover.price,
    changePercent: mover.changePercent,
  });
  return {
    ...mover,
    price: resolved.price,
    changePercent: resolved.changePercent,
  };
}

export function getTopMovers(tab: TopMoverTab): TopMover[] {
  return TOP_MOVERS[tab].map(withPriceOverride);
}

export function formatStockPrice(price: number): string {
  return `$${price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
