"use client";

import { ChevronRight, ExternalLink, Newspaper } from "lucide-react";
import { CompanyLogo } from "./CompanyLogo";

/* ── Known company tickers (show CompanyLogo; everything else → editorial tile) */

const TICKER_COLORS: Record<string, string> = {
  AAPL: "#4a4a4a",
  MSFT: "#00A4EF",
  GOOGL: "#4285F4",
  GOOG: "#4285F4",
  AMZN: "#FF9900",
  NVDA: "#76B900",
  TSLA: "#CC0000",
  META: "#0866FF",
  BTC: "#F7931A",
  ETH: "#627EEA",
  COIN: "#0052FF",
  NFLX: "#E50914",
  JPM: "#1D4D8E",
  GS: "#7399C6",
  BAC: "#E31837",
  WFC: "#D71E28",
  V: "#1A1F71",
  MA: "#EB001B",
  PYPL: "#003087",
  DIS: "#006EBF",
  INTC: "#0068B5",
  AMD: "#ED1C24",
  QCOM: "#3253DC",
  NVDA_ALT: "#76B900",
  HOOD: "#00C805",
  SHOP: "#96BF48",
  SNAP: "#FFFC00",
  SPOT: "#1DB954",
  PLTR: "#1D2333",
  XOM: "#FF0000",
  CVX: "#007AC2",
};

/** Only these tickers render a CompanyLogo tile; all others get editorial tile */
const KNOWN_TICKERS = new Set(Object.keys(TICKER_COLORS));

export function tickerLogoColor(ticker: string): string {
  return TICKER_COLORS[ticker.toUpperCase()] ?? "#3B6EF5";
}

function isKnownTicker(ticker: string): boolean {
  return KNOWN_TICKERS.has(ticker.toUpperCase());
}

/* ── Component ───────────────────────────────────────────────────────────── */

interface ProfileArticlePreviewProps {
  title: string;
  /** Source name displayed under the headline */
  source: string;
  /**
   * When provided, renders a CompanyLogo tile.
   * When absent, renders a neutral editorial tile (Newspaper icon).
   * Never pass an incorrect ticker — pass undefined instead.
   */
  ticker?: string;
  timestamp: string;
  /** External article URL — opens in a new tab */
  href?: string;
  /** Internal tap handler (used when no href is appropriate) */
  onClick?: () => void;
  /** "link" shows an ExternalLink icon; "chevron" (default) shows ChevronRight */
  endIcon?: "chevron" | "link";
}

export function ProfileArticlePreview({
  title,
  source,
  ticker,
  timestamp,
  href,
  onClick,
  endIcon = "chevron",
}: ProfileArticlePreviewProps) {
  const row = (
    <div className="flex items-center gap-3 px-4 py-3 active:bg-[var(--pocket-surface-hover)]">
      {/* Logo tile: only for known company tickers; else neutral editorial */}
      {ticker && isKnownTicker(ticker) ? (
        <div className="shrink-0 overflow-hidden rounded-xl">
          <CompanyLogo
            ticker={ticker}
            color={tickerLogoColor(ticker)}
            size={44}
            shape="square"
          />
        </div>
      ) : (
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--pocket-border)] bg-[var(--pocket-surface)]"
        >
          <Newspaper className="h-5 w-5 text-pocket-muted" />
        </div>
      )}

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[13px] font-medium leading-snug text-pocket-text">
          {title}
        </p>
        <p className="mt-0.5 text-[11px] text-pocket-muted">
          {source} · {timestamp}
        </p>
      </div>

      {/* End icon */}
      {endIcon === "link" ? (
        <ExternalLink className="h-4 w-4 shrink-0 text-pocket-muted" />
      ) : (
        <ChevronRight className="h-4 w-4 shrink-0 text-pocket-muted" />
      )}
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        data-no-drag
        className="block"
      >
        {row}
      </a>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        data-no-drag
        onClick={onClick}
        className="block w-full text-left"
      >
        {row}
      </button>
    );
  }

  return <div>{row}</div>;
}
