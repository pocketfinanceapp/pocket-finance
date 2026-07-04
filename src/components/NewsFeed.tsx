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
import { appPath } from "@/lib/appPaths";
import { isInteractiveTarget } from "@/lib/gesture";
import { APP_VIEWPORT_HEIGHT, FEED_VIEWPORT_HEIGHT } from "@/lib/layout";
import {
  addRecentlyRead,
  loadFavouriteTopics,
  PF_TOPICS_CHANGED_EVENT,
  PF_TOPICS_STORAGE_KEY,
  type ProfileTopic,
} from "@/lib/profileStorage";
import { recordActivityEvent } from "@/lib/progression";
import { tabEnterStyle, useTabPageEntered } from "@/lib/tabEnterAnimation";
import {
  getForYouTopArticleIds,
  rankTrendingArticles,
} from "@/lib/trendingArticles";
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
import { FeedOnboardingOverlay } from "./onboarding/FeedOnboardingOverlay";

interface NewsFeedProps {
  initialArticles: NewsArticle[];
  initialTrendingArticles?: NewsArticle[];
  /** When true, shell + bottom nav are provided by TabAppShell */
  embedded?: boolean;
  showAddToHomeBanner?: boolean;
  /** Called when stock or article side panel opens or closes (embedded shell hides bottom nav) */
  onSidePanelChange?: (open: boolean) => void;
}

const PANEL_STOCK = 0;
const PANEL_FEED = 1;
const PANEL_ARTICLE = 2;
const AXIS_LOCK = 6;
const SWIPE_THRESHOLD_PX = 55;
const SWIPE_VELOCITY = 0.35;
const PULL_REFRESH_PX = 72;

type LockedAxis = "x" | "y" | null;

