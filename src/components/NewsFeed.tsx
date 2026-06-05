"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEMO_ARTICLES } from "@/lib/newsMapper";
import { useApp } from "@/context/AppContext";
import {
  buildFeedArticles,
  type FeedMode,
} from "@/lib/filterArticles";
import { BOTTOM_NAV_HEIGHT } from "@/lib/layout";
import { isInteractiveTarget } from "@/lib/gesture";
import { animateSpring, SPRING_SNAP } from "@/lib/spring";
import { resolveSnapIndex } from "@/lib/snap";
import type { MarketFilter } from "@/lib/filters";
import type { NewsArticle } from "@/lib/types";
import { BottomNav, type NavTab } from "./BottomNav";
import { CommentSheet } from "./CommentSheet";
import { CreateThoughtSheet } from "./CreateThoughtSheet";
import { FeedCard } from "./FeedCard";
import { FilterPanel } from "./FilterPanel";
import { ArticlePanel } from "./ArticlePanel";
import { StockPanel } from "./StockPanel";
/** Markets bottom-nav tab → overlay uses src/components/MarketsPage.tsx */
import { MarketsPage } from "./MarketsPage";
import { WatchlistPage } from "./WatchlistPage";
import { ProfilePage } from "./ProfilePage";

interface NewsFeedProps {
  initialArticles: NewsArticle[];
}

const PANEL_FEED = 1;
const AXIS_LOCK = 6;
const RUBBER = 0.1;

type Overlay = "markets" | "watchlist" | "profile" | null;

type LockedAxis = "x" | "y" | null;

