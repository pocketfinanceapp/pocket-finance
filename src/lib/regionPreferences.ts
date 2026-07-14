import { COUNTRY_SEEDS } from "./countries";
import type { MarketFilter } from "./filters";
import { marketToFilter } from "./filters";
import type { MarketRegionId } from "./markets";
import { getMarketById, MARKET_REGIONS } from "./markets";

const REGION_KEY = "pocket-preferred-region";
const CURRENCY_KEY = "pocket-preferred-currency";
const CURRENCY_OVERRIDE_KEY = "pocket-currency-manual";

/** Currencies selectable for display conversion. */
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
  "CNY",
  "TWD",
  "KRW",
  "NZD",
  "SEK",
  "NOK",
  "DKK",
  "PLN",
  "BRL",
  "MXN",
  "ZAR",
  "AED",
  "SAR",
  "THB",
  "MYR",
  "IDR",
  "PHP",
  "VND",
  "TRY",
] as const;

export type AppCurrency = (typeof APP_CURRENCIES)[number];

export interface AppRegion {
  id: string;
  label: string;
  countryCode: string;
  currency: AppCurrency;
  marketRegion: MarketRegionId;
  primaryMarkets: readonly MarketFilter[];
}

const REGION_DEFAULT_MARKETS: Record<MarketRegionId, readonly MarketFilter[]> = {
  americas: ["NASDAQ", "NYSE"],
  europe: ["Euronext", "LSE"],
  apac: ["HKEX", "Nikkei"],
};

/** Map legacy / unsupported ISO codes onto display currencies we convert. */
function resolveAppCurrency(code: string): AppCurrency {
  const upper = code.toUpperCase();
  if ((APP_CURRENCIES as readonly string[]).includes(upper)) {
    return upper as AppCurrency;
  }
  return "USD";
}

export const APP_REGIONS: AppRegion[] = COUNTRY_SEEDS.map((seed) => ({
  id: seed.id,
  label: seed.label,
  countryCode: seed.id === "eu" ? "eu" : seed.id,
  currency: resolveAppCurrency(seed.currency),
  marketRegion: seed.marketRegion,
  primaryMarkets:
    seed.primaryMarkets ?? REGION_DEFAULT_MARKETS[seed.marketRegion],
}));

export type AppRegionId = string;

export const DEFAULT_APP_REGION: AppRegionId = "us";
export const DEFAULT_APP_CURRENCY: AppCurrency = "USD";

/** Older shortlist ids → current catalog ids. */
const LEGACY_REGION_IDS: Record<string, AppRegionId> = {
  uk: "gb",
};

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
  CNY: 7.24,
  TWD: 32.2,
  KRW: 1380,
  NZD: 1.66,
  SEK: 10.5,
  NOK: 10.7,
  DKK: 6.9,
  PLN: 3.95,
  BRL: 5.7,
  MXN: 19.8,
  ZAR: 18.2,
  AED: 3.67,
  SAR: 3.75,
  THB: 34.5,
  MYR: 4.45,
  IDR: 16200,
  PHP: 58,
  VND: 25400,
  TRY: 34.5,
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
  CNY: "¥",
  TWD: "NT$",
  KRW: "₩",
  NZD: "NZ$",
  SEK: "kr ",
  NOK: "kr ",
  DKK: "kr ",
  PLN: "zł ",
  BRL: "R$",
  MXN: "MX$",
  ZAR: "R ",
  AED: "AED ",
  SAR: "SAR ",
  THB: "฿",
  MYR: "RM ",
  IDR: "Rp ",
  PHP: "₱",
  VND: "₫",
  TRY: "₺",
};

export function isAppRegionId(value: string): value is AppRegionId {
  const normalized = LEGACY_REGION_IDS[value] ?? value;
  return APP_REGIONS.some((region) => region.id === normalized);
}

export function isAppCurrency(value: string): value is AppCurrency {
  return (APP_CURRENCIES as readonly string[]).includes(value);
}

export function getAppRegion(id: AppRegionId): AppRegion {
  const normalized = LEGACY_REGION_IDS[id] ?? id;
  return (
    APP_REGIONS.find((region) => region.id === normalized) ??
    APP_REGIONS.find((region) => region.id === DEFAULT_APP_REGION) ??
    APP_REGIONS[0]
  );
}

export function currencyForRegion(regionId: AppRegionId): AppCurrency {
  return getAppRegion(regionId).currency;
}

export function filterAppRegions(query: string): AppRegion[] {
  const q = query.trim().toLowerCase();
  if (!q) return APP_REGIONS;
  return APP_REGIONS.filter(
    (region) =>
      region.label.toLowerCase().includes(q) ||
      region.id.includes(q) ||
      region.currency.toLowerCase().includes(q)
  );
}

export function loadPreferredRegion(): AppRegionId {
  if (typeof window === "undefined") return DEFAULT_APP_REGION;
  try {
    const raw = localStorage.getItem(REGION_KEY);
    if (!raw) return DEFAULT_APP_REGION;
    const normalized = LEGACY_REGION_IDS[raw] ?? raw;
    if (isAppRegionId(normalized)) return normalized;
  } catch {
    /* ignore */
  }
  return DEFAULT_APP_REGION;
}

export function savePreferredRegion(regionId: AppRegionId): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REGION_KEY, LEGACY_REGION_IDS[regionId] ?? regionId);
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
    if (!raw) return false;
    const normalized = LEGACY_REGION_IDS[raw] ?? raw;
    return isAppRegionId(normalized);
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
