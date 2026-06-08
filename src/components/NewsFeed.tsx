"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_ARTICLES } from "@/lib/newsMapper";
import { useApp } from "@/context/AppContext";
import { useNavigationOptional } from "@/context/NavigationContext";
import {
  buildFeedArticles,
  type FeedMode,
} from "@/lib/filterArticles";
import { isInteractiveTarget } from "@/lib/gesture";
import { FEED_VIEWPORT_HEIGHT } from "@/lib/layout";
import {
  addRecentlyRead,
  loadFavouriteTopics,
  type ProfileTopic,
} from "@/lib/profileStorage";
import type { NewsArticle } from "@/lib/types";
import { CommentSheet } from "./CommentSheet";
import { FeedCard } from "./FeedCard";
import { FilterPanel } from "./FilterPanel";
import { FeedSearchOverlay } from "./FeedSearchOverlay";
import { ArticlePanel } from "./ArticlePanel";
import { StockPanel } from "./StockPanel";
import { MobilePageShell } from "./MobilePageShell";
import { AddToHomeScreenBanner } from "./AddToHomeScreenBanner";
import { FeedHeader } from "./FeedHeader";
import { TrendingFeed } from "./TrendingFeed";

interface NewsFeedProps {
  initialArticles: NewsArticle[];
  /** When true, shell + bottom nav are provided by TabAppShell */
  embedded?: boolean;
  showAddToHomeBanner?: boolean;
}

const PANEL_FEED = 1;
const PANEL_ARTICLE = 2;
const AXIS_LOCK = 6;
const SWIPE_THRESHOLD_PX = 55;
const SWIPE_VELOCITY = 0.35;
const PULL_REFRESH_PX = 72;

type LockedAxis = "x" | "y" | null;

