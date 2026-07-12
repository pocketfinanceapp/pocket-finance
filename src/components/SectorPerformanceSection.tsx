"use client";

import { getSectorPerformance } from "@/lib/sectorPerformance";

export function SectorPerformanceSection() {
  const sectors = getSectorPerformance();

  return (
    <section className="mt-5">
      <h2 className="px-0 pb-2 text-xs font-semibold uppercase tracking-widest text-pocket-muted">
        Sector performance
      </h2>
      <div className="-mx-4 overflow-x-auto px-4 pb-1">
        <div className="flex w-max gap-2.5">
          {sectors.map((sector) => {
            const positive = sector.changePercent >= 0;
            return (
              <div
                key={sector.id}
                className="pf-card-surface flex min-w-[132px] shrink-0 flex-col rounded-2xl border border-[var(--pocket-border)] px-3.5 py-3"
              >
                <span className="text-[11px] font-semibold text-pocket-muted">
                  {sector.label}
                </span>
                <span
                  className={`mt-1 text-[15px] font-bold tabular-nums ${
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
      </div>
    </section>
  );
}
