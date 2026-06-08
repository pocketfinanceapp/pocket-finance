"use client";

import type { FeedMode } from "@/lib/filterArticles";
import { PocketMarkIcon } from "./PocketLogo";
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
    <header
      className={`shrink-0 border-b border-white/[0.06] bg-black/90 backdrop-blur-md ${className}`}
    >
      <div
        className="flex items-center justify-between px-4 pb-1.5"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div className="flex w-9 shrink-0 items-center justify-start" data-no-drag>
          <PocketMarkIcon size={36} glow="none" />
        </div>
        <nav className="flex gap-5 text-[12px] font-semibold tracking-wide">
          {FEED_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              data-no-drag
              onPointerDown={stop}
              onClick={() => onFeedModeChange(tab.id)}
              className={`relative shrink-0 pb-2 ${
                feedMode === tab.id ? "text-white" : "text-white/40"
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
          className="flex h-11 w-11 items-center justify-center rounded-full text-white/90 active:bg-white/10"
          aria-label="Search"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" strokeWidth="2" />
            <path strokeWidth="2" d="M20 20l-4-4" />
          </svg>
        </button>
      </div>
      {showFilterPill && (
        <div className="flex justify-center px-4 pb-2" data-no-drag>
          <button
            type="button"
            onPointerDown={stop}
            onClick={clearFilters}
            className="max-w-full truncate rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] font-medium text-zinc-400 backdrop-blur-sm active:bg-white/10"
          >
            {filterLabels.join(" · ")}
            <span className="ml-1.5 text-zinc-500">×</span>
          </button>
        </div>
      )}
    </header>
  );
}
