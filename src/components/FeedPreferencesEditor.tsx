"use client";

import { useApp } from "@/context/AppContext";
import {
  MARKET_FILTERS,
  ONBOARDING_MARKETS,
  SECTOR_FILTERS,
} from "@/lib/filters";

export function FeedPreferencesEditor() {
  const {
    followedMarkets,
    sectorInterests,
    toggleFollowMarket,
    toggleSectorInterest,
  } = useApp();

  const marketOptions = ONBOARDING_MARKETS.length
    ? ONBOARDING_MARKETS
    : MARKET_FILTERS;

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-[13px] font-medium text-pocket-muted">
          Markets you follow shape your For You feed.
        </p>
        <div className="flex flex-wrap gap-2">
          {marketOptions.map((market) => {
            const active = followedMarkets.includes(market);
            return (
              <button
                key={market}
                type="button"
                data-no-drag
                onClick={() => toggleFollowMarket(market)}
                className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                  active
                    ? "border-[#00C6C6]/40 bg-[#00C6C6]/12 text-[#00C6C6]"
                    : "border-[var(--pocket-border)] bg-[var(--pocket-card)] text-pocket-muted"
                }`}
              >
                {market}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-3 text-[13px] font-medium text-pocket-muted">
          Sector interests
        </p>
        <div className="flex flex-wrap gap-2">
          {SECTOR_FILTERS.map((sector) => {
            const active = sectorInterests.includes(sector);
            return (
              <button
                key={sector}
                type="button"
                data-no-drag
                onClick={() => toggleSectorInterest(sector)}
                className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                  active
                    ? "border-[#3B6EF5]/40 bg-[#3B6EF5]/12 text-[#3B6EF5]"
                    : "border-[var(--pocket-border)] bg-[var(--pocket-card)] text-pocket-muted"
                }`}
              >
                {sector}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