export function NewsFeed({
  initialArticles,
  initialTrendingArticles = [],
  embedded = false,
  showAddToHomeBanner = true,
  onSidePanelChange,
}: NewsFeedProps) {
  const [allArticles] = useState(
    initialArticles.length > 0 ? initialArticles : DEMO_ARTICLES
  );
  const [trendingPool] = useState(() =>
    initialTrendingArticles.length > 0
      ? initialTrendingArticles
      : initialArticles.length > 0
        ? initialArticles
        : DEMO_ARTICLES
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
    feedJumpArticleId,
    clearFeedJump,
  } = useApp();
  const navigation = useNavigationOptional();
  const homeEntered = useTabPageEntered("home");
  const [feedMode, setFeedMode] = useState<FeedMode>("forYou");
  const [displayedFeedMode, setDisplayedFeedMode] = useState<FeedMode>("forYou");
  const [tabContentVisible, setTabContentVisible] = useState(true);
  const [articleOverride, setArticleOverride] = useState<NewsArticle | null>(
    null
  );
  const [favouriteTopics, setFavouriteTopics] = useState<ProfileTopic[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const wasFollowingRef = useRef(false);
  const prevNavTabRef = useRef(navigation?.navTab);

  const refreshTopics = useCallback(() => {
    const topics = loadFavouriteTopics();
    console.log("[pf-topics] NewsFeed Following filter topics:", topics);
    setFavouriteTopics(topics);
  }, []);

  useEffect(() => {
    refreshTopics();

    const onStorage = (e: StorageEvent) => {
      if (e.key !== PF_TOPICS_STORAGE_KEY) return;
      console.log("[pf-topics] NewsFeed storage event:", e.newValue);
      refreshTopics();
    };

    const onTopicsChanged = () => refreshTopics();

    window.addEventListener("focus", refreshTopics);
    window.addEventListener("storage", onStorage);
    window.addEventListener(PF_TOPICS_CHANGED_EVENT, onTopicsChanged);

    return () => {
      window.removeEventListener("focus", refreshTopics);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(PF_TOPICS_CHANGED_EVENT, onTopicsChanged);
    };
  }, [refreshTopics]);

  useEffect(() => {
    const isFollowing = feedMode === "following";
    if (isFollowing && !wasFollowingRef.current) {
      console.log("[pf-topics] NewsFeed Following tab became active");
      refreshTopics();
    }
    wasFollowingRef.current = isFollowing;
  }, [feedMode, refreshTopics]);

  useEffect(() => {
    const navTab = navigation?.navTab;
    if (
      navTab === "home" &&
      prevNavTabRef.current === "profile" &&
      feedMode === "following"
    ) {
      console.log("[pf-topics] NewsFeed refreshed after leaving Profile");
      refreshTopics();
    }
    prevNavTabRef.current = navTab;
  }, [navigation?.navTab, feedMode, refreshTopics]);

  useEffect(() => {
    if (feedMode === displayedFeedMode) {
      setTabContentVisible(true);
      return;
    }

    setTabContentVisible(false);
    let fadeInTimer: number | undefined;

    const fadeOutTimer = window.setTimeout(() => {
      setDisplayedFeedMode(feedMode);
      fadeInTimer = window.setTimeout(() => setTabContentVisible(true), 50);
    }, 200);

    return () => {
      window.clearTimeout(fadeOutTimer);
      if (fadeInTimer !== undefined) window.clearTimeout(fadeInTimer);
    };
  }, [feedMode, displayedFeedMode]);

  const filteredArticles = useMemo(
    () =>
      buildFeedArticles(
        allArticles,
        displayedFeedMode,
        followedMarkets,
        marketFilters,
        sectorFilters,
        sectorInterests,
        searchQuery,
        favouriteTopics
      ),
    [
      allArticles,
      displayedFeedMode,
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
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentRefreshKey, setCommentRefreshKey] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    resetFeedIndex();
    setDragY(0);
  }, [resetFeedIndex]);

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

  const forYouTopIds = useMemo(
    () =>
      getForYouTopArticleIds(
        allArticles,
        followedMarkets,
        sectorInterests,
        favouriteTopics
      ),
    [allArticles, followedMarkets, sectorInterests, favouriteTopics]
  );

  const trendingArticles = useMemo(
    () => rankTrendingArticles(trendingPool, forYouTopIds).slice(0, 15),
    [trendingPool, forYouTopIds]
  );

  const verticalFeedArticles =
    displayedFeedMode === "trending" ? trendingArticles : filteredArticles;
  const swipeArticle =
    verticalFeedArticles[feedIndex] ?? verticalFeedArticles[0];
  const article = articleOverride ?? swipeArticle;
  const gesturesEnabled = !filterOpen && !commentsOpen && !searchOpen;
  const verticalFeedLengthRef = useRef(verticalFeedArticles.length);
  verticalFeedLengthRef.current = verticalFeedArticles.length;

  useEffect(() => {
    const max = Math.max(0, verticalFeedArticles.length - 1);
    if (feedIndex > max) setFeedIndex(max);
  }, [verticalFeedArticles.length, feedIndex, setFeedIndex]);

  useEffect(() => {
    if (
      prevFeedIndex.current >= 0 &&
      feedIndex !== prevFeedIndex.current &&
      verticalFeedArticles.length > 0
    ) {
      incrementStoriesRead();
    }
    prevFeedIndex.current = feedIndex;
  }, [feedIndex, verticalFeedArticles.length, incrementStoriesRead]);

  useEffect(() => {
    if (
      panelIndex === PANEL_ARTICLE &&
      prevPanelIndex.current !== PANEL_ARTICLE &&
      article
    ) {
      addRecentlyRead(article);
      recordActivityEvent("article_opened", article.id, {
        articleId: article.id,
        category: article.tags[0] ?? article.sector ?? undefined,
      });
    }
    prevPanelIndex.current = panelIndex;
  }, [panelIndex, article]);

  useEffect(() => {
    onSidePanelChange?.(
      panelIndex === PANEL_STOCK ||
        panelIndex === PANEL_ARTICLE ||
        commentsOpen
    );
  }, [panelIndex, commentsOpen, onSidePanelChange]);

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
      router.replace(appPath("profile"), { scroll: false });
  }, [navigation, router]);

  const jumpToForYouArticle = useCallback(
    (selected: NewsArticle) => {
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

  const handleSearchSelect = useCallback(
    (selected: NewsArticle) => {
      setSearchOpen(false);
      jumpToForYouArticle(selected);
    },
    [jumpToForYouArticle]
  );

  useEffect(() => {
    if (!feedJumpArticleId) return;
    const article = allArticles.find((a) => a.id === feedJumpArticleId);
    if (article) jumpToForYouArticle(article);
    clearFeedJump();
  }, [
    feedJumpArticleId,
    allArticles,
    jumpToForYouArticle,
    clearFeedJump,
  ]);

  const gesturesEnabledRef = useRef(gesturesEnabled);
  gesturesEnabledRef.current = gesturesEnabled;

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

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const passiveFalse = { passive: false } as AddEventListenerOptions;
    let touchGestureActive = false;

    const beginGesture = (
      clientX: number,
      clientY: number,
      pointerId: number,
      target: EventTarget | null
    ) => {
      if (!gesturesEnabledRef.current || isInteractiveTarget(target)) return;

      dragging.current = true;
      setIsDragging(true);
      axis.current = null;
      activePointer.current = pointerId;
      startedInFeed.current =
        (target as HTMLElement | null)?.closest("[data-feed-column]") !== null;

      const sample = { x: clientX, y: clientY, t: Date.now() };
      start.current = sample;
      last.current = sample;
      setDragX(0);
      setDragY(0);
    };

    const moveGesture = (clientX: number, clientY: number, pointerId: number) => {
      if (!dragging.current || activePointer.current !== pointerId) return;

      const dx = clientX - start.current.x;
      const dy = clientY - start.current.y;

      if (!axis.current) {
        if (Math.hypot(dx, dy) < AXIS_LOCK) return;

        const inFeed =
          startedInFeed.current && panelIndexRef.current === PANEL_FEED;

        if (inFeed && Math.abs(dy) >= Math.abs(dx)) {
          axis.current = "y";
          try {
            el.setPointerCapture(pointerId);
          } catch {
            /* touch ids may not support capture */
          }
        } else if (Math.abs(dx) > Math.abs(dy)) {
          axis.current = "x";
          try {
            el.setPointerCapture(pointerId);
          } catch {
            /* touch ids may not support capture */
          }
        } else if (inFeed) {
          axis.current = "y";
          try {
            el.setPointerCapture(pointerId);
          } catch {
            /* touch ids may not support capture */
          }
        } else {
          dragging.current = false;
          setIsDragging(false);
          activePointer.current = null;
          return;
        }
      }

      last.current = { x: clientX, y: clientY, t: Date.now() };

      if (axis.current === "x") {
        setDragX(dx);
      } else if (axis.current === "y") {
        setDragY(dy);
      }
    };

    const endGesture = (pointerId: number) => {
      if (activePointer.current !== pointerId) return;

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
        const maxIdx = Math.max(0, verticalFeedLengthRef.current - 1);
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
    };

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      touchGestureActive = true;
      beginGesture(touch.clientX, touch.clientY, touch.identifier, e.target);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!dragging.current) return;
      const touch = Array.from(e.touches).find(
        (t) => t.identifier === activePointer.current
      );
      if (!touch) return;
      if (axis.current) e.preventDefault();
      moveGesture(touch.clientX, touch.clientY, touch.identifier);
    };

    const onTouchEnd = (e: TouchEvent) => {
      const touch = Array.from(e.changedTouches).find(
        (t) => t.identifier === activePointer.current
      );
      if (touch) endGesture(touch.identifier);
      if (e.touches.length === 0) touchGestureActive = false;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (touchGestureActive || e.button !== 0) return;
      beginGesture(e.clientX, e.clientY, e.pointerId, e.target);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (touchGestureActive || !dragging.current) return;
      if (axis.current) e.preventDefault();
      moveGesture(e.clientX, e.clientY, e.pointerId);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (touchGestureActive) return;
      endGesture(e.pointerId);
    };

    el.addEventListener("touchstart", onTouchStart, passiveFalse);
    el.addEventListener("touchmove", onTouchMove, passiveFalse);
    el.addEventListener("touchend", onTouchEnd, passiveFalse);
    el.addEventListener("touchcancel", onTouchEnd, passiveFalse);
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove, passiveFalse);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
    };
  }, [
    gesturesEnabled,
    releaseCapture,
    resetFeedIndex,
    setFeedIndex,
  ]);

  const trackTransition = isDragging
    ? ""
    : "transition-transform duration-300 ease-out";

  const hTransform = `translateX(calc(-${panelIndex} * 33.333% + ${dragX}px))`;
  const vTransform = `translate3d(0, calc(-${feedIndex} * ${FEED_VIEWPORT_HEIGHT} + ${dragY}px), 0)`;
  const trackHeight =
    panelIndex === PANEL_STOCK || panelIndex === PANEL_ARTICLE
      ? APP_VIEWPORT_HEIGHT
      : FEED_VIEWPORT_HEIGHT;

  const feedContent = (
    <div
      className="relative overflow-hidden bg-pocket-feed-bg"
      style={{ height: trackHeight }}
    >
        <div
          ref={trackRef}
          className={`flex touch-none ${trackTransition} ${!gesturesEnabled ? "pointer-events-none" : ""}`}
          style={{
            height: trackHeight,
            width: "300%",
            transform: hTransform,
          }}
        >
          <div
            className="h-full shrink-0 overflow-y-auto overscroll-contain"
            style={{ width: "33.333%", touchAction: "pan-y" }}
          >
            {article && <StockPanel article={article} onBack={goToFeed} />}
          </div>

          <div
            data-feed-column
            className="pf-home-feed relative shrink-0 overflow-hidden bg-pocket-feed-bg"
            style={{
              width: "33.333%",
              height: FEED_VIEWPORT_HEIGHT,
              touchAction: "none",
            }}
          >
            <div
              className="pointer-events-auto absolute inset-x-0 top-0 z-50"
              style={tabEnterStyle(homeEntered, 0)}
            >
              <FeedHeader
                feedMode={feedMode}
                onFeedModeChange={setFeedMode}
                onOpenSearch={() => setSearchOpen(true)}
                searchOpen={searchOpen}
              />
            </div>

            <div className="h-full">
            {verticalFeedArticles.length === 0 ? (
              <div
                className={`pf-feed-empty flex h-full flex-col items-center justify-center px-8 text-center transition-opacity duration-200 ease-out ${
                  tabContentVisible ? "opacity-100" : "opacity-0"
                }`}
                style={tabEnterStyle(homeEntered, 120)}
              >
                {displayedFeedMode === "following" && favouriteTopics.length === 0 ? (
                  <>
                    <p className="text-lg font-bold text-pocket-text">
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
                    <p className="text-lg font-bold text-pocket-text">
                      {displayedFeedMode === "following"
                        ? "No stories match your topics"
                        : "No stories match"}
                    </p>
                    <p className="mt-2 text-sm font-medium text-pocket-muted">
                      {displayedFeedMode === "following"
                        ? "Try adding more topics in your Profile."
                        : "Adjust filters or search to see more news."}
                    </p>
                    <button
                      type="button"
                      data-no-drag
                      onClick={() =>
                        displayedFeedMode === "following"
                          ? openProfile()
                          : setFilterOpen(true)
                      }
                      className="mt-6 rounded-full bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] px-6 py-2.5 text-sm font-bold text-white"
                    >
                      {displayedFeedMode === "following" ? "Go to Profile" : "Open filters"}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="feed-column-viewport z-0">
                <div
                  className={`w-full touch-none ${trackTransition}`}
                  style={{
                    height: `calc(${verticalFeedArticles.length} * ${FEED_VIEWPORT_HEIGHT})`,
                    transform: vTransform,
                    WebkitBackfaceVisibility: "hidden",
                    backfaceVisibility: "hidden",
                  }}
                >
                  {verticalFeedArticles.map((a, i) => (
                    <div
                      key={a.id}
                      className="w-full shrink-0"
                      style={{ height: FEED_VIEWPORT_HEIGHT }}
                    >
                      <FeedCard
                        article={a}
                        active={i === feedIndex}
                        showBottomChrome
                        isFirstCard={i === 0}
                        showTrendingLabel={displayedFeedMode === "trending"}
                        onOpenComments={() => setCommentsOpen(true)}
                        commentRefreshKey={commentRefreshKey}
                        overlayVisible={tabContentVisible}
                        overlayHomeReady={homeEntered}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
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
        {embedded && <FeedOnboardingOverlay />}
    </div>
  );

  if (embedded) {
    return feedContent;
  }

  return (
    <MobilePageShell
      activeTab="home"
      hideBottomNav={
        panelIndex === PANEL_STOCK ||
        panelIndex === PANEL_ARTICLE ||
        commentsOpen
      }
    >
      {feedContent}
    </MobilePageShell>
  );
}
