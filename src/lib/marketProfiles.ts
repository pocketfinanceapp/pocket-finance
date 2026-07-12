import type { MarketFilter } from "./filters";
import {
  getMarketById,
  type GlobalMarket,
  type MarketRegionId,
} from "./markets";

export interface MarketProfile {
  description: string;
  currency: string;
  timeZone: string;
  tradingHours: string;
  listedCompanies: number;
  marketCap: string;
  avgDailyVolume: string;
  ytdChange: number;
  weekChange: number;
  monthChange: number;
  yearHigh: number;
  yearLow: number;
  constituents: string[];
}

const MARKET_PROFILES: Record<MarketFilter, Omit<MarketProfile, never>> = {
  NASDAQ: {
    description:
      "The Nasdaq Stock Market is a global electronic marketplace known for technology, growth, and innovation-led listings.",
    currency: "USD",
    timeZone: "America/New_York",
    tradingHours: "9:30 AM – 4:00 PM ET",
    listedCompanies: 3300,
    marketCap: "$28.4T",
    avgDailyVolume: "$68B",
    ytdChange: 8.4,
    weekChange: 1.2,
    monthChange: 3.1,
    yearHigh: 19240,
    yearLow: 16200,
    constituents: ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META"],
  },
  NYSE: {
    description:
      "The New York Stock Exchange is the world's largest equities exchange by market capitalization, home to blue chips and global leaders.",
    currency: "USD",
    timeZone: "America/New_York",
    tradingHours: "9:30 AM – 4:00 PM ET",
    listedCompanies: 2300,
    marketCap: "$32.1T",
    avgDailyVolume: "$52B",
    ytdChange: 6.8,
    weekChange: 0.9,
    monthChange: 2.4,
    yearHigh: 20100,
    yearLow: 17100,
    constituents: ["JPM", "V", "XOM", "JNJ", "WMT", "BAC"],
  },
  TSX: {
    description:
      "The Toronto Stock Exchange is Canada's premier market for equities, resources, and financial services.",
    currency: "CAD",
    timeZone: "America/Toronto",
    tradingHours: "9:30 AM – 4:00 PM ET",
    listedCompanies: 1500,
    marketCap: "C$3.8T",
    avgDailyVolume: "C$4.2B",
    ytdChange: 4.2,
    weekChange: 0.6,
    monthChange: 1.8,
    yearHigh: 23500,
    yearLow: 19800,
    constituents: ["RY", "SHOP", "BHP", "JPM", "XOM", "BAC"],
  },
  LSE: {
    description:
      "The London Stock Exchange is a leading global venue for international equities, financials, and energy names.",
    currency: "GBP",
    timeZone: "Europe/London",
    tradingHours: "8:00 AM – 4:30 PM GMT",
    listedCompanies: 1000,
    marketCap: "£4.1T",
    avgDailyVolume: "£5.8B",
    ytdChange: 3.6,
    weekChange: 0.4,
    monthChange: 1.5,
    yearHigh: 8700,
    yearLow: 7400,
    constituents: ["SHEL", "BP", "JPM", "XOM", "BAC", "GS"],
  },
  Euronext: {
    description:
      "Euronext operates integrated European exchanges spanning Paris, Amsterdam, Brussels, and other major hubs.",
    currency: "EUR",
    timeZone: "Europe/Paris",
    tradingHours: "9:00 AM – 5:30 PM CET",
    listedCompanies: 1800,
    marketCap: "€6.2T",
    avgDailyVolume: "€8.1B",
    ytdChange: 5.1,
    weekChange: 0.7,
    monthChange: 2.0,
    yearHigh: 1580,
    yearLow: 1320,
    constituents: ["JPM", "BAC", "GS", "XOM", "V", "MA"],
  },
  ASX: {
    description:
      "The Australian Securities Exchange lists leading miners, banks, and regional growth companies across the Asia-Pacific time zone.",
    currency: "AUD",
    timeZone: "Australia/Sydney",
    tradingHours: "10:00 AM – 4:00 PM AEDT",
    listedCompanies: 2200,
    marketCap: "A$2.6T",
    avgDailyVolume: "A$6.5B",
    ytdChange: 4.8,
    weekChange: 0.5,
    monthChange: 1.9,
    yearHigh: 8400,
    yearLow: 7100,
    constituents: ["BHP", "JPM", "BAC", "XOM", "WMT", "KO"],
  },
  Nikkei: {
    description:
      "The Tokyo Stock Exchange anchors Japanese equities with global exporters, industrials, and technology leaders.",
    currency: "JPY",
    timeZone: "Asia/Tokyo",
    tradingHours: "9:00 AM – 3:00 PM JST",
    listedCompanies: 3800,
    marketCap: "¥780T",
    avgDailyVolume: "¥4.2T",
    ytdChange: 11.2,
    weekChange: 1.4,
    monthChange: 3.8,
    yearHigh: 40200,
    yearLow: 31800,
    constituents: ["TM", "SONY", "NVDA", "AAPL", "AMD", "INTC"],
  },
  HKEX: {
    description:
      "Hong Kong Exchanges and Clearing connects international capital with China-linked growth and financial listings.",
    currency: "HKD",
    timeZone: "Asia/Hong_Kong",
    tradingHours: "9:30 AM – 4:00 PM HKT",
    listedCompanies: 2600,
    marketCap: "HK$32T",
    avgDailyVolume: "HK$120B",
    ytdChange: -2.4,
    weekChange: -0.8,
    monthChange: -1.2,
    yearHigh: 19500,
    yearLow: 15800,
    constituents: ["BABA", "TCEHY", "BHP", "JPM", "BAC", "XOM"],
  },
  TWSE: {
    description:
      "The Taiwan Stock Exchange is a major venue for semiconductors, hardware, and Asia-Pacific technology supply chains.",
    currency: "TWD",
    timeZone: "Asia/Taipei",
    tradingHours: "9:00 AM – 1:30 PM CST",
    listedCompanies: 950,
    marketCap: "NT$58T",
    avgDailyVolume: "NT$280B",
    ytdChange: 14.6,
    weekChange: 1.8,
    monthChange: 4.5,
    yearHigh: 22800,
    yearLow: 17200,
    constituents: ["TSM", "NVDA", "AMD", "AAPL", "INTC", "QCOM"],
  },
  SGX: {
    description:
      "Singapore Exchange lists regional banks, REITs, and Southeast Asia's most liquid large-cap names.",
    currency: "SGD",
    timeZone: "Asia/Singapore",
    tradingHours: "9:00 AM – 5:00 PM SGT",
    listedCompanies: 700,
    marketCap: "S$900B",
    avgDailyVolume: "S$1.2B",
    ytdChange: 3.9,
    weekChange: 0.3,
    monthChange: 1.1,
    yearHigh: 3450,
    yearLow: 3050,
    constituents: ["BHP", "JPM", "BAC", "XOM", "WMT", "DIS"],
  },
  BSE: {
    description:
      "The Bombay Stock Exchange is one of Asia's oldest exchanges and a gateway to India's fast-growing economy.",
    currency: "INR",
    timeZone: "Asia/Kolkata",
    tradingHours: "9:15 AM – 3:30 PM IST",
    listedCompanies: 5400,
    marketCap: "₹385T",
    avgDailyVolume: "₹850B",
    ytdChange: 9.8,
    weekChange: 1.1,
    monthChange: 2.9,
    yearHigh: 83500,
    yearLow: 69800,
    constituents: ["INFY", "WMT", "JPM", "BAC", "XOM", "KO"],
  },
  SSE: {
    description:
      "The Shanghai Stock Exchange is mainland China's primary venue for large-cap state-owned and consumer leaders.",
    currency: "CNY",
    timeZone: "Asia/Shanghai",
    tradingHours: "9:30 AM – 3:00 PM CST",
    listedCompanies: 2200,
    marketCap: "¥58T",
    avgDailyVolume: "¥420B",
    ytdChange: 2.1,
    weekChange: -0.4,
    monthChange: 0.6,
    yearHigh: 3280,
    yearLow: 2850,
    constituents: ["BABA", "BHP", "JPM", "BAC", "XOM", "WMT"],
  },
  KRX: {
    description:
      "Korea Exchange lists globally relevant chipmakers, autos, and Korea's largest industrial conglomerates.",
    currency: "KRW",
    timeZone: "Asia/Seoul",
    tradingHours: "9:00 AM – 3:30 PM KST",
    listedCompanies: 2400,
    marketCap: "₩2,450T",
    avgDailyVolume: "₩9.5T",
    ytdChange: 7.4,
    weekChange: 0.9,
    monthChange: 2.6,
    yearHigh: 2820,
    yearLow: 2340,
    constituents: ["SONY", "TM", "NVDA", "AMD", "INTC", "QCOM"],
  },
  XETRA: {
    description:
      "Xetra is Deutsche Börse's electronic trading platform and home to Germany's DAX blue chips and European industrials.",
    currency: "EUR",
    timeZone: "Europe/Berlin",
    tradingHours: "9:00 AM – 5:30 PM CET",
    listedCompanies: 1100,
    marketCap: "€2.1T",
    avgDailyVolume: "€5.4B",
    ytdChange: 6.2,
    weekChange: 0.8,
    monthChange: 2.2,
    yearHigh: 22800,
    yearLow: 18600,
    constituents: ["SAP", "ASML", "SHEL", "NVDA", "MSFT", "GOOGL"],
  },
  SIX: {
    description:
      "SIX Swiss Exchange lists global healthcare, banking, and industrial leaders from Switzerland.",
    currency: "CHF",
    timeZone: "Europe/Zurich",
    tradingHours: "9:00 AM – 5:30 PM CET",
    listedCompanies: 250,
    marketCap: "CHF 1.8T",
    avgDailyVolume: "CHF 3.1B",
    ytdChange: 4.4,
    weekChange: 0.5,
    monthChange: 1.4,
    yearHigh: 12400,
    yearLow: 10800,
    constituents: ["NVS", "ROG", "UBS", "NESN", "ABBN", "ZURN"],
  },
  B3: {
    description:
      "B3 is Brazil's main stock exchange, anchoring Latin America's largest equity and derivatives market.",
    currency: "BRL",
    timeZone: "America/Sao_Paulo",
    tradingHours: "10:00 AM – 5:00 PM BRT",
    listedCompanies: 400,
    marketCap: "R$5.8T",
    avgDailyVolume: "R$22B",
    ytdChange: 8.6,
    weekChange: 1.2,
    monthChange: 3.4,
    yearHigh: 135000,
    yearLow: 112000,
    constituents: ["VALE", "PETR", "ITUB", "BBD", "ABEV", "WEGE"],
  },
  BMV: {
    description:
      "Bolsa Mexicana de Valores is Mexico's primary exchange for large-cap consumer, finance, and telecom names.",
    currency: "MXN",
    timeZone: "America/Mexico_City",
    tradingHours: "8:30 AM – 3:00 PM CST",
    listedCompanies: 140,
    marketCap: "MX$7.2T",
    avgDailyVolume: "MX$9.5B",
    ytdChange: 5.3,
    weekChange: 0.4,
    monthChange: 1.7,
    yearHigh: 57800,
    yearLow: 49200,
    constituents: ["AMX", "WALMEX", "GFNORTE", "BIMBO", "CEMEX", "FEMSA"],
  },
  TADAWUL: {
    description:
      "Saudi Exchange (Tadawul) is the Gulf's largest stock market, dominated by energy, banking, and materials giants.",
    currency: "SAR",
    timeZone: "Asia/Riyadh",
    tradingHours: "10:00 AM – 3:00 PM AST",
    listedCompanies: 220,
    marketCap: "SAR 9.1T",
    avgDailyVolume: "SAR 4.8B",
    ytdChange: 3.8,
    weekChange: 0.6,
    monthChange: 1.5,
    yearHigh: 12200,
    yearLow: 10400,
    constituents: ["ARAMCO", "RJHI", "SABIC", "STC", "ALRAJHI", "MAADEN"],
  },
};

