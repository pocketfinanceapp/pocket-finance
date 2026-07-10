import type { MarketFilter } from "./filters";

export type MarketRegionId = "americas" | "europe" | "apac";

export interface GlobalMarket {
  id: MarketFilter;
  name: string;
  fullName: string;
  indexName: string;
  country: string;
  region: MarketRegionId;
  countryCode: string;
  value: number;
  changePercent: number;
}

export interface MarketRegionGroup {
  id: MarketRegionId;
  label: string;
  marketIds: MarketFilter[];
}

export const MARKET_REGIONS: MarketRegionGroup[] = [
  {
    id: "americas",
    label: "Americas",
    marketIds: ["NASDAQ", "NYSE", "TSX"],
  },
  {
    id: "europe",
    label: "Europe",
    marketIds: ["LSE", "Euronext"],
  },
  {
    id: "apac",
    label: "Asia Pacific",
    marketIds: ["ASX", "Nikkei", "HKEX", "TWSE", "SGX", "BSE", "SSE", "KRX"],
  },
];

export const GLOBAL_MARKETS: GlobalMarket[] = [
  {
    id: "ASX",
    name: "ASX",
    fullName: "Australian Securities Exchange",
    indexName: "S&P/ASX 200",
    country: "Australia",
    region: "apac",
    countryCode: "au",
    value: 8234.12,
    changePercent: 0.42,
  },
  {
    id: "NASDAQ",
    name: "NASDAQ",
    fullName: "Nasdaq Stock Market",
    indexName: "NASDAQ Composite",
    country: "United States",
    region: "americas",
    countryCode: "us",
    value: 18924.77,
    changePercent: 0.56,
  },
  {
    id: "NYSE",
    name: "NYSE",
    fullName: "New York Stock Exchange",
    indexName: "NYSE Composite",
    country: "United States",
    region: "americas",
    countryCode: "us",
    value: 19842.31,
    changePercent: 0.21,
  },
  {
    id: "LSE",
    name: "LSE",
    fullName: "London Stock Exchange",
    indexName: "FTSE 100",
    country: "United Kingdom",
    region: "europe",
    countryCode: "gb",
    value: 8412.33,
    changePercent: -0.12,
  },
  {
    id: "Nikkei",
    name: "Nikkei",
    fullName: "Tokyo Stock Exchange",
    indexName: "Nikkei 225",
    country: "Japan",
    region: "apac",
    countryCode: "jp",
    value: 39872.5,
    changePercent: 0.31,
  },
  {
    id: "HKEX",
    name: "HKEX",
    fullName: "Hong Kong Exchanges and Clearing",
    indexName: "Hang Seng",
    country: "Hong Kong",
    region: "apac",
    countryCode: "hk",
    value: 17892.44,
    changePercent: -0.28,
  },
  {
    id: "TWSE",
    name: "TWSE",
    fullName: "Taiwan Stock Exchange",
    indexName: "TAIEX",
    country: "Taiwan",
    region: "apac",
    countryCode: "tw",
    value: 22456.78,
    changePercent: 0.35,
  },
  {
    id: "TSX",
    name: "TSX",
    fullName: "Toronto Stock Exchange",
    indexName: "S&P/TSX Composite",
    country: "Canada",
    region: "americas",
    countryCode: "ca",
    value: 23118.65,
    changePercent: 0.15,
  },
  {
    id: "Euronext",
    name: "Euronext",
    fullName: "Euronext N.V.",
    indexName: "Euronext 100",
    country: "Europe",
    region: "europe",
    countryCode: "eu",
    value: 1542.88,
    changePercent: 0.09,
  },
  {
    id: "SGX",
    name: "SGX",
    fullName: "Singapore Exchange",
    indexName: "Straits Times",
    country: "Singapore",
    region: "apac",
    countryCode: "sg",
    value: 3342.17,
    changePercent: 0.38,
  },
  {
    id: "BSE",
    name: "BSE India",
    fullName: "Bombay Stock Exchange",
    indexName: "S&P BSE Sensex",
    country: "India",
    region: "apac",
    countryCode: "in",
    value: 82341.2,
    changePercent: 0.62,
  },
  {
    id: "SSE",
    name: "SSE China",
    fullName: "Shanghai Stock Exchange",
    indexName: "SSE Composite",
    country: "China",
    region: "apac",
    countryCode: "cn",
    value: 3124.86,
    changePercent: -0.44,
  },
  {
    id: "KRX",
    name: "KRX Korea",
    fullName: "Korea Exchange",
    indexName: "KOSPI",
    country: "South Korea",
    region: "apac",
    countryCode: "kr",
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

function hashSeed(id: string): number {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/** Deterministic 7-day sparkline normalized to 0–100 */
export function getMarketSparkline(market: GlobalMarket): number[] {
  const seed = hashSeed(market.id);
  const up = market.changePercent >= 0;
  const points: number[] = [];
  let v = 48 + (seed % 12);

  for (let i = 0; i < 7; i++) {
    const noise = ((seed >> (i * 3)) & 7) - 3;
    v += (up ? 1.6 : -1.6) + noise * 0.7;
    points.push(Math.max(8, Math.min(92, v)));
  }

  if (up) points[6] = Math.max(points[6], points[0] + 6);
  else points[6] = Math.min(points[6], points[0] - 6);

  return points;
}

function isSessionOpen(
  now: Date,
  timeZone: string,
  openHour: number,
  openMinute: number,
  closeHour: number,
  closeMinute: number
): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);

  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  if (weekday === "Sat" || weekday === "Sun") return false;

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const mins = hour * 60 + minute;
  const openMins = openHour * 60 + openMinute;
  const closeMins = closeHour * 60 + closeMinute;

  return mins >= openMins && mins < closeMins;
}

export function getGlobalMarketStatus(now = new Date()): {
  open: boolean;
  label: "Markets open" | "Markets closed";
} {
  const sessions = [
    isSessionOpen(now, "America/New_York", 9, 30, 16, 0),
    isSessionOpen(now, "Europe/London", 8, 0, 16, 30),
    isSessionOpen(now, "Asia/Tokyo", 9, 0, 15, 0),
    isSessionOpen(now, "Australia/Sydney", 10, 0, 16, 0),
    isSessionOpen(now, "Asia/Hong_Kong", 9, 30, 16, 0),
    isSessionOpen(now, "Asia/Taipei", 9, 0, 13, 30),
  ];
  const open = sessions.some(Boolean);
  return { open, label: open ? "Markets open" : "Markets closed" };
}

export function getMarketsByRegion(
  region: MarketRegionGroup,
  markets = GLOBAL_MARKETS
): GlobalMarket[] {
  return region.marketIds
    .map((id) => markets.find((m) => m.id === id))
    .filter((m): m is GlobalMarket => m !== undefined);
}

export function countMarketMovers(markets = GLOBAL_MARKETS): {
  up: number;
  down: number;
} {
  let up = 0;
  let down = 0;
  for (const m of markets) {
    if (m.changePercent >= 0) up += 1;
    else down += 1;
  }
  return { up, down };
}

/** @deprecated Use GLOBAL_MARKETS */
export const MAJOR_INDICES = GLOBAL_MARKETS.slice(0, 5).map((m) => ({
  id: m.id.toLowerCase(),
  name: m.indexName,
  region: m.country,
  value: m.value,
  changePercent: m.changePercent,
}));
