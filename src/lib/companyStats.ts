import type { StockQuote } from "@/lib/twelveDataApi";
import type { CompanyFundamentals } from "@/lib/twelveDataFundamentals";
import type { STOCK_METRIC_EXPLANATIONS } from "@/lib/stockMetricExplanations";
import type { StockProfile } from "@/lib/types";
import { pseudoRandom } from "@/lib/utils";

export interface CompanyStatRow {
  label: string;
  value: string;
  explanationKey: keyof typeof STOCK_METRIC_EXPLANATIONS;
}

// ADR / foreign-incorporated tickers where Twelve Data's shares_outstanding
// reflects the LOCAL exchange's ordinary share count, not the ADR-equivalent
// share count. Multiplying our live ADR price by that local share count
// produces a wildly inflated market cap (confirmed: TSM showed $10.88T vs a
// real ~$2.1T, ~5x too high — exactly TSM's 5-ordinary-shares-per-ADR
// ratio). Rather than hand-maintain every company's ADR ratio (error-prone
// and hard to verify without live data), we just trust Twelve Data's own
// pre-calculated market cap for these — it's computed for the ADR-listed
// entity directly and doesn't have this share-count-basis mismatch.
const FOREIGN_INCORPORATED_TICKERS = new Set([
  "TSM",
  "ASML",
  "SAP",
  "BABA",
  "TCEHY",
  "NVS",
  "UBS",
  "VALE",
  "ITUB",
  "BBD",
  "ABEV",
  "AMX",
  "INFY",
  "PDD",
  "JD",
]);

// Dual-share-class tickers where Twelve Data's shares_outstanding for the
// class we request doesn't match the price/EPS we're getting. Confirmed for
// BRK: we route to BRK.B for a correct price ($488) and EPS ($33.59), but
// shares_outstanding still comes back as BRK.A's ~1.44M share count instead
// of BRK.B's ~2.16B — self-computed market cap was off by ~1,500x, exactly
// the A-to-B share conversion ratio. Same fix as the ADR case: trust Twelve
// Data's own market cap, and don't show a shares-outstanding figure we know
// is for the wrong share class.
const SHARE_CLASS_MISMATCH_TICKERS = new Set(["BRK"]);

function skipsSelfComputedShareMath(seed: string): boolean {
  return (
    FOREIGN_INCORPORATED_TICKERS.has(seed) ||
    SHARE_CLASS_MISMATCH_TICKERS.has(seed)
  );
}

const EMPLOYEE_COUNTS: Record<string, string> = {
  AAPL: "166K",
  MSFT: "228K",
  GOOGL: "183K",
  GOOG: "183K",
  AMZN: "1.55M",
  META: "74K",
  NVDA: "36K",
  TSLA: "141K",
  JPM: "318K",
  BAC: "213K",
};

function formatUsd(value: number): string {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** "147K" / "1.55M" style — matches the existing static employee-count formatting. */
function formatEmployeeCount(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${Number.isInteger(millions) ? millions.toFixed(0) : millions.toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}K`;
  }
  return String(Math.round(value));
}

function formatCompact(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(2)}T`;
  }
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  return String(Math.round(value));
}

function parsePercent(value: string): number | null {
  const match = value.replace(/,/g, "").match(/([\d.]+)\s*%/);
  return match ? Number(match[1]) : null;
}

function parseMarketCapToNumber(value: string): number | null {
  const normalized = value.replace(/[$,]/g, "").trim().toUpperCase();
  const match = normalized.match(/^([\d.]+)(T|B|M)?$/);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return null;
  const unit = match[2];
  if (unit === "T") return amount * 1_000_000_000_000;
  if (unit === "B") return amount * 1_000_000_000;
  if (unit === "M") return amount * 1_000_000;
  return amount;
}

export { parseMarketCapToNumber };

