"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Newspaper } from "lucide-react";
import type { MarketFilter } from "@/lib/filters";
import {
  formatIndexValue,
  getMarketSparkline,
} from "@/lib/markets";
import {
  getMarketDetail,
  isMarketSessionOpen,
  type MarketDetail,
} from "@/lib/marketProfiles";
import { getChartPointsForPrice } from "@/lib/stockData";
import { getStockProfile } from "@/lib/stockData";
import { getTickerMetaBySymbol } from "@/lib/tickerMap";
import type { ChartRange } from "@/lib/types";
import { CompanyLogo } from "./CompanyLogo";
import { MarketFlag } from "./MarketFlag";
import { MarketSparkline } from "./MarketSparkline";
import { PriceChart } from "./PriceChart";

interface MarketPanelProps {
  marketId: MarketFilter;
  onBack: () => void;
  onOpenFeed: (market: MarketFilter) => void;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)] p-3.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-pocket-muted">
        {label}
      </p>
      <p className="mt-1.5 text-[15px] font-semibold text-pocket-text">{value}</p>
    </div>
  );
}

function ChangePill({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className={`inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
        up ? "bg-[#00C6C6]/15 text-[#00C6C6]" : "bg-red-400/15 text-red-400"
      }`}
    >
      {up ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

export function MarketPanel({ marketId, onBack, onOpenFeed }: MarketPanelProps) {
  const detail = useMemo(() => getMarketDetail(marketId), [marketId]);
  const [chartRange, setChartRange] = useState<ChartRange>("1M");

  if (!detail) {
    return (
      <div className="flex h-full items-center justify-center bg-pocket-bg px-6 text-pocket-muted">
        Market not found.
      </div>
    );
  }

  return (
    <MarketPanelContent
      detail={detail}
      chartRange={chartRange}
      onChartRangeChange={setChartRange}
      onBack={onBack}
      onOpenFeed={onOpenFeed}
    />
  );
}

function MarketPanelContent({
  detail,
  chartRange,
  onChartRangeChange,
  onBack,
  onOpenFeed,
}: {
  detail: MarketDetail;
  chartRange: ChartRange;
  onChartRangeChange: (range: ChartRange) => void;
  onBack: () => void;
  onOpenFeed: (market: MarketFilter) => void;
}) {
  const { profile } = detail;
  const isUp = detail.changePercent >= 0;
  const sessionOpen = isMarketSessionOpen(detail.id);
  const sparkline = getMarketSparkline(detail);
  const chartPoints = useMemo(
    () =>
      getChartPointsForPrice(
        detail.value,
        detail.id,
        chartRange,
        detail.value
      ),
    [detail.id, detail.value, chartRange]
  );
  const changeAbs = (detail.value * detail.changePercent) / 100;

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
            <MarketFlag countryCode={detail.countryCode} size={48} />
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
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-pocket-muted">
                {detail.indexName}
              </p>
              <p className="mt-1 text-[2rem] font-bold leading-none tracking-tight">
                {formatIndexValue(detail.value)}
              </p>
              <p className="mt-1 text-sm text-pocket-muted">{profile.currency}</p>
            </div>
            <MarketSparkline points={sparkline} up={isUp} width={72} height={32} />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p
              className={`text-sm font-semibold ${
                isUp ? "text-pocket-green" : "text-pocket-red"
              }`}
            >
              {isUp ? "▲" : "▼"} {Math.abs(changeAbs).toFixed(2)} (
              {Math.abs(detail.changePercent).toFixed(2)}%) Today
            </p>
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
          </div>
        </section>

        <div className="mt-6">
          <PriceChart
            data={chartPoints}
            range={chartRange}
            onRangeChange={onChartRangeChange}
          />
        </div>

        <section className="mt-6">
          <h2 className="text-[13px] font-bold uppercase tracking-widest text-pocket-muted">
            Performance
          </h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)] p-3 text-center">
              <p className="text-[10px] font-medium uppercase text-pocket-muted">1W</p>
              <div className="mt-1.5 flex justify-center">
                <ChangePill value={profile.weekChange} />
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)] p-3 text-center">
              <p className="text-[10px] font-medium uppercase text-pocket-muted">1M</p>
              <div className="mt-1.5 flex justify-center">
                <ChangePill value={profile.monthChange} />
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)] p-3 text-center">
              <p className="text-[10px] font-medium uppercase text-pocket-muted">YTD</p>
              <div className="mt-1.5 flex justify-center">
                <ChangePill value={profile.ytdChange} />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-2 gap-3">
          <Stat label="Market cap" value={profile.marketCap} />
          <Stat label="Listed companies" value={profile.listedCompanies.toLocaleString()} />
          <Stat label="Avg daily volume" value={profile.avgDailyVolume} />
          <Stat label="Region" value={detail.regionLabel} />
          <Stat label="52-week high" value={formatIndexValue(profile.yearHigh)} />
          <Stat label="52-week low" value={formatIndexValue(profile.yearLow)} />
          <Stat label="Trading hours" value={profile.tradingHours} />
          <Stat label="Time zone" value={profile.timeZone.replace(/_/g, " ")} />
        </section>

        <section className="mt-6">
          <h2 className="text-[13px] font-bold uppercase tracking-widest text-pocket-muted">
            Top constituents
          </h2>
          <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)]">
            <ul>
              {profile.constituents.map((ticker, index) => {
                const meta = getTickerMetaBySymbol(ticker);
                const stock = getStockProfile(ticker);
                const up = stock.changePercent >= 0;
                return (
                  <li
                    key={ticker}
                    className={`flex items-center gap-3 px-4 py-3 ${
                      index < profile.constituents.length - 1
                        ? "border-b border-[var(--pocket-border)]"
                        : ""
                    }`}
                  >
                    <CompanyLogo
                      ticker={ticker}
                      color={meta.logoColor}
                      size={36}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-bold text-pocket-text">{ticker}</p>
                      <p className="truncate text-[11px] text-pocket-muted">
                        {meta.companyName}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[13px] font-semibold tabular-nums text-pocket-text">
                        ${stock.price.toFixed(2)}
                      </p>
                      <p
                        className={`mt-0.5 text-[11px] font-medium tabular-nums ${
                          up ? "text-pocket-green" : "text-pocket-red"
                        }`}
                      >
                        {up ? "+" : ""}
                        {stock.changePercent.toFixed(2)}%
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

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
          Market data is for informational purposes only and is not investment advice.
        </p>
      </div>
    </div>
  );
}
