"use client";

import { getSectorPerformance } from "@/lib/sectorPerformance";
import {
  tabStaggerStyle,
  useTabEntered,
} from "@/lib/tabEnterAnimation";

export function SectorPerformanceSection() {
  const sectors = getSectorPerformance();
  const entered = useTabEntered(true);

  return (
    <section className="mt-5">
      <h2 className="px-0 pb-2 text-xs font-semibold uppercase tracking-widest text-pocket-muted">
        Sector performance
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {sectors.map((sector, index) => {
          const positive = sector.changePercent >= 0;
          return (
            <div
              key={sector.id}
              className="pf-card-surface flex min-h-[72px] flex-col justify-between rounded-2xl border border-[var(--pocket-border)] px-3 py-2.5"
              style={tabStaggerStyle(entered, index, 20)}
            >
              <span className="line-clamp-1 text-[11px] font-semibold text-pocket-muted">
                {sector.label}
              </span>
              <span
                className={`text-[14px] font-bold tabular-nums ${
                  positive ? "text-[#00C6C6]" : "text-red-400"
                }`}
              >
                {positive ? "+" : ""}
                {sector.changePercent.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
