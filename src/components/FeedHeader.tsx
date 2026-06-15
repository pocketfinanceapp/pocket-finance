"use client";

import type { FeedMode } from "@/lib/filterArticles";
import { useApp } from "@/context/AppContext";
import {
  getExplicitFilterLabels,
  hasExplicitFilters,
} from "@/lib/activeFilters";

interface FeedHeaderProps {
  feedMode: FeedMode;
  onFeedModeChange: (mode: FeedMode) => void;
  onOpenSearch: () => void;
  className?: string;
}

const FEED_TABS: { id: FeedMode; label: string }[] = [
  { id: "forYou", label: "For You" },
  { id: "following", label: "Following" },
  { id: "trending", label: "Trending" },
];

const TAB_SHADOW = "drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]";

export function FeedHeader({
  feedMode,
  onFeedModeChange,
  onOpenSearch,
  className = "",
}: FeedHeaderProps) {
  const { marketFilters, sectorFilters, searchQuery, clearFilters } = useApp();

  const filterLabels = getExplicitFilterLabels(
    marketFilters,
    sectorFilters,
    searchQuery
  );
  const showFilterPill = hasExplicitFilters(
    marketFilters,
    sectorFilters,
    searchQuery
  );

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <header className={`relative ${className}`}>
      {/* Gradient scrim only — no backdrop-blur for mobile Safari swipe performance */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.82) 38%, rgba(0,0,0,0.42) 68%, rgba(0,0,0,0.08) 88%, transparent 100%)",
        }}
      />

      <div
        className="relative grid grid-cols-[40px_1fr_40px] items-center gap-1 px-3 pb-1 sm:px-4"
        style={{ paddingTop: "max(0.625rem, env(safe-area-inset-top))" }}
      >
        {/* Opaque logo-slot mask — blocks feed card bleed-through in the old P mark area */}
        <div className="relative z-[1] h-10 w-10 shrink-0 bg-black" aria-hidden />
        <nav className="flex items-center justify-center gap-3 overflow-hidden sm:gap-4">
          {FEED_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              data-no-drag
              onPointerDown={stop}
              onClick={() => onFeedModeChange(tab.id)}
              className={`relative shrink-0 whitespace-nowrap pb-2 text-[11px] font-semibold tracking-wide sm:text-[12px] ${TAB_SHADOW} ${
                feedMode === tab.id ? "text-white" : "text-white/45"
              }`}
            >
              {tab.label}
              {feedMode === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6]" />
              )}
            </button>
          ))}
        </nav>
        <button
          type="button"
          data-no-drag
          onPointerDown={stop}
          onClick={onOpenSearch}
          className={`flex h-10 w-10 items-center justify-center justify-self-end rounded-full text-white/90 active:bg-white/10 ${TAB_SHADOW}`}
          aria-label="Search"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" strokeWidth="2" />
            <path strokeWidth="2" d="M20 20l-4-4" />
          </svg>
        </button>
      </div>
      {showFilterPill && (
        <div className="relative flex justify-center px-4 pb-2" data-no-drag>
          <button
            type="button"
            onPointerDown={stop}
            onClick={clearFilters}
            className={`max-w-full truncate rounded-full border border-white/12 bg-black/35 px-3 py-1 text-[11px] font-medium text-white/70 active:bg-white/10 ${TAB_SHADOW}`}
          >
            {filterLabels.join(" · ")}
            <span className="ml-1.5 text-white/40">×</span>
          </button>
        </div>
      )}
    </header>
  );
}
