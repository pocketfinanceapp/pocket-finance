import type { MarketFilter } from "./filters";
import { marketToFilter } from "./filters";
import type { MarketRegionId } from "./markets";
import { getMarketById, MARKET_REGIONS } from "./markets";

const REGION_KEY = "pocket-preferred-region";
const CURRENCY_KEY = "pocket-preferred-currency";
const CURRENCY_OVERRIDE_KEY = "pocket-currency-manual";

export const APP_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "AUD",
  "CAD",
  "JPY",
  "HKD",
  "SGD",
  "INR",
  "CHF",
] as const;

export type AppCurrency = (typeof APP_CURRENCIES)[number];

export const APP_REGIONS = [
  {
    id: "us",
    label: "United States",
    countryCode: "us",
    currency: "USD",
    marketRegion: "americas",
    primaryMarkets: ["NASDAQ", "NYSE"],
  },
  {
    id: "uk",
    label: "United Kingdom",
    countryCode: "gb",
    currency: "GBP",
    marketRegion: "europe",
    primaryMarkets: ["LSE"],
  },
  {
    id: "eu",
    label: "Europe",
    countryCode: "eu",
    currency: "EUR",
    marketRegion: "europe",
    primaryMarkets: ["Euronext", "XETRA"],
  },
  {
    id: "au",
    label: "Australia",
    countryCode: "au",
    currency: "AUD",
    marketRegion: "apac",
    primaryMarkets: ["ASX"],
  },
  {
    id: "ca",
    label: "Canada",
    countryCode: "ca",
    currency: "CAD",
    marketRegion: "americas",
    primaryMarkets: ["TSX"],
  },
  {
    id: "jp",
    label: "Japan",
    countryCode: "jp",
    currency: "JPY",
    marketRegion: "apac",
    primaryMarkets: ["Nikkei"],
  },
  {
    id: "hk",
    label: "Hong Kong",
    countryCode: "hk",
    currency: "HKD",
    marketRegion: "apac",
    primaryMarkets: ["HKEX"],
  },
  {
    id: "sg",
    label: "Singapore",
    countryCode: "sg",
    currency: "SGD",
    marketRegion: "apac",
    primaryMarkets: ["SGX"],
  },
  {
    id: "in",
    label: "India",
    countryCode: "in",
    currency: "INR",
    marketRegion: "apac",
    primaryMarkets: ["BSE"],
  },
] as const satisfies readonly {
  id: string;
  label: string;
  countryCode: string;
  currency: AppCurrency;
  marketRegion: MarketRegionId;
  primaryMarkets: readonly MarketFilter[];
}[];

export type AppRegionId = (typeof APP_REGIONS)[number]["id"];

export const DEFAULT_APP_REGION: AppRegionId = "us";
export const DEFAULT_APP_CURRENCY: AppCurrency = "USD";

/** Approximate USD → local for display only (quotes remain USD-seeded). */
const USD_TO_CURRENCY: Record<AppCurrency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  AUD: 1.53,
  CAD: 1.37,
  JPY: 151,
  HKD: 7.82,
  SGD: 1.34,
  INR: 83.5,
  CHF: 0.88,
};

const CURRENCY_SYMBOL: Record<AppCurrency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  AUD: "A$",
  CAD: "C$",
  JPY: "¥",
  HKD: "HK$",
  SGD: "S$",
  INR: "₹",
  CHF: "CHF ",
};

export function isAppRegionId(value: string): value is AppRegionId {
  return APP_REGIONS.some((region) => region.id === value);
}

export function isAppCurrency(value: string): value is AppCurrency {
  return (APP_CURRENCIES as readonly string[]).includes(value);
}

export function getAppRegion(id: AppRegionId) {
  return APP_REGIONS.find((region) => region.id === id) ?? APP_REGIONS[0];
}

export function currencyForRegion(regionId: AppRegionId): AppCurrency {
  return getAppRegion(regionId).currency;
}

export function loadPreferredRegion(): AppRegionId {
  if (typeof window === "undefined") return DEFAULT_APP_REGION;
  try {
    const raw = localStorage.getItem(REGION_KEY);
    if (raw && isAppRegionId(raw)) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_APP_REGION;
}

export function savePreferredRegion(regionId: AppRegionId): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REGION_KEY, regionId);
}

export function loadPreferredCurrency(): AppCurrency {
  if (typeof window === "undefined") return DEFAULT_APP_CURRENCY;
  try {
    const raw = localStorage.getItem(CURRENCY_KEY);
    if (raw && isAppCurrency(raw)) return raw;
  } catch {
    /* ignore */
  }
  return currencyForRegion(loadPreferredRegion());
}

export function savePreferredCurrency(currency: AppCurrency): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CURRENCY_KEY, currency);
}

export function loadCurrencyManualOverride(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(CURRENCY_OVERRIDE_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveCurrencyManualOverride(manual: boolean): void {
  if (typeof window === "undefined") return;
  if (manual) localStorage.setItem(CURRENCY_OVERRIDE_KEY, "1");
  else localStorage.removeItem(CURRENCY_OVERRIDE_KEY);
}

export function hasSavedRegionPreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(REGION_KEY);
    return Boolean(raw && isAppRegionId(raw));
  } catch {
    return false;
  }
}

export function convertFromUsd(
  amountUsd: number,
  currency: AppCurrency
): number {
  return amountUsd * USD_TO_CURRENCY[currency];
}

export function currencySymbol(currency: AppCurrency): string {
  return CURRENCY_SYMBOL[currency];
}

function marketRegionForLabel(articleMarket: string): MarketRegionId | null {
  const bucket = marketToFilter(articleMarket);
  if (bucket) {
    const market = getMarketById(bucket);
    if (market) return market.region;
  }
  const direct = getMarketById(articleMarket as MarketFilter);
  return direct?.region ?? null;
}

export function articleMatchesPreferredRegion(
  articleMarket: string,
  regionId: AppRegionId
): boolean {
  const preferred = getAppRegion(regionId);
  const bucket = marketToFilter(articleMarket);
  const primary = preferred.primaryMarkets as readonly MarketFilter[];
  if (bucket && primary.includes(bucket)) return true;
  const articleRegion = marketRegionForLabel(articleMarket);
  return articleRegion === preferred.marketRegion;
}

export function marketMatchesPreferredRegion(
  marketId: MarketFilter | string,
  regionId: AppRegionId
): boolean {
  const preferred = getAppRegion(regionId);
  const primary = preferred.primaryMarkets as readonly MarketFilter[];
  if (primary.includes(marketId as MarketFilter)) return true;
  const market = getMarketById(marketId as MarketFilter);
  return market?.region === preferred.marketRegion;
}

/** Put the preferred geographic bucket first; keep others in catalog order. */
export function orderMarketRegionsByPreference(regionId: AppRegionId) {
  const preferred = getAppRegion(regionId).marketRegion;
  return [...MARKET_REGIONS].sort((a, b) => {
    if (a.id === preferred && b.id !== preferred) return -1;
    if (b.id === preferred && a.id !== preferred) return 1;
    return 0;
  });
}
