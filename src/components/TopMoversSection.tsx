"use client";

import { useMemo, useState } from "react";
import {
  TOP_MOVER_TABS,
  TOP_MOVERS,
  formatStockPrice,
  getMoverSparkline,
  type TopMover,
  type TopMoverTab,
} from "@/lib/topMovers";
import { MarketSparkline } from "./MarketSparkline";
import { SectionTabs } from "./SectionTabs";

export function TopMoversSection() {
  const [tab, setTab] = useState<TopMoverTab>("active");
  const movers = TOP_MOVERS[tab];

  return (
    <section className="mt-4">
      <h2 className="px-4 pb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Top Movers
      </h2>
      <SectionTabs tabs={TOP_MOVER_TABS} active={tab} onChange={setTab} />
      <ul className="mt-1">
        {movers.map((mover) => (
          <TopMoverRow key={`${tab}-${mover.ticker}`} mover={mover} />
        ))}
      </ul>
    </section>
  );
}

function TopMoverRow({ mover }: { mover: TopMover }) {
  const up = mover.changePercent >= 0;
  const sparkline = useMemo(() => getMoverSparkline(mover), [mover]);

  return (
    <li className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
      <div className="min-w-0 w-[72px] shrink-0">
        <p className="truncate text-[14px] font-bold text-white">
          {mover.ticker}
        </p>
        <p className="truncate text-[10px] text-zinc-500">{mover.name}</p>
      </div>

      <MarketSparkline points={sparkline} up={up} width={56} height={22} />

      <div className="ml-auto shrink-0 text-right">
        <p className="text-[13px] tabular-nums text-white">
          {formatStockPrice(mover.price)}
        </p>
        <span
          className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
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