function formatExDividendDate(seed: string): string {
  const offsetDays = Math.floor(pseudoRandom(`${seed}-exdiv`, 20, 120));
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Formats a live ISO ex-dividend date (Twelve Data reports the most recent
 * past ex-div date, not a predicted future one — that's more honest than a
 * randomly generated future date, even if the label doesn't distinguish
 * past/future). Returns null if the string can't be parsed. */
function formatIsoDividendDate(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function deriveDayBar(price: number, seed: string) {
  const open = price * pseudoRandom(`${seed}-open`, 0.985, 1.012);
  const high = Math.max(open, price) * pseudoRandom(`${seed}-high`, 1.002, 1.028);
  const low = Math.min(open, price) * pseudoRandom(`${seed}-low`, 0.972, 0.998);
  const volume = Math.round(
    pseudoRandom(`${seed}-vol`, 8_000_000, 95_000_000)
  );
  return { open, high, low, volume };
}

export function buildCompanyStatColumns(
  ticker: string,
  stock: StockProfile,
  liveQuote: StockQuote | null,
  displayPrice: number,
  liveFundamentals?: CompanyFundamentals | null,
  /** True when this ticker is eligible for a live fundamentals fetch
   * (mirrors StockPanel's `needsLiveQuote`). Used to tell "still
   * loading/failed" apart from "never attempted" — only the latter should
   * fall back to static demo data. */
  attemptsLiveFundamentals = false
): [CompanyStatRow[], CompanyStatRow[], CompanyStatRow[]] {
  const seed = ticker.toUpperCase();
  const price = displayPrice > 0 ? displayPrice : stock.price;
  const day = liveQuote?.day ?? deriveDayBar(price, seed);
  const avgVolume = Math.round(
    day.volume * pseudoRandom(`${seed}-avgvol`, 1.08, 1.42)
  );

  const week52High =
    liveQuote?.week52High ??
    price * pseudoRandom(`${seed}-52h`, 1.08, 1.35);
  const week52Low =
    liveQuote?.week52Low ?? price * pseudoRandom(`${seed}-52l`, 0.62, 0.92);

  // Live fundamentals (market cap, P/E, EPS, dividend, beta, shares
  // outstanding) come from Twelve Data's /statistics endpoint. If we're
  // attempting a live fetch for this ticker, show "—" instead of the old
  // fake/demo numbers whenever a specific field isn't in yet — whether
  // still loading or the fetch failed. Never display fabricated data as if
  // real. Static demo data is only used for tickers we never attempt to
  // fetch live fundamentals for (non-US-listed, crypto, etc).
  const hasLiveFundamentals = attemptsLiveFundamentals;

  const epsText =
    liveFundamentals?.eps != null
      ? formatUsd(liveFundamentals.eps)
      : hasLiveFundamentals
        ? "—"
        : stock.eps;

  // Market cap and P/E are DERIVED from price, so Twelve Data's own
  // pre-calculated values can go stale if their internal cache refreshes
  // those fields less often than the live quote (confirmed: seen mismatched
  // by ~60% for a fast-moving ticker). Since we already have a verified-live
  // price, compute both ourselves from that price + shares outstanding/EPS
  // instead of trusting Twelve Data's cached ratio — this can only ever be
  // as stale as the live price itself, which we know is fresh.
  const skipShareMath = skipsSelfComputedShareMath(seed);

  const marketCapText = (() => {
    // For ADR/foreign-incorporated and dual-share-class tickers,
    // shares_outstanding is on a different basis than the price we're
    // showing — trust Twelve Data's own market cap instead of self-computing
    // (see FOREIGN_INCORPORATED_TICKERS / SHARE_CLASS_MISMATCH_TICKERS).
    if (skipShareMath && liveFundamentals?.marketCap != null) {
      return `$${formatCompact(liveFundamentals.marketCap)}`;
    }
    if (liveFundamentals?.sharesOutstanding != null && price > 0) {
      return `$${formatCompact(price * liveFundamentals.sharesOutstanding)}`;
    }
    if (liveFundamentals?.marketCap != null) {
      return `$${formatCompact(liveFundamentals.marketCap)}`;
    }
    return hasLiveFundamentals ? "—" : stock.marketCap;
  })();

  const peRatioText = (() => {
    if (liveFundamentals?.eps != null && liveFundamentals.eps > 0 && price > 0) {
      return (price / liveFundamentals.eps).toFixed(1);
    }
    if (liveFundamentals?.peRatio != null) {
      return liveFundamentals.peRatio.toFixed(1);
    }
    return hasLiveFundamentals ? "—" : stock.peRatio;
  })();

  const dividendYieldText =
    liveFundamentals?.dividendYield != null
      ? `${liveFundamentals.dividendYield.toFixed(2)}%`
      : hasLiveFundamentals
        ? "—"
        : stock.dividendYield;

  const betaText =
    liveFundamentals?.beta != null
      ? liveFundamentals.beta.toFixed(2)
      : hasLiveFundamentals
        ? "—"
        : pseudoRandom(`${seed}-beta`, 0.75, 1.45).toFixed(2);

  const sharesOutstandingText = (() => {
    // For dual-share-class tickers, Twelve Data's shares_outstanding is for
    // the wrong class entirely (see SHARE_CLASS_MISMATCH_TICKERS) — showing
    // it would be actively misleading, not just imprecise, so we suppress
    // it rather than display a number we know is wrong.
    if (SHARE_CLASS_MISMATCH_TICKERS.has(seed)) return "—";
    if (liveFundamentals?.sharesOutstanding != null) {
      return formatCompact(liveFundamentals.sharesOutstanding);
    }
    if (hasLiveFundamentals) return "—";
    const marketCapValue = parseMarketCapToNumber(stock.marketCap);
    return marketCapValue && price > 0
      ? formatCompact(marketCapValue / price)
      : formatCompact(
          pseudoRandom(`${seed}-shares`, 500_000_000, 18_000_000_000)
        );
  })();

  const exDividendDateText = (() => {
    // A ticker with a 0% (or unknown) dividend yield shouldn't show an
    // ex-dividend date at all — Twelve Data sometimes returns a stale
    // historical date (e.g. from a one-off spinoff/distribution decades
    // ago) for companies that don't currently pay a regular dividend,
    // which reads as confusing/wrong data next to a "0.00%" yield.
    if (hasLiveFundamentals && !liveFundamentals?.dividendYield) return "—";
    const live = liveFundamentals?.exDividendDate
      ? formatIsoDividendDate(liveFundamentals.exDividendDate)
      : null;
    if (live) return live;
    if (hasLiveFundamentals) return "—";
    return formatExDividendDate(seed);
  })();

  // Quarterly dividend is derived client-side from the live dividend yield
  // and current price, so it automatically stays consistent with both.
  const dividendPctForQuarterly =
    liveFundamentals?.dividendYield ?? parsePercent(stock.dividendYield);
  const quarterlyDividend =
    dividendPctForQuarterly && dividendPctForQuarterly > 0
      ? `$${((price * (dividendPctForQuarterly / 100)) / 4).toFixed(2)}`
      : "—";

  const employees = (() => {
    if (liveFundamentals?.employees != null) {
      return formatEmployeeCount(liveFundamentals.employees);
    }
    if (hasLiveFundamentals) return "—";
    return (
      EMPLOYEE_COUNTS[seed] ??
      `${Math.round(pseudoRandom(`${seed}-emp`, 4, 420))}K`
    );
  })();

  const columnOne: CompanyStatRow[] = [
    { label: "Open", value: formatUsd(day.open), explanationKey: "Open" },
    { label: "High", value: formatUsd(day.high), explanationKey: "High" },
    { label: "Low", value: formatUsd(day.low), explanationKey: "Low" },
    {
      label: "Mkt. cap",
      value: marketCapText,
      explanationKey: "Mkt. cap",
    },
    {
      label: "Avg. vol.",
      value: formatCompact(avgVolume),
      explanationKey: "Avg. vol.",
    },
    {
      label: "Volume",
      value: formatCompact(day.volume),
      explanationKey: "Volume",
    },
  ];

  const columnTwo: CompanyStatRow[] = [
    {
      label: "Dividend",
      value: dividendYieldText,
      explanationKey: "Dividend",
    },
    {
      label: "Quarterly dividend",
      value: quarterlyDividend,
      explanationKey: "Quarterly dividend",
    },
    {
      label: "Ex-dividend date",
      value: exDividendDateText,
      explanationKey: "Ex-dividend date",
    },
    {
      label: "P/E ratio",
      value: peRatioText,
      explanationKey: "P/E ratio",
    },
    {
      label: "52-wk high",
      value: formatUsd(week52High),
      explanationKey: "52-wk high",
    },
    {
      label: "52-wk low",
      value: formatUsd(week52Low),
      explanationKey: "52-wk low",
    },
  ];

  const columnThree: CompanyStatRow[] = [
    { label: "EPS", value: epsText, explanationKey: "EPS" },
    { label: "Beta", value: betaText, explanationKey: "Beta" },
    {
      label: "Shares outstanding",
      value: sharesOutstandingText,
      explanationKey: "Shares outstanding",
    },
    {
      label: "No. of employees",
      value: employees,
      explanationKey: "No. of employees",
    },
  ];

  return [columnOne, columnTwo, columnThree];
}