export function NewsFeed({
  initialArticles,
  embedded = false,
  showAddToHomeBanner = true,
}: NewsFeedProps) {
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
  const [articleOverride, setArticleOverride] = useState<NewsArticle | null>(
    null
  );
  const [favouriteTopics, setFavouriteTopics] = useState<ProfileTopic[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const refreshTopics = () => setFavouriteTopics(loadFavouriteTopics());
    refreshTopics();
    window.addEventListener("focus", refreshTopics);
    return () => window.removeEventListener("focus", refreshTopics);
  }, []);

  useEffect(() => {
    if (feedMode === "following") {
      setFavouriteTopics(loadFavouriteTopics());
    }
  }, [feedMode]);

  const filteredArticles = useMemo(
    () =>
      buildFeedArticles(
        allArticles,
        feedMode,
        followedMarkets,
        marketFilters,
        sectorFilters,
        sectorInterests,
        searchQuery,
        favouriteTopics
      ),
    [
      allArticles,
      feedMode,
      followedMarkets,
      marketFilters,
      sectorFilters,
      sectorInterests,
      searchQuery,
      favouriteTopics,
    ]
  );

  const [panelIndex, setPanelIndex] = useState(PANEL_FEED);
  const router = useRouter();
  const navigation = useNavigationOptional();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentRefreshKey, setCommentRefreshKey] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
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
  const feedModeRef = useRef(feedMode);
  const prevFeedIndex = useRef(feedIndex);
  const prevPanelIndex = useRef(panelIndex);

  panelIndexRef.current = panelIndex;
  feedIndexRef.current = feedIndex;
  feedModeRef.current = feedMode;

  const swipeArticle = filteredArticles[feedIndex] ?? filteredArticles[0];
  const article = articleOverride ?? swipeArticle;
  const gesturesEnabled = !filterOpen && !commentsOpen && !searchOpen;

  const trendingArticles = useMemo(
    () =>
      [...allArticles]
        .sort(
          (a, b) =>
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
        )
        .slice(0, 10),
    [allArticles]
  );

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

  useEffect(() => {
    if (
      panelIndex === PANEL_ARTICLE &&
      prevPanelIndex.current !== PANEL_ARTICLE &&
      article
    ) {
      addRecentlyRead(article);
    }
    prevPanelIndex.current = panelIndex;
  }, [panelIndex, article]);

  const goToPanel = useCallback((index: number) => {
    setPanelIndex(index);
    setDragX(0);
  }, []);

  const goToFeed = useCallback(() => {
    goToPanel(PANEL_FEED);
    setArticleOverride(null);
  }, [goToPanel]);

  const openArticle = useCallback(
    (selected: NewsArticle) => {
      setArticleOverride(selected);
      goToPanel(PANEL_ARTICLE);
    },
    [goToPanel]
  );

  const openProfile = useCallback(() => {
    navigation?.navigate("profile") ??
      router.replace("/profile", { scroll: false });
  }, [navigation, router]);

  const handleSearchSelect = useCallback(
    (selected: NewsArticle) => {
      setSearchOpen(false);
      const forYouList = buildFeedArticles(
        allArticles,
        "forYou",
        followedMarkets,
        [],
        [],
        sectorInterests,
        "",
        favouriteTopics
      );
      const idx = forYouList.findIndex((a) => a.id === selected.id);
      if (idx >= 0) {
        setFeedMode("forYou");
        setFeedIndex(idx);
        setArticleOverride(null);
        goToPanel(PANEL_FEED);
      }
    },
    [
      allArticles,
      followedMarkets,
      sectorInterests,
      favouriteTopics,
      setFeedIndex,
      goToPanel,
    ]
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
          startedInFeed.current &&
          panelIndexRef.current === PANEL_FEED &&
          feedModeRef.current !== "trending";

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

  const trackTransition = isDragging
    ? ""
    : "transition-transform duration-300 ease-out";

  const hTransform = `translateX(calc(-${panelIndex} * 33.333% + ${dragX}px))`;
  const vTransform = `translateY(calc(-${feedIndex} * ${FEED_VIEWPORT_HEIGHT} + ${dragY}px))`;

  const feedContent = (
    <div
      className="relative overflow-hidden bg-[#0a0a0a]"
      style={{ height: FEED_VIEWPORT_HEIGHT }}
    >
        <div
          ref={trackRef}
          className={`flex touch-none ${trackTransition} ${!gesturesEnabled ? "pointer-events-none" : ""}`}
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
            className="relative shrink-0 overflow-hidden"
            style={{
              width: "33.333%",
              height: FEED_VIEWPORT_HEIGHT,
              touchAction: feedMode === "trending" ? "pan-y" : "none",
            }}
          >
            <FeedHeader
              feedMode={feedMode}
              onFeedModeChange={setFeedMode}
              onOpenSearch={() => setSearchOpen(true)}
              className="absolute left-0 right-0 top-0 z-30"
            />

            {feedMode === "trending" ? (
              <TrendingFeed
                articles={trendingArticles}
                onOpenArticle={openArticle}
              />
            ) : filteredArticles.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                {feedMode === "following" && favouriteTopics.length === 0 ? (
                  <>
                    <p className="text-lg font-semibold text-white">
                      Personalise your feed — select topics in your Profile
                    </p>
                    <button
                      type="button"
                      data-no-drag
                      onClick={openProfile}
                      className="mt-6 rounded-full bg-[#00C6C6] px-6 py-2.5 text-sm font-bold text-black"
                    >
                      Go to Profile
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-semibold text-white">
                      {feedMode === "following"
                        ? "No stories match your topics"
                        : "No stories match"}
                    </p>
                    <p className="mt-2 text-sm text-zinc-500">
                      {feedMode === "following"
                        ? "Try adding more topics in your Profile."
                        : "Adjust filters or search to see more news."}
                    </p>
                    <button
                      type="button"
                      data-no-drag
                      onClick={() =>
                        feedMode === "following"
                          ? openProfile()
                          : setFilterOpen(true)
                      }
                      className="mt-6 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black"
                    >
                      {feedMode === "following" ? "Go to Profile" : "Open filters"}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div
                className={`w-full touch-none ${trackTransition}`}
                style={{
                  height: `calc(${filteredArticles.length} * ${FEED_VIEWPORT_HEIGHT})`,
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
                      onOpenComments={() => setCommentsOpen(true)}
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

        <CommentSheet
          open={commentsOpen}
          onClose={() => setCommentsOpen(false)}
          article={article ?? null}
          onCommentPosted={() => setCommentRefreshKey((k) => k + 1)}
        />
        <FilterPanel open={filterOpen} onClose={() => setFilterOpen(false)} />
        <FeedSearchOverlay
          open={searchOpen}
          articles={allArticles}
          onClose={() => setSearchOpen(false)}
          onSelectArticle={handleSearchSelect}
        />
        {showAddToHomeBanner && <AddToHomeScreenBanner />}
    </div>
  );

  if (embedded) {
    return feedContent;
  }

  return (
    <MobilePageShell activeTab="home">{feedContent}</MobilePageShell>
  );
}
