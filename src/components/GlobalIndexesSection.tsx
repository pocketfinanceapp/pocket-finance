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
    <section className="mt-5">
      <h2 className="px-4 pb-2 text-xs font-semibold uppercase tracking-widest text-pocket-muted">
        Global Indexes
      </h2>
      <SectionTabs
        tabs={GLOBAL_INDEX_REGIONS}
        active={region}
        onChange={setRegion}
      />
      <div className="mx-4 mt-2 overflow-hidden rounded-2xl pf-card-surface">
        <ul>
          {indexes.map((index, i) => {
            const up = index.changePercent >= 0;
            const textColor = up ? "text-pocket-green" : "text-pocket-red";

            return (
              <li
                key={index.id}
                className={`flex items-center gap-3 px-4 py-3 ${
                  i < indexes.length - 1
                    ? "border-b border-[var(--pocket-border)]"
                    : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-pocket-text">
                    {index.name}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-pocket-muted">
                    {index.fullName}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[14px] tabular-nums text-pocket-text">
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
      </div>
    </section>
  );
}
