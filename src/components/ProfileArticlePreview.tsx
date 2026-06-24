"use client";

import { ChevronRight, ExternalLink, Newspaper } from "lucide-react";
import { CompanyLogo } from "./CompanyLogo";

/* ── Ticker → brand colour ───────────────────────────────────────────────── */

const TICKER_COLORS: Record<string, string> = {
  AAPL: "#4a4a4a",
  MSFT: "#00A4EF",
  GOOGL: "#4285F4",
  AMZN: "#FF9900",
  NVDA: "#76B900",
  TSLA: "#CC0000",
  META: "#0866FF",
  BTC: "#F7931A",
  ETH: "#627EEA",
  SPX: "#3B6EF5",
  MARKET: "#3B6EF5",
};

export function tickerLogoColor(ticker: string): string {
  return TICKER_COLORS[ticker.toUpperCase()] ?? "#2a3060";
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
    <div className="flex items-center gap-3 px-4 py-3 active:bg-white/[0.04]">
      {/* Logo tile */}
      {ticker ? (
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
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor: "rgba(18,22,50,0.90)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <Newspaper className="h-5 w-5 text-zinc-600" />
        </div>
      )}

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[13px] font-medium leading-snug text-white">
          {title}
        </p>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          {source} · {timestamp}
        </p>
      </div>

      {/* End icon */}
      {endIcon === "link" ? (
        <ExternalLink className="h-4 w-4 shrink-0 text-zinc-600" />
      ) : (
        <ChevronRight className="h-4 w-4 shrink-0 text-zinc-700" />
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
