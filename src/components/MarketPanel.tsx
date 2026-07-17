"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Newspaper } from "lucide-react";
import type { MarketFilter } from "@/lib/filters";
import { getMarketDetail, isMarketSessionOpen } from "@/lib/marketProfiles";
import { fetchQuotes } from "@/lib/stockQuoteClient";
import type { StockQuote } from "@/lib/twelveDataApi";
import {
  getMarketDelayInfo,
  type QuoteDelayInfo,
} from "@/lib/twelveDataDelay";
import {
  STOCK_METRIC_EXPLANATIONS,
  type StockMetricExplanation,
} from "@/lib/stockMetricExplanations";
import { getTickerMetaBySymbol } from "@/lib/tickerMap";
import { isQuoteEligibleTicker } from "@/lib/usStockTickers";
import { formatAssetPrice } from "@/lib/utils";
import { CompanyLogo } from "./CompanyLogo";
import { FinancialTermPopup, type ExplanationContent } from "./FinancialTermPopup";
import { MarketFlag } from "./MarketFlag";
import { MetricInfoButton } from "./MetricInfoButton";

interface MarketPanelProps {
  marketId: MarketFilter;
  onBack: () => void;
  onOpenFeed: (market: MarketFilter) => void;
  onOpenCompany?: (ticker: string) => void;
}

type MarketMetricKey = keyof typeof STOCK_METRIC_EXPLANATIONS;

const MARKET_STATS: {
  label: string;
  explanationKey: MarketMetricKey;
  getValue: (listedCompanies: number, regionLabel: string, tradingHours: string, timeZone: string) => string;
}[] = [
  {
    label: "Listed companies",
    explanationKey: "Listed companies",
    getValue: (listed) => listed.toLocaleString(),
  },
  {
    label: "Region",
    explanationKey: "Region",
    getValue: (_l, region) => region,
  },
  {
    label: "Trading hours",
    explanationKey: "Trading hours",
    getValue: (_l, _r, hours) => hours,
  },
  {
    label: "Time zone",
    explanationKey: "Time zone",
    getValue: (_l, _r, _h, tz) => tz.replace(/_/g, " "),
  },
];

function Stat({
  label,
  value,
  onInfoClick,
}: {
  label: string;
  value: string;
  onInfoClick: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)] p-3.5">
      <div className="flex items-center gap-1.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-pocket-muted">
          {label}
        </p>
        <MetricInfoButton label={label} onClick={onInfoClick} />
      </div>
      <p className="mt-2 text-[15px] font-bold text-pocket-text">{value}</p>
    </div>
  );
}

