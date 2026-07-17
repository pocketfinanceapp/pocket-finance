"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { MarketFlag } from "@/components/MarketFlag";
import { useApp } from "@/context/AppContext";
import { filterAppRegions, type AppRegionId } from "@/lib/regionPreferences";

export function RegionCurrencyEditor() {
  const { preferredRegion, setPreferredRegion } = useApp();
  const [query, setQuery] = useState("");

  const handleRegion = (region: AppRegionId) => {
    setPreferredRegion(region);
  };

  const regions = useMemo(() => filterAppRegions(query), [query]);

  return (
    <div className="space-y-7">
      <section>
        <h3 className="text-[13px] font-semibold text-pocket-text">Country</h3>
        <p className="mt-1 text-[12px] leading-relaxed text-pocket-muted">
          Softly prioritises local news and markets. Global headlines stay
          available.
        </p>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search countries"
          data-no-drag
          className="mt-3 w-full rounded-xl border border-[var(--pocket-border)] bg-[var(--pocket-bg)] px-3 py-2.5 text-[14px] text-pocket-text outline-none placeholder:text-pocket-muted focus:border-[#00C6C6]/60"
        />
        <div className="mt-2 max-h-[42vh] space-y-1 overflow-y-auto pr-1">
          {regions.map((item) => {
            const active = preferredRegion === item.id;
            return (
              <button
                key={item.id}
                type="button"
                data-no-drag
                onClick={() => handleRegion(item.id)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors active:bg-white/[0.04]"
                style={{
                  background: active ? "rgba(0,198,198,0.08)" : undefined,
                  border: active
                    ? "1px solid rgba(0,198,198,0.45)"
                    : "1px solid transparent",
                }}
              >
                <MarketFlag
                  countryCode={item.countryCode}
                  size={24}
                  rounded="md"
                />
                <span className="min-w-0 flex-1 text-[14px] font-medium text-pocket-text">
                  {item.label}
                </span>
                {active && (
                  <Check
                    className="h-4 w-4 shrink-0 text-[#00C6C6]"
                    strokeWidth={2.75}
                  />
                )}
              </button>
            );
          })}
          {regions.length === 0 && (
            <p className="px-1 py-6 text-center text-[13px] text-pocket-muted">
              No countries match &ldquo;{query.trim()}&rdquo;
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
