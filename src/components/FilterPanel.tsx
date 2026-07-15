"use client";

import { Search, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SECTOR_FILTERS, type SectorFilter } from "@/lib/filters";
import { GLOBAL_MARKETS } from "@/lib/markets";
import { BottomSheet } from "./BottomSheet";

interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
}

function Pill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-no-drag
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors active:scale-95 ${
        active
          ? "bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] text-white shadow-[0_4px_16px_rgba(59,110,245,0.25)]"
          : "border border-[var(--pocket-border)] bg-[var(--pocket-card)] text-pocket-text"
      }`}
    >
      {label}
    </button>
  );
}

export function FilterPanel({ open, onClose }: FilterPanelProps) {
  const {
    marketFilters,
    sectorFilters,
    toggleMarketFilter,
    toggleSectorFilter,
    searchQuery,
    setSearchQuery,
    clearFilters,
  } = useApp();

  return (
    <BottomSheet open={open} onClose={onClose} title="Filters" tall>
      <div className="space-y-6 px-5 pb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pocket-muted" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ticker, company, keyword..."
            data-no-drag
            className="w-full rounded-xl border border-[var(--pocket-border)] bg-[var(--pocket-surface-hover)] py-3 pl-10 pr-10 text-sm text-pocket-text placeholder:text-pocket-muted focus:border-pocket-teal/40 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              data-no-drag
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-pocket-muted"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-pocket-muted">
            Market
          </h3>
          <div className="flex flex-wrap gap-2">
            {GLOBAL_MARKETS.map((m) => (
              <Pill
                key={m.id}
                label={m.name}
                active={marketFilters.includes(m.id)}
                onClick={() => toggleMarketFilter(m.id)}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-pocket-muted">
            Sector
          </h3>
          <div className="flex flex-wrap gap-2">
            {SECTOR_FILTERS.map((s) => (
              <Pill
                key={s}
                label={s}
                active={sectorFilters.includes(s)}
                onClick={() => toggleSectorFilter(s as SectorFilter)}
              />
            ))}
          </div>
        </div>

        {(marketFilters.length > 0 ||
          sectorFilters.length > 0 ||
          searchQuery) && (
          <button
            type="button"
            data-no-drag
            onClick={clearFilters}
            className="w-full rounded-xl border border-[var(--pocket-border)] py-3 text-sm font-medium text-pocket-muted active:bg-[var(--pocket-surface-hover)]"
          >
            Clear all filters
          </button>
        )}
      </div>
    </BottomSheet>
  );
}
