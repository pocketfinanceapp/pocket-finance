import {
  type AppCurrency,
  convertFromUsd,
  currencySymbol,
  DEFAULT_APP_CURRENCY,
} from "./regionPreferences";

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** Active display currency — updated from AppContext when prefs change. */
let activeDisplayCurrency: AppCurrency = DEFAULT_APP_CURRENCY;

export function setActiveDisplayCurrency(currency: AppCurrency): void {
  activeDisplayCurrency = currency;
}

export function getActiveDisplayCurrency(): AppCurrency {
  return activeDisplayCurrency;
}

/** Adaptive decimals for equities and micro-priced crypto */
export function formatAssetPrice(price: number, withSymbol = false): string {
  const currency = activeDisplayCurrency;
  if (!Number.isFinite(price)) {
    return withSymbol ? `${currencySymbol(currency)}—` : "—";
  }

  const converted = convertFromUsd(price, currency);
  const abs = Math.abs(converted);
  let digits = 2;
  if (currency === "JPY") {
    digits = 0;
  } else if (abs > 0 && abs < 0.0001) digits = 8;
  else if (abs > 0 && abs < 0.01) digits = 6;
  else if (abs > 0 && abs < 1) digits = 4;
  else if (abs >= 1000) digits = 2;

  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: currency === "JPY" ? 0 : Math.min(2, digits),
    maximumFractionDigits: digits,
  });

  const signed = converted < 0 ? `-${formatted}` : formatted;
  return withSymbol ? `${currencySymbol(currency)}${signed}` : signed;
}

export function formatAssetChange(change: number): string {
  if (!Number.isFinite(change)) return "—";
  return formatAssetPrice(Math.abs(change));
}

/** Round prices without zeroing out micro crypto quotes */
export function roundPrice(price: number): number {
  if (!Number.isFinite(price)) return 0;
  const abs = Math.abs(price);
  let factor = 100;
  if (abs > 0 && abs < 0.0001) factor = 1e10;
  else if (abs > 0 && abs < 0.01) factor = 1e8;
  else if (abs > 0 && abs < 1) factor = 1e6;
  else if (abs < 100) factor = 100;
  else factor = 100;
  return Math.round(price * factor) / factor;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function readTime(text: string): string {
  const words = text.split(/\s+/).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min read`;
}

export function hashId(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

export function pseudoRandom(seed: string, min: number, max: number): number {
  const n = parseInt(hashId(seed), 36) % 10000;
  return min + (n / 10000) * (max - min);
}
