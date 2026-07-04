"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { FeedMode } from "@/lib/filterArticles";
import { useApp } from "@/context/AppContext";
import {
  getExplicitFilterLabels,
  hasExplicitFilters,
} from "@/lib/activeFilters";
import { FeedSearchIcon } from "@/components/icons/FeedSearchIcon";

interface FeedHeaderProps {
  feedMode: FeedMode;
  onFeedModeChange: (mode: FeedMode) => void;
  onOpenSearch: () => void;
  searchOpen?: boolean;
  className?: string;
}

const FEED_TABS: { id: FeedMode; label: string }[] = [
  { id: "forYou", label: "For You" },
  { id: "following", label: "Following" },
  { id: "trending", label: "Trending" },
];

const TAB_SHADOW =
  "drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)] [html[data-theme=dark]_&]:drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]";

export function FeedHeader({
  feedMode,
  onFeedModeChange,
  onOpenSearch,
  searchOpen = false,
  className = "",
}: FeedHeaderProps) {
  const { marketFilters, sectorFilters, searchQuery, clearFilters } = useApp();
  const navRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Partial<Record<FeedMode, HTMLButtonElement>>>({});
  const feedModeRef = useRef(feedMode);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const [indicatorReady, setIndicatorReady] = useState(false);

  feedModeRef.current = feedMode;

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

  const measureIndicator = useCallback((mode: FeedMode) => {
    const nav = navRef.current;
    const tab = tabRefs.current[mode];
    if (!nav || !tab) return;

    const navRect = nav.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    if (tabRect.width <= 0) return;

    setIndicator({
      left: tabRect.left - navRect.left,
      width: tabRect.width,
    });
    setIndicatorReady(true);
  }, []);

  useLayoutEffect(() => {
    measureIndicator(feedModeRef.current);
    // Mount-only — feedMode is the initial value; tab changes animate via useEffect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measureIndicator]);

  useEffect(() => {
    const syncIndicator = () => measureIndicator(feedMode);

    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(syncIndicator);
    });

    if (document.fonts?.ready) {
      void document.fonts.ready.then(syncIndicator);
    }

    return () => cancelAnimationFrame(raf);
  }, [feedMode, measureIndicator]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const ro = new ResizeObserver(() => measureIndicator(feedModeRef.current));
    ro.observe(nav);

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          measureIndicator(feedModeRef.current);
        }
      },
      { threshold: 0 }
    );
    io.observe(nav);

    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, [measureIndicator]);

  useEffect(() => {
    const onResize = () => measureIndicator(feedMode);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [feedMode, measureIndicator]);

  return (
    <header className={`relative z-50 pf-feed-chrome ${className}`}>
      <div
        className="feed-header-scrim pointer-events-none absolute inset-x-0 top-0"
        style={{
          height: "calc(max(0.625rem, env(safe-area-inset-top)) + 2.75rem)",
        }}
        aria-hidden
      />
      <div
        className="relative z-10 grid grid-cols-[40px_1fr_40px] items-center gap-1 px-3 sm:px-4"
        style={{ paddingTop: "max(0.625rem, env(safe-area-inset-top))" }}
      >
        <div className="h-10 w-10 shrink-0" aria-hidden />
        <nav
          ref={navRef}
          className="relative flex items-end justify-center gap-3 pb-0.5 pt-1"
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
                className={`relative shrink-0 whitespace-nowrap px-1.5 pb-1 text-[12px] leading-none transition-all duration-200 ${TAB_SHADOW} ${
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
            className={`pointer-events-none absolute bottom-0 h-[2px] rounded-full bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] transition-[left,width] duration-200 ease-out ${
              indicatorReady && indicator.width > 0 ? "opacity-100" : "opacity-0"
            }`}
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
          className={`relative flex h-10 w-10 items-center justify-center justify-self-end rounded-full active:scale-95 ${TAB_SHADOW}`}
          aria-label="Search"
        >
          <FeedSearchIcon active={searchOpen} />
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
