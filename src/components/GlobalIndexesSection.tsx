"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
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
    <section className="mt-6">
      <h2 className="px-4 pb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Global Indexes
      </h2>
      <SectionTabs
        tabs={GLOBAL_INDEX_REGIONS}
        active={region}
        onChange={setRegion}
      />
      <div className="mx-4 mt-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
        <ul>
          {indexes.map((index, i) => {
            const up = index.changePercent >= 0;
            const textColor = up ? "text-[#34c759]" : "text-[#ff453a]";

            return (
              <li
                key={index.id}
                className={`flex items-center gap-3 px-4 py-3.5 ${
                  i < indexes.length - 1 ? "border-b border-white/[0.06]" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-white">
                    {index.name}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                    {index.fullName}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[14px] tabular-nums text-white">
                    {formatIndexValue(index.value)}
                  </p>
                  <p
                    className={`mt-0.5 text-[12px] font-medium tabular-nums ${textColor}`}
                  >
                    {up ? "+" : ""}
                    {index.changePercent.toFixed(2)}%
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
        <SectionFooter label="View all indexes" />
      </div>
    </section>
  );
}

function SectionFooter({ label }: { label: string }) {
  return (
    <button
      type="button"
      data-no-drag
      className="flex w-full items-center justify-center gap-1 border-t border-white/[0.06] py-3 text-sm font-medium text-zinc-400 transition-colors active:text-white"
    >
      {label}
      <ChevronRight className="h-4 w-4" />
    </button>
  );
}
