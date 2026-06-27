"use client";

import { useLayoutEffect, useRef, useState } from "react";
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
  const navRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Partial<Record<FeedMode, HTMLButtonElement>>>({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

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

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const nav = navRef.current;
      const tab = tabRefs.current[feedMode];
      if (!nav || !tab) return;

      const navRect = nav.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();
      setIndicator({
        left: tabRect.left - navRect.left,
        width: tabRect.width,
      });
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [feedMode]);

  return (
    <header className={`relative isolate ${className}`}>
      <div
        className="relative grid grid-cols-[40px_1fr_40px] items-center gap-1 px-3 sm:px-4"
        style={{ paddingTop: "max(0.625rem, env(safe-area-inset-top))" }}
      >
        <div className="h-10 w-10 shrink-0" aria-hidden />
        <nav
          ref={navRef}
          className="relative flex items-center justify-center gap-1 overflow-hidden py-3 sm:gap-2"
        >
          {FEED_TABS.map((tab) => {
            const active = feedMode === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  if (el) tabRefs.current[tab.id] = el;
                }}
                type="button"
                data-no-drag
                onPointerDown={stop}
                onClick={() => onFeedModeChange(tab.id)}
                className={`relative shrink-0 whitespace-nowrap px-4 text-base transition-all duration-200 ${TAB_SHADOW} ${
                  active
                    ? "font-semibold text-white"
                    : "font-normal text-white/45"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-0 h-[3px] rounded-full bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] transition-all duration-200 ease-out"
            style={{
              left: indicator.left,
              width: indicator.width,
            }}
          />
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
