"use client";

import { useState } from "react";
import {
  GLOBAL_INDEX_REGIONS,
  GLOBAL_INDEXES,
  type GlobalIndexRegion,
} from "@/lib/globalIndexes";
import { formatIndexValue } from "@/lib/markets";
import { SectionTabs } from "./SectionTabs";

export function GlobalIndexesSection() {
  const [region, setRegion] = useState<GlobalIndexRegion>("us");
  const indexes = GLOBAL_INDEXES[region];

  return (
    <section className="mt-4">
      <h2 className="px-4 pb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Global Indexes
      </h2>
      <SectionTabs
        tabs={GLOBAL_INDEX_REGIONS}
        active={region}
        onChange={setRegion}
      />
      <ul className="mt-1 max-h-[280px] overflow-y-auto overscroll-contain">
        {indexes.map((index) => {
          const up = index.changePercent >= 0;
          const borderColor = up ? "#34c759" : "#ff453a";
          const textColor = up ? "text-[#34c759]" : "text-[#ff453a]";

          return (
            <li
              key={index.id}
              className="flex items-center gap-3 border-b border-l-[3px] border-white/[0.06] py-3 pl-3 pr-4"
              style={{ borderLeftColor: borderColor }}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-white">
                  {index.name}
                </p>
                <p className="truncate text-[11px] text-zinc-500">
                  {index.fullName}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[14px] tabular-nums text-white">
                  {formatIndexValue(index.value)}
                </p>
                <p className={`text-[12px] font-medium tabular-nums ${textColor}`}>
                  {up ? "+" : ""}
                  {index.changePercent.toFixed(2)}%
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
