"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DEMO_ARTICLES } from "@/lib/newsMapper";
import { useApp } from "@/context/AppContext";
import {
  buildFeedArticles,
  type FeedMode,
} from "@/lib/filterArticles";
import { isInteractiveTarget } from "@/lib/gesture";
import { BOTTOM_NAV_PX, FEED_VIEWPORT_HEIGHT } from "@/lib/layout";

const FEED_SLOT_HEIGHT = `(100svh - ${BOTTOM_NAV_PX}px)`;
import type { NewsArticle } from "@/lib/types";
import type { NavTab } from "./BottomNav";
import { CommentSheet } from "./CommentSheet";
import { CreateThoughtSheet } from "./CreateThoughtSheet";
import { FeedCard } from "./FeedCard";
import { FilterPanel } from "./FilterPanel";
import { ArticlePanel } from "./ArticlePanel";
import { StockPanel } from "./StockPanel";
import { MobilePageShell } from "./MobilePageShell";
import { ProfilePage } from "./ProfilePage";

interface NewsFeedProps {
  initialArticles: NewsArticle[];
}

const PANEL_FEED = 1;
const AXIS_LOCK = 6;
const SWIPE_THRESHOLD_PX = 55;
const SWIPE_VELOCITY = 0.35;
const PULL_REFRESH_PX = 72;

