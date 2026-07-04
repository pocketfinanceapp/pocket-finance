"use client";

import { useEffect, useMemo, useState } from "react";
import {
  TOP_MOVER_TABS,
  formatStockPrice,
  getMoverSparkline,
  getTopMovers,
  type TopMover,
  type TopMoverTab,
} from "@/lib/topMovers";
import type { MassiveStockQuote } from "@/lib/massiveApi";
import { fetchStockQuote } from "@/lib/stockQuoteClient";
import { getTickerMetaBySymbol } from "@/lib/tickerMap";
import { CompanyLogo } from "./CompanyLogo";
import { MarketSparkline } from "./MarketSparkline";
import { SectionTabs } from "./SectionTabs";

export function TopMoversSection() {
  const [tab, setTab] = useState<TopMoverTab>("active");
  const movers = useMemo(() => getTopMovers(tab), [tab]);
  const [liveQuotes, setLiveQuotes] = useState<
    Record<string, MassiveStockQuote>
  >({});

  useEffect(() => {
    let cancelled = false;
    setLiveQuotes({});

    void Promise.all(
      movers.map(async (mover) => {
        const quote = await fetchStockQuote(mover.ticker);
        return [mover.ticker, quote] as const;
      })
    ).then((results) => {
      if (cancelled) return;

      const next: Record<string, MassiveStockQuote> = {};
      for (const [ticker, quote] of results) {
        if (quote) next[ticker] = quote;
      }
      setLiveQuotes(next);
    });

    return () => {
      cancelled = true;
    };
  }, [movers]);

  return (
    <section className="mt-5">
      <h2 className="px-4 pb-2 text-xs font-semibold uppercase tracking-widest text-pocket-muted">
        Top Movers
      </h2>
      <SectionTabs tabs={TOP_MOVER_TABS} active={tab} onChange={setTab} />
      <div className="mx-4 mt-2 overflow-hidden rounded-2xl pf-card-surface">
        <ul>
          {movers.map((mover, i) => {
            const quote = liveQuotes[mover.ticker];
            const displayMover: TopMover = quote
              ? {
                  ...mover,
                  price: quote.price,
                  changePercent: quote.changePercent,
                }
              : mover;

            return (
            <TopMoverRow
              key={`${tab}-${mover.ticker}`}
              mover={displayMover}
              showDivider={i < movers.length - 1}
            />
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function TopMoverRow({
  mover,
  showDivider,
}: {
  mover: TopMover;
  showDivider: boolean;
}) {
  const up = mover.changePercent >= 0;
  const sparkline = useMemo(() => getMoverSparkline(mover), [mover]);
  const meta = getTickerMetaBySymbol(mover.ticker);

  return (
    <li
      className={`flex items-center gap-3 px-4 py-3 ${
        showDivider ? "border-b border-[var(--pocket-border)]" : ""
      }`}
    >
      <CompanyLogo ticker={mover.ticker} color={meta.logoColor} size={36} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-bold text-pocket-text">
          {mover.ticker}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-pocket-muted">
          {mover.name}
        </p>
      </div>

      <MarketSparkline points={sparkline} up={up} width={56} height={22} />

      <div className="shrink-0 text-right">
        <p className="text-[13px] font-semibold tabular-nums text-pocket-text">
          {formatStockPrice(mover.price)}
        </p>
        <span
          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
            up
              ? "bg-pocket-green/15 text-pocket-green"
              : "bg-pocket-red/15 text-pocket-red"
          }`}
        >
          {up ? "+" : ""}
          {mover.changePercent.toFixed(2)}%
        </span>
      </div>
    </li>
  );
}
