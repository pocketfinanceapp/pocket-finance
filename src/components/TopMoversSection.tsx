"use client";

import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  TOP_MOVER_TABS,
  formatStockPrice,
  getMoverSparkline,
  getTopMovers,
  type TopMover,
  type TopMoverTab,
} from "@/lib/topMovers";
import { getTickerMetaBySymbol } from "@/lib/tickerMap";
import { CompanyLogo } from "./CompanyLogo";
import { MarketSparkline } from "./MarketSparkline";
import { SectionTabs } from "./SectionTabs";

export function TopMoversSection() {
  const [tab, setTab] = useState<TopMoverTab>("active");
  const movers = useMemo(() => getTopMovers(tab), [tab]);

  return (
    <section className="mt-6">
      <h2 className="px-4 pb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Top Movers
      </h2>
      <SectionTabs tabs={TOP_MOVER_TABS} active={tab} onChange={setTab} />
      <div className="mx-4 mt-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
        <ul>
          {movers.map((mover, i) => (
            <TopMoverRow
              key={`${tab}-${mover.ticker}`}
              mover={mover}
              showDivider={i < movers.length - 1}
            />
          ))}
        </ul>
        <button
          type="button"
          data-no-drag
          className="flex w-full items-center justify-center gap-1 border-t border-white/[0.06] py-3 text-sm font-medium text-zinc-400 transition-colors active:text-white"
        >
          View all
          <ChevronRight className="h-4 w-4" />
        </button>
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
      className={`flex items-center gap-3 px-4 py-3.5 ${
        showDivider ? "border-b border-white/[0.06]" : ""
      }`}
    >
      <CompanyLogo ticker={mover.ticker} color={meta.logoColor} size={36} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-bold text-white">
          {mover.ticker}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-zinc-500">
          {mover.name}
        </p>
      </div>

      <MarketSparkline points={sparkline} up={up} width={56} height={22} />

      <div className="shrink-0 text-right">
        <p className="text-[13px] font-semibold tabular-nums text-white">
          {formatStockPrice(mover.price)}
        </p>
        <span
          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
            up
              ? "bg-[#34c759]/15 text-[#34c759]"
              : "bg-[#ff453a]/15 text-[#ff453a]"
          }`}
        >
          {up ? "+" : ""}
          {mover.changePercent.toFixed(2)}%
        </span>
      </div>
    </li>
  );
}
