import type { MassiveStockQuote } from "@/lib/massiveApi";
import type { STOCK_METRIC_EXPLANATIONS } from "@/lib/stockMetricExplanations";
import type { StockProfile } from "@/lib/types";
import { pseudoRandom } from "@/lib/utils";

export interface CompanyStatRow {
  label: string;
  value: string;
  explanationKey: keyof typeof STOCK_METRIC_EXPLANATIONS;
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
  liveQuote: MassiveStockQuote | null,
  displayPrice: number
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

  const dividendPct = parsePercent(stock.dividendYield);
  const quarterlyDividend =
    dividendPct && dividendPct > 0
      ? `$${((price * (dividendPct / 100)) / 4).toFixed(2)}`
      : "—";

  const marketCapValue = parseMarketCapToNumber(stock.marketCap);
  const sharesOutstanding =
    marketCapValue && price > 0
      ? formatCompact(marketCapValue / price)
      : formatCompact(
          pseudoRandom(`${seed}-shares`, 500_000_000, 18_000_000_000)
        );

  const beta = pseudoRandom(`${seed}-beta`, 0.75, 1.45).toFixed(2);
  const employees =
    EMPLOYEE_COUNTS[seed] ??
    `${Math.round(pseudoRandom(`${seed}-emp`, 4, 420))}K`;

  const columnOne: CompanyStatRow[] = [
    { label: "Open", value: formatUsd(day.open), explanationKey: "Open" },
    { label: "High", value: formatUsd(day.high), explanationKey: "High" },
    { label: "Low", value: formatUsd(day.low), explanationKey: "Low" },
    {
      label: "Mkt. cap",
      value: stock.marketCap,
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
      value: stock.dividendYield,
      explanationKey: "Dividend",
    },
    {
      label: "Quarterly dividend",
      value: quarterlyDividend,
      explanationKey: "Quarterly dividend",
    },
    {
      label: "Ex-dividend date",
      value: formatExDividendDate(seed),
      explanationKey: "Ex-dividend date",
    },
    {
      label: "P/E ratio",
      value: stock.peRatio,
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
    { label: "EPS", value: stock.eps, explanationKey: "EPS" },
    { label: "Beta", value: beta, explanationKey: "Beta" },
    {
      label: "Shares outstanding",
      value: sharesOutstanding,
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