const REGION_LABELS: Record<MarketRegionId, string> = {
  americas: "Americas",
  europe: "Europe",
  apac: "Asia Pacific",
};

export interface MarketDetail extends GlobalMarket {
  profile: MarketProfile;
  regionLabel: string;
}

export function getMarketProfile(id: MarketFilter): MarketProfile {
  return MARKET_PROFILES[id];
}

export function getMarketDetail(id: MarketFilter): MarketDetail | undefined {
  const market = getMarketById(id);
  if (!market) return undefined;
  return {
    ...market,
    profile: getMarketProfile(id),
    regionLabel: REGION_LABELS[market.region],
  };
}

export function isMarketSessionOpen(
  marketId: MarketFilter,
  now = new Date()
): boolean {
  const sessions: Partial<
    Record<MarketFilter, { tz: string; open: [number, number]; close: [number, number] }>
  > = {
    NASDAQ: { tz: "America/New_York", open: [9, 30], close: [16, 0] },
    NYSE: { tz: "America/New_York", open: [9, 30], close: [16, 0] },
    TSX: { tz: "America/Toronto", open: [9, 30], close: [16, 0] },
    LSE: { tz: "Europe/London", open: [8, 0], close: [16, 30] },
    Euronext: { tz: "Europe/Paris", open: [9, 0], close: [17, 30] },
    ASX: { tz: "Australia/Sydney", open: [10, 0], close: [16, 0] },
    Nikkei: { tz: "Asia/Tokyo", open: [9, 0], close: [15, 0] },
    HKEX: { tz: "Asia/Hong_Kong", open: [9, 30], close: [16, 0] },
    TWSE: { tz: "Asia/Taipei", open: [9, 0], close: [13, 30] },
    SGX: { tz: "Asia/Singapore", open: [9, 0], close: [17, 0] },
    BSE: { tz: "Asia/Kolkata", open: [9, 15], close: [15, 30] },
    SSE: { tz: "Asia/Shanghai", open: [9, 30], close: [15, 0] },
    KRX: { tz: "Asia/Seoul", open: [9, 0], close: [15, 30] },
  };

  const session = sessions[marketId];
  if (!session) return false;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: session.tz,
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
  const openMins = session.open[0] * 60 + session.open[1];
  const closeMins = session.close[0] * 60 + session.close[1];

  return mins >= openMins && mins < closeMins;
}