export function MarketPanel({
  marketId,
  onBack,
  onOpenFeed,
  onOpenCompany,
}: MarketPanelProps) {
  const detail = getMarketDetail(marketId);
  const delay = getMarketDelayInfo(marketId);
  const [activeMetric, setActiveMetric] =
    useState<StockMetricExplanation | null>(null);
  const [delayPopup, setDelayPopup] = useState<ExplanationContent | null>(null);
  const [liveQuotes, setLiveQuotes] = useState<Record<string, StockQuote>>({});

  const eligibleConstituents = useMemo(
    () =>
      (detail?.profile.constituents ?? []).filter((t) =>
        isQuoteEligibleTicker(t)
      ),
    [detail]
  );

  useEffect(() => {
    let cancelled = false;
    setLiveQuotes({});
    void fetchQuotes(eligibleConstituents).then((quotes) => {
      if (!cancelled) setLiveQuotes(quotes);
    });
    return () => {
      cancelled = true;
    };
  }, [eligibleConstituents]);

  const openDelayInfo = (info: QuoteDelayInfo) => {
    setDelayPopup({
      displayName: info.title,
      explanation: info.explanation,
    });
  };

  if (!detail) {
    return (
      <div className="pf-page flex h-full flex-col items-center justify-center bg-pocket-bg px-4 text-pocket-muted">
        <p className="text-sm">Market details unavailable</p>
        <button
          type="button"
          data-no-drag
          onClick={onBack}
          className="mt-4 text-sm font-semibold text-[#00C6C6]"
        >
          Go back
        </button>
      </div>
    );
  }

  const profile = detail.profile;
  const sessionOpen = isMarketSessionOpen(marketId);

  return (
    <div className="pf-page flex h-full min-h-0 flex-col bg-pocket-bg text-pocket-text">
      <header
        className="shrink-0 border-b border-[var(--pocket-border)] bg-pocket-bg px-4 pb-3"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-no-drag
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full active:bg-[var(--pocket-surface-hover)]"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-pocket-text" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <MarketFlag countryCode={detail.countryCode} size={42} />
            <div className="min-w-0">
              <h1 className="truncate text-[20px] font-bold tracking-tight">
                {detail.name}
              </h1>
              <p className="truncate text-[12px] text-pocket-muted">
                {detail.fullName}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4"
        style={{ paddingBottom: "calc(7rem + env(safe-area-inset-bottom))" }}
      >
        <section className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-pocket-muted">
            {detail.indexName}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-pocket-muted">
            Index levels are hidden when Twelve Data cannot provide an accurate
            quote for this exchange on your plan.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                sessionOpen
                  ? "bg-pocket-green/15 text-pocket-green"
                  : "bg-[var(--pocket-surface-hover)] text-pocket-muted"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  sessionOpen ? "bg-pocket-green" : "bg-pocket-muted"
                }`}
              />
              {sessionOpen ? "Session open" : "Session closed"}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="rounded-md bg-[var(--pocket-surface-hover)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-pocket-muted">
                {delay.label}
              </span>
              <MetricInfoButton
                label={delay.title}
                size="sm"
                onClick={() => openDelayInfo(delay)}
              />
            </span>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-2 gap-3">
          {MARKET_STATS.map((stat) => (
            <Stat
              key={stat.label}
              label={stat.label}
              value={stat.getValue(
                profile.listedCompanies,
                detail.regionLabel,
                profile.tradingHours,
                profile.timeZone
              )}
              onInfoClick={() =>
                setActiveMetric(STOCK_METRIC_EXPLANATIONS[stat.explanationKey])
              }
            />
          ))}
        </section>

        {eligibleConstituents.length > 0 && (
          <section className="mt-6">
            <h2 className="text-[13px] font-bold uppercase tracking-widest text-pocket-muted">
              Top constituents
            </h2>
            <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)]">
              <ul>
                {eligibleConstituents.map((ticker, index) => {
                  const meta = getTickerMetaBySymbol(ticker);
                  const quote = liveQuotes[ticker];
                  const up = (quote?.changePercent ?? 0) >= 0;
                  const row = (
                    <>
                      <CompanyLogo
                        ticker={ticker}
                        color={meta.logoColor}
                        size={36}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-bold text-pocket-text">
                          {ticker}
                        </p>
                        <p className="truncate text-[11px] text-pocket-muted">
                          {meta.companyName}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        {quote ? (
                          <>
                            <p className="text-[13px] font-semibold tabular-nums text-pocket-text">
                              {formatAssetPrice(quote.price, true)}
                            </p>
                            <p
                              className={`mt-0.5 text-[11px] font-medium tabular-nums ${
                                up ? "text-pocket-green" : "text-pocket-red"
                              }`}
                            >
                              {up ? "+" : ""}
                              {quote.changePercent.toFixed(2)}%
                            </p>
                          </>
                        ) : (
                          <div className="ml-auto h-8 w-14 animate-pulse rounded bg-[var(--pocket-surface-hover)]" />
                        )}
                      </div>
                    </>
                  );

                  return (
                    <li
                      key={ticker}
                      className={
                        index < eligibleConstituents.length - 1
                          ? "border-b border-[var(--pocket-border)]"
                          : ""
                      }
                    >
                      {onOpenCompany ? (
                        <button
                          type="button"
                          data-no-drag
                          onClick={() => onOpenCompany(ticker)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-opacity active:opacity-70"
                        >
                          {row}
                        </button>
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-3">
                          {row}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        )}

        <section className="mt-6">
          <h2 className="text-[13px] font-bold uppercase tracking-widest text-pocket-muted">
            About
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-pocket-muted">
            {profile.description}
          </p>
        </section>

        <button
          type="button"
          data-no-drag
          onClick={() => onOpenFeed(detail.id)}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] py-3.5 text-[15px] font-bold text-white shadow-[0_8px_32px_rgba(59,110,245,0.25)] active:scale-[0.98]"
        >
          <Newspaper className="h-4 w-4" />
          View market feed
        </button>

        <p className="mt-4 pb-2 text-center text-[11px] leading-relaxed text-pocket-muted">
          Market data is for informational purposes only and is not investment
          advice.
        </p>
      </div>

      <FinancialTermPopup
        term={activeMetric ?? delayPopup}
        onClose={() => {
          setActiveMetric(null);
          setDelayPopup(null);
        }}
      />
    </div>
  );
}