type Overlay = "profile" | null;
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
    feedIndex,
    setFeedIndex,
    resetFeedIndex,
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

  const [panelIndex, setPanelIndex] = useState(PANEL_FEED);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentRefreshKey, setCommentRefreshKey] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const axis = useRef<LockedAxis>(null);
  const startedInFeed = useRef(false);
  const activePointer = useRef<number | null>(null);
  const start = useRef({ x: 0, y: 0, t: 0 });
  const last = useRef({ x: 0, y: 0, t: 0 });
  const panelIndexRef = useRef(panelIndex);
  const feedIndexRef = useRef(feedIndex);
  const prevFeedIndex = useRef(feedIndex);

  panelIndexRef.current = panelIndex;
  feedIndexRef.current = feedIndex;

  const article = filteredArticles[feedIndex] ?? filteredArticles[0];
  const gesturesEnabled = overlay === null && !filterOpen && !commentsOpen && !createOpen;

  useEffect(() => {
    setOverlay(searchParams.get("tab") === "profile" ? "profile" : null);
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("sheet") === "create") {
      setCreateOpen(true);
      router.replace("/", { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    const max = Math.max(0, filteredArticles.length - 1);
    if (feedIndex > max) setFeedIndex(max);
  }, [filteredArticles.length, feedIndex, setFeedIndex]);

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

  const goToPanel = useCallback((index: number) => {
    setPanelIndex(index);
    setDragX(0);
  }, []);

  const goToFeed = useCallback(() => {
    goToPanel(PANEL_FEED);
  }, [goToPanel]);

  const closeProfile = useCallback(() => {
    router.replace("/", { scroll: false });
  }, [router]);

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

      dragging.current = true;
      setIsDragging(true);
      axis.current = null;
      activePointer.current = e.pointerId;
      startedInFeed.current =
        (e.target as HTMLElement).closest("[data-feed-column]") !== null;

      const sample = { x: e.clientX, y: e.clientY, t: Date.now() };
      start.current = sample;
      last.current = sample;
      setDragX(0);
      setDragY(0);
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
          setIsDragging(false);
          releaseCapture();
          return;
        }
      }

      last.current = { x: e.clientX, y: e.clientY, t: Date.now() };

      if (axis.current === "x") {
        e.preventDefault();
        setDragX(dx);
      } else if (axis.current === "y") {
        e.preventDefault();
        setDragY(dy);
      }
    },
    [releaseCapture]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (activePointer.current !== e.pointerId) return;

      dragging.current = false;
      setIsDragging(false);
      releaseCapture();

      const locked = axis.current;
      axis.current = null;
      if (!locked) return;

      const dt = Math.max(1, last.current.t - start.current.t);
      const dx = last.current.x - start.current.x;
      const dy = last.current.y - start.current.y;

      if (locked === "x") {
        const velocity = dx / dt;
        let next = panelIndexRef.current;
        if (velocity < -SWIPE_VELOCITY || dx < -SWIPE_THRESHOLD_PX) {
          next = Math.min(2, next + 1);
        } else if (velocity > SWIPE_VELOCITY || dx > SWIPE_THRESHOLD_PX) {
          next = Math.max(0, next - 1);
        }
        setPanelIndex(next);
        setDragX(0);
      } else if (locked === "y") {
        const velocity = dy / dt;
        const maxIdx = Math.max(0, filteredArticles.length - 1);
        let next = feedIndexRef.current;

        if (
          next === 0 &&
          panelIndexRef.current === PANEL_FEED &&
          (dy > PULL_REFRESH_PX || velocity > SWIPE_VELOCITY * 1.5)
        ) {
          resetFeedIndex();
        } else if (velocity < -SWIPE_VELOCITY || dy < -SWIPE_THRESHOLD_PX) {
          next = Math.min(maxIdx, next + 1);
          setFeedIndex(next);
        } else if (velocity > SWIPE_VELOCITY || dy > SWIPE_THRESHOLD_PX) {
          next = Math.max(0, next - 1);
          setFeedIndex(next);
        }
        setDragY(0);
      }
    },
    [filteredArticles.length, releaseCapture, resetFeedIndex, setFeedIndex]
  );

  const navTab: NavTab = overlay === "profile" ? "profile" : "home";

  const trackTransition = isDragging
    ? ""
    : "transition-transform duration-300 ease-out";

  const hTransform = `translate3d(calc(-${panelIndex} * 33.333% + ${dragX}px), 0, 0)`;
  const vTransform = `translate3d(0, calc(-${feedIndex} * ${FEED_SLOT_HEIGHT} + ${dragY}px), 0)`;

  return (
    <MobilePageShell
      activeTab={navTab}
      onCreate={() => {
        goToPanel(PANEL_FEED);
        setCreateOpen(true);
      }}
    >
      <div
        className={`relative overflow-hidden ${overlay ? "bg-black" : "bg-[#0a0a0a]"}`}
        style={{ height: FEED_VIEWPORT_HEIGHT }}
      >
        <div
          ref={trackRef}
          className={`gpu-layer flex touch-none ${trackTransition} ${!gesturesEnabled ? "pointer-events-none" : ""} ${overlay ? "hidden" : ""}`}
          style={{
            height: FEED_VIEWPORT_HEIGHT,
            width: "300%",
            transform: hTransform,
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div
            className="h-full shrink-0 overflow-y-auto overscroll-contain"
            style={{ width: "33.333%", touchAction: "pan-y" }}
          >
            {article && <StockPanel article={article} onBack={goToFeed} />}
          </div>

          <div
            data-feed-column
            className={`relative shrink-0 touch-none overflow-hidden ${trackTransition}`}
            style={{
              width: "33.333%",
              height: FEED_VIEWPORT_HEIGHT,
              touchAction: "none",
            }}
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
                      ? router.push("/markets")
                      : setFilterOpen(true)
                  }
                  className="mt-6 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black"
                >
                  {feedMode === "following" ? "Explore markets" : "Open filters"}
                </button>
              </div>
            ) : (
              <div
                className={`gpu-layer w-full touch-none ${trackTransition}`}
                style={{
                  height: `calc(${filteredArticles.length} * ${FEED_SLOT_HEIGHT})`,
                  transform: vTransform,
                }}
              >
                {filteredArticles.map((a, i) => (
                  <div
                    key={a.id}
                    className="w-full shrink-0"
                    style={{ height: FEED_VIEWPORT_HEIGHT }}
                  >
                    <FeedCard
                      article={a}
                      active={i === feedIndex}
                      feedMode={feedMode}
                      onFeedModeChange={setFeedMode}
                      onOpenComments={() => setCommentsOpen(true)}
                      onOpenFilter={() => setFilterOpen(true)}
                      commentRefreshKey={commentRefreshKey}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            className="h-full shrink-0 overflow-y-auto overscroll-contain"
            style={{ width: "33.333%", touchAction: "pan-y" }}
          >
            {article && <ArticlePanel article={article} onBack={goToFeed} />}
          </div>
        </div>

        {overlay === "profile" && (
          <div className="absolute inset-0 z-40 bg-black">
            <ProfilePage onClose={closeProfile} />
          </div>
        )}

        <CommentSheet
          open={commentsOpen}
          onClose={() => setCommentsOpen(false)}
          article={article ?? null}
          onCommentPosted={() => setCommentRefreshKey((k) => k + 1)}
        />
        <FilterPanel open={filterOpen} onClose={() => setFilterOpen(false)} />
        <CreateThoughtSheet
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          defaultTicker={article?.ticker}
        />
      </div>
    </MobilePageShell>
  );
}