export function NewsFeed({ initialArticles }: NewsFeedProps) {
  const [allArticles] = useState(
    initialArticles.length > 0 ? initialArticles : DEMO_ARTICLES
  );
  const {
    followedMarkets,
    marketFilters,
    sectorFilters,
    sectorInterests,
    searchQuery,
    setMarketFilters,
    incrementStoriesRead,
  } = useApp();

  const [feedMode, setFeedMode] = useState<FeedMode>("forYou");

  const filteredArticles = useMemo(
    () =>
      buildFeedArticles(
        allArticles,
        feedMode,
        followedMarkets,
        marketFilters,
        sectorFilters,
        sectorInterests,
        searchQuery
      ),
    [
      allArticles,
      feedMode,
      followedMarkets,
      marketFilters,
      sectorFilters,
      sectorInterests,
      searchQuery,
    ]
  );

  const [feedIndex, setFeedIndex] = useState(0);
  const [panelIndex, setPanelIndex] = useState(PANEL_FEED);
  const [navTab, setNavTab] = useState<NavTab>("home");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const feedColumnRef = useRef<HTMLDivElement>(null);

  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hTranslate, setHTranslate] = useState(0);
  const [vTranslate, setVTranslate] = useState(0);

  const dragging = useRef(false);
  const axis = useRef<LockedAxis>(null);
  const startedInFeed = useRef(false);
  const activePointer = useRef<number | null>(null);
  const start = useRef({ x: 0, y: 0, t: 0 });
  const last = useRef({ x: 0, y: 0, t: 0 });
  const panelIndexRef = useRef(panelIndex);
  const feedIndexRef = useRef(feedIndex);
  const hTranslateRef = useRef(0);
  const vTranslateRef = useRef(0);
  const cancelHSpring = useRef<(() => void) | null>(null);
  const cancelVSpring = useRef<(() => void) | null>(null);
  const prevFeedIndex = useRef(-1);

  panelIndexRef.current = panelIndex;
  feedIndexRef.current = feedIndex;
  hTranslateRef.current = hTranslate;
  vTranslateRef.current = vTranslate;

  const article = filteredArticles[feedIndex] ?? filteredArticles[0];
  const gesturesEnabled = overlay === null && !filterOpen && !commentsOpen && !createOpen;

  useEffect(() => {
    const viewport = viewportRef.current;
    const feedCol = feedColumnRef.current;
    if (!viewport) return;

    const measure = () => {
      const w = viewport.offsetWidth;
      const h =
        feedCol?.clientHeight ||
        viewport.clientHeight ||
        window.innerHeight;
      if (w > 0 && h > 0) setSize({ w, h });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(viewport);
    if (feedCol) ro.observe(feedCol);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    setFeedIndex(0);
    setVTranslate(0);
    vTranslateRef.current = 0;
  }, [marketFilters, sectorFilters, searchQuery, feedMode]);

  useEffect(() => {
    const max = Math.max(0, filteredArticles.length - 1);
    if (feedIndex > max) {
      setFeedIndex(max);
      if (size.h) {
        const y = -max * size.h;
        setVTranslate(y);
        vTranslateRef.current = y;
      }
    }
  }, [filteredArticles.length, feedIndex, size.h]);

  useEffect(() => {
    if (!size.w || dragging.current) return;
    const x = -panelIndex * size.w;
    setHTranslate(x);
    hTranslateRef.current = x;
  }, [panelIndex, size.w]);

  useEffect(() => {
    if (!size.h || dragging.current) return;
    const y = -feedIndex * size.h;
    setVTranslate(y);
    vTranslateRef.current = y;
  }, [feedIndex, size.h]);

  useEffect(() => {
    if (
      prevFeedIndex.current >= 0 &&
      feedIndex !== prevFeedIndex.current &&
      filteredArticles.length > 0
    ) {
      incrementStoriesRead();
    }
    prevFeedIndex.current = feedIndex;
  }, [feedIndex, filteredArticles.length, incrementStoriesRead]);

  const rubberBand = useCallback(
    (offset: number, min: number, max: number) => {
      if (offset > max) return max + (offset - max) * RUBBER;
      if (offset < min) return min + (offset - min) * RUBBER;
      return offset;
    },
    []
  );

  const springHTo = useCallback((target: number, onDone?: () => void) => {
    cancelHSpring.current?.();
    cancelHSpring.current = animateSpring(
      hTranslateRef.current,
      target,
      (v) => {
        hTranslateRef.current = v;
        setHTranslate(v);
      },
      () => {
        cancelHSpring.current = null;
        onDone?.();
      },
      SPRING_SNAP
    );
  }, []);

  const springVTo = useCallback((target: number, onDone?: () => void) => {
    cancelVSpring.current?.();
    cancelVSpring.current = animateSpring(
      vTranslateRef.current,
      target,
      (v) => {
        vTranslateRef.current = v;
        setVTranslate(v);
      },
      () => {
        cancelVSpring.current = null;
        onDone?.();
      },
      { ...SPRING_SNAP, stiffness: 960, damping: 34 }
    );
  }, []);

  const goToPanel = useCallback(
    (index: number) => {
      if (!size.w) return;
      const target = -index * size.w;
      springHTo(target, () => setPanelIndex(index));
    },
    [size.w, springHTo]
  );

  const goToFeed = useCallback(() => {
    setOverlay(null);
    setNavTab("home");
    goToPanel(PANEL_FEED);
  }, [goToPanel]);

  const openMarketFeed = useCallback(
    (market: MarketFilter) => {
      setMarketFilters([market]);
      setFeedMode("forYou");
      setOverlay(null);
      setNavTab("home");
      goToPanel(PANEL_FEED);
      setFeedIndex(0);
      setVTranslate(0);
      vTranslateRef.current = 0;
    },
    [goToPanel, setMarketFilters]
  );

  const handleNav = useCallback(
    (tab: NavTab) => {
      setNavTab(tab);
      setOverlay(null);
      switch (tab) {
        case "home":
          goToPanel(PANEL_FEED);
          break;
        case "markets":
          setOverlay("markets");
          goToPanel(PANEL_FEED);
          break;
        case "watchlist":
          setOverlay("watchlist");
          goToPanel(PANEL_FEED);
          break;
        case "profile":
          setOverlay("profile");
          goToPanel(PANEL_FEED);
          break;
        case "create":
          goToPanel(PANEL_FEED);
          setCreateOpen(true);
          break;
      }
    },
    [goToPanel]
  );

  const releaseCapture = useCallback(() => {
    const el = trackRef.current;
    const id = activePointer.current;
    if (el && id !== null) {
      try {
        el.releasePointerCapture(id);
      } catch {
        /* released */
      }
    }
    activePointer.current = null;
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!gesturesEnabled || e.button !== 0 || isInteractiveTarget(e.target))
        return;

      cancelHSpring.current?.();
      cancelVSpring.current?.();

      dragging.current = true;
      axis.current = null;
      activePointer.current = e.pointerId;
      startedInFeed.current =
        feedColumnRef.current?.contains(e.target as Node) ?? false;

      const sample = { x: e.clientX, y: e.clientY, t: Date.now() };
      start.current = sample;
      last.current = sample;
    },
    [gesturesEnabled]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current || activePointer.current !== e.pointerId) return;

      const dx = e.clientX - start.current.x;
      const dy = e.clientY - start.current.y;

      if (!axis.current) {
        if (Math.hypot(dx, dy) < AXIS_LOCK) return;

        const inFeed =
          startedInFeed.current && panelIndexRef.current === PANEL_FEED;

        if (inFeed && Math.abs(dy) >= Math.abs(dx)) {
          axis.current = "y";
          trackRef.current?.setPointerCapture(e.pointerId);
        } else if (Math.abs(dx) > Math.abs(dy)) {
          axis.current = "x";
          trackRef.current?.setPointerCapture(e.pointerId);
        } else if (inFeed) {
          axis.current = "y";
          trackRef.current?.setPointerCapture(e.pointerId);
        } else {
          dragging.current = false;
          releaseCapture();
          return;
        }
      }

      last.current = { x: e.clientX, y: e.clientY, t: Date.now() };

      if (axis.current === "x" && size.w) {
        e.preventDefault();
        const next = -panelIndexRef.current * size.w + dx;
        hTranslateRef.current = next;
        setHTranslate(next);
      } else if (axis.current === "y" && size.h) {
        e.preventDefault();
        const next = -feedIndexRef.current * size.h + dy;
        vTranslateRef.current = next;
        setVTranslate(next);
      }
    },
    [releaseCapture, size.h, size.w]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (activePointer.current !== e.pointerId) return;

      dragging.current = false;
      releaseCapture();

      const locked = axis.current;
      axis.current = null;
      if (!locked) return;

      const dt = Math.max(1, last.current.t - start.current.t);

      if (locked === "x" && size.w) {
        const velocity = (last.current.x - start.current.x) / dt;
        const offset = rubberBand(hTranslateRef.current, -2 * size.w, 0);
        const next = resolveSnapIndex(offset, size.w, velocity, 2);
        springHTo(-next * size.w, () => setPanelIndex(next));
      } else if (locked === "y" && size.h) {
        const velocity = (last.current.y - start.current.y) / dt;
        const maxIdx = Math.max(0, filteredArticles.length - 1);
        const offset = rubberBand(
          vTranslateRef.current,
          -maxIdx * size.h,
          0
        );
        const next = resolveSnapIndex(offset, size.h, velocity, maxIdx);
        springVTo(-next * size.h, () => setFeedIndex(next));
      }
    },
    [filteredArticles.length, releaseCapture, rubberBand, size.h, size.w, springHTo, springVTo]
  );

  return (
    <div
      ref={viewportRef}
      className="relative mx-auto h-[100dvh] w-full max-w-mobile overflow-hidden bg-[#0a0a0a]"
    >
      <div
        ref={trackRef}
        className={`gpu-layer flex h-full touch-none ${!gesturesEnabled ? "pointer-events-none" : ""}`}
        style={{
          width: size.w ? size.w * 3 : "300%",
          transform: `translate3d(${hTranslate}px, 0, 0)`,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="h-full shrink-0 overflow-y-auto overscroll-contain"
          style={{ width: size.w || "33.333%", touchAction: "pan-y" }}
        >
          {article && <StockPanel article={article} onBack={goToFeed} />}
        </div>

        <div
          ref={feedColumnRef}
          className="relative h-full shrink-0 touch-none overflow-hidden"
          style={{ width: size.w || "33.333%", touchAction: "none" }}
        >
          {filteredArticles.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center">
              <p className="text-lg font-semibold text-white">
                {feedMode === "following"
                  ? "No markets followed yet"
                  : "No stories match"}
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                {feedMode === "following"
                  ? "Follow markets in the Markets tab to build your feed."
                  : "Adjust filters or search to see more news."}
              </p>
              <button
                type="button"
                data-no-drag
                onClick={() =>
                  feedMode === "following"
                    ? handleNav("markets")
                    : setFilterOpen(true)
                }
                className="mt-6 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black"
              >
                {feedMode === "following" ? "Explore markets" : "Open filters"}
              </button>
            </div>
          ) : (
            <div
              className="gpu-layer w-full touch-none"
              style={{
                height:
                  size.h > 0
                    ? size.h * filteredArticles.length
                    : `${filteredArticles.length * 100}dvh`,
                transform: `translate3d(0, ${vTranslate}px, 0)`,
              }}
            >
              {filteredArticles.map((a, i) => (
                <div
                  key={a.id}
                  className="h-[100dvh] w-full shrink-0"
                  style={size.h > 0 ? { height: size.h } : undefined}
                >
                  <FeedCard
                    article={a}
                    active={i === feedIndex}
                    feedMode={feedMode}
                    onFeedModeChange={setFeedMode}
                    onOpenComments={() => setCommentsOpen(true)}
                    onOpenFilter={() => setFilterOpen(true)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          className="h-full shrink-0 overflow-y-auto overscroll-contain"
          style={{ width: size.w || "33.333%", touchAction: "pan-y" }}
        >
          {article && <ArticlePanel article={article} onBack={goToFeed} />}
        </div>
      </div>

      {overlay === "markets" && (
        <div
          className="absolute inset-x-0 top-0 z-40 flex flex-col bg-black"
          style={{ bottom: BOTTOM_NAV_HEIGHT }}
        >
          <MarketsPage onOpenMarketFeed={openMarketFeed} />
        </div>
      )}
      {overlay === "watchlist" && (
        <div
          className="absolute inset-x-0 top-0 z-40 flex flex-col bg-[#0a0a0a]"
          style={{ bottom: BOTTOM_NAV_HEIGHT }}
        >
          <WatchlistPage onClose={() => setOverlay(null)} />
        </div>
      )}
      {overlay === "profile" && (
        <div
          className="absolute inset-x-0 top-0 z-40 flex flex-col bg-[#0a0a0a]"
          style={{ bottom: BOTTOM_NAV_HEIGHT }}
        >
          <ProfilePage onClose={() => setOverlay(null)} />
        </div>
      )}

      <CommentSheet
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        article={article ?? null}
      />
      <FilterPanel open={filterOpen} onClose={() => setFilterOpen(false)} />
      <CreateThoughtSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultTicker={article?.ticker}
      />

      <BottomNav active={navTab} onNavigate={handleNav} />
    </div>
  );
}
