"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { useNavigationOptional } from "@/context/NavigationContext";
import {
  buildFeedArticles,
  type FeedMode,
} from "@/lib/filterArticles";
import { buildFeedPersonalizationInput } from "@/lib/feedPersonalization";
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
import { rankTrendingArticles } from "@/lib/trendingArticles";
import { resolveArticleTicker } from "@/lib/tickerMap";
import { countryName } from "@/lib/countryNames";
import type { NewsArticle } from "@/lib/types";
import { CommentSheet } from "./CommentSheet";
import { FeedCard } from "./FeedCard";
import { FilterPanel } from "./FilterPanel";
import { FeedSearchOverlay } from "./FeedSearchOverlay";
import { ArticlePanel } from "./ArticlePanel";
import { BusinessInfoPanel } from "./BusinessInfoPanel";
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
  /** Called when the business-info or article panel opens or closes (embedded shell hides bottom nav) */
  onSidePanelChange?: (open: boolean) => void;
}

const PANEL_INFO = 0;
const PANEL_FEED = 1;
const PANEL_ARTICLE = 2;
const AXIS_LOCK = 6;
const SWIPE_THRESHOLD_PX = 55;
const SWIPE_VELOCITY = 0.35;
const PULL_REFRESH_PX = 72;
/** Matches the "duration-300" snap-transition class below. */
const TRACK_TRANSITION_MS = 300;

type LockedAxis = "x" | "y" | null;

export function NewsFeed({
  initialArticles,
  initialTrendingArticles = [],
  embedded = false,
  showAddToHomeBanner = true,
  onSidePanelChange,
}: NewsFeedProps) {
  const [allArticles, setAllArticles] = useState(initialArticles);
  const [trendingPool] = useState(() =>
    initialTrendingArticles.length > 0 ? initialTrendingArticles : initialArticles
  );
  // Infinite scroll: initialArticles is page 1 (~60 articles). Page 2+ is
  // fetched on demand as the user nears the end of what's loaded, so the
  // feed keeps going instead of hitting a hard stop.
  const [nextFeedPage, setNextFeedPage] = useState(2);
  const [loadingMoreArticles, setLoadingMoreArticles] = useState(false);
  const [hasMoreArticlePages, setHasMoreArticlePages] = useState(true);
  // Consecutive page fetches that came back empty or all-duplicate. Marketaux
  // pages aren't guaranteed to be disjoint, so one overlapping page doesn't
  // mean we've truly reached the end — only give up after a few in a row.
  const consecutiveEmptyPagesRef = useRef(0);
  const MAX_CONSECUTIVE_EMPTY_PAGES = 3;
  const {
    followedMarkets,
    marketFilters,
    sectorFilters,
    sectorInterests,
    preferredRegion,
    searchQuery,
    savedArticles,
    feedIndex,
    setFeedIndex,
    resetFeedIndex,
    incrementStoriesRead,
    feedJumpArticleId,
    clearFeedJump,
    hiddenSources,
    countryFilter,
    setCountryFilter,
    followedTickers,
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
  const [personalizationTick, setPersonalizationTick] = useState(0);
  // Session-only by design — resets on reload rather than persisting, so a
  // forgotten toggle can never make the feed look permanently empty on a
  // later visit.
  const [followingOnly, setFollowingOnly] = useState(false);

  // Real, country-scoped articles for "Browse by region" (Explore → tap a
  // country). Filtering the existing ~100-article general feed pool by its
  // inferred entity country was the old approach — it returns almost
  // nothing for any country that isn't already dominant in that pool, since
  // none of it was fetched with a country in mind. This fetches the real
  // thing instead.
  const [countryArticles, setCountryArticles] = useState<NewsArticle[]>([]);
  const [countryArticlesLoading, setCountryArticlesLoading] = useState(false);

  useEffect(() => {
    if (!countryFilter) {
      setCountryArticles([]);
      setCountryArticlesLoading(false);
      return;
    }

    let cancelled = false;
    setCountryArticlesLoading(true);
    fetch(`/api/marketaux/country-news?country=${countryFilter}&limit=40`)
      .then((res) => (res.ok ? res.json() : { articles: [] }))
      .then((data: { articles?: NewsArticle[] }) => {
        if (!cancelled) setCountryArticles(data.articles ?? []);
      })
      .catch(() => {
        if (!cancelled) setCountryArticles([]);
      })
      .finally(() => {
        if (!cancelled) setCountryArticlesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [countryFilter]);

  const refreshTopics = useCallback(() => {
    const topics = loadFavouriteTopics();
    setFavouriteTopics(topics);
  }, []);

  useEffect(() => {
    const onPersonalizationChange = () => setPersonalizationTick((t) => t + 1);
    window.addEventListener("pf-progression-updated", onPersonalizationChange);
    window.addEventListener(PF_TOPICS_CHANGED_EVENT, onPersonalizationChange);
    return () => {
      window.removeEventListener("pf-progression-updated", onPersonalizationChange);
      window.removeEventListener(PF_TOPICS_CHANGED_EVENT, onPersonalizationChange);
    };
  }, []);

  const articlesById = useMemo(
    () => new Map(allArticles.map((article) => [article.id, article])),
    [allArticles]
  );

  const personalizationInput = useMemo(() => {
    void personalizationTick;
    return buildFeedPersonalizationInput({
      followedMarkets,
      sectorInterests,
      favouriteTopics,
      preferredRegion,
      followedTickers,
      savedArticles,
      articlesById,
    });
  }, [
      followedMarkets,
      sectorInterests,
      preferredRegion,
      favouriteTopics,
      followedTickers,
      savedArticles,
      articlesById,
      personalizationTick,
    ]
  );

  useEffect(() => {
    refreshTopics();

    const onStorage = (e: StorageEvent) => {
      if (e.key !== PF_TOPICS_STORAGE_KEY) return;
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
        countryFilter ? countryArticles : allArticles,
        displayedFeedMode,
        followedMarkets,
        marketFilters,
        sectorFilters,
        sectorInterests,
        searchQuery,
        favouriteTopics,
        personalizationInput,
        hiddenSources,
        // Already scoped server-side by fetchCountryNews when active — no
        // need to re-filter by each article's inferred entity country too.
        null
      ),
    [
      allArticles,
      countryArticles,
      countryFilter,
      displayedFeedMode,
      followedMarkets,
      marketFilters,
      sectorFilters,
      sectorInterests,
      searchQuery,
      favouriteTopics,
      personalizationInput,
      hiddenSources,
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
  // Blocks a new gesture from starting for the duration of the snap
  // transition (see trackTransition/TRACK_TRANSITION_MS below). Without
  // this, a fast follow-up swipe — e.g. scroll to the next card, then
  // immediately swipe left to read — can begin and finish before the CSS
  // transition has visually caught up: feedIndex has already committed to
  // the new card, so the article panel opens whatever card is now "current"
  // in state, not the one still visually centered on screen. Feels like the
  // feed randomly jumps to a different article mid-swipe.
  const settling = useRef(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  panelIndexRef.current = panelIndex;
  feedIndexRef.current = feedIndex;
  feedModeRef.current = feedMode;

  const trendingArticles = useMemo(() => {
    const pool =
      hiddenSources.length > 0
        ? trendingPool.filter((a) => !hiddenSources.includes(a.sourceName))
        : trendingPool;
    return rankTrendingArticles(pool).slice(0, 40);
  }, [trendingPool, hiddenSources]);

  const verticalFeedArticles = useMemo(() => {
    const base =
      displayedFeedMode === "trending" ? trendingArticles : filteredArticles;
    if (!followingOnly) return base;
    return base.filter((a) =>
      followedTickers.includes(resolveArticleTicker(a))
    );
  }, [displayedFeedMode, trendingArticles, filteredArticles, followingOnly, followedTickers]);

  // `verticalFeedArticles` can silently reorder mid-session — most notably,
  // opening an article dings its "For You" score (see openedArticleIds in
  // feedPersonalization.ts), which bumps personalizationTick, which
  // re-sorts filteredArticles. feedIndex is a plain array position, so
  // without correction it would keep pointing at whatever now sits at that
  // slot instead of the article the user actually has open — the classic
  // "swipe left and it jumps to a different article" glitch. To fix this we
  // track the article the user is currently anchored to by id and, whenever
  // the array reference changes (reorder/filter/mode switch), re-derive the
  // index for THAT article synchronously during render so the visible
  // article never flashes to the wrong one for a frame.
  const anchorArticleIdRef = useRef<string | null>(null);
  const prevVerticalArticlesRef = useRef<NewsArticle[] | null>(null);

  let effectiveFeedIndex = feedIndex;
  if (
    prevVerticalArticlesRef.current !== null &&
    prevVerticalArticlesRef.current !== verticalFeedArticles &&
    anchorArticleIdRef.current
  ) {
    const anchoredIndex = verticalFeedArticles.findIndex(
      (a) => a.id === anchorArticleIdRef.current
    );
    if (anchoredIndex !== -1) {
      effectiveFeedIndex = anchoredIndex;
    }
  }
  prevVerticalArticlesRef.current = verticalFeedArticles;

  const swipeArticle =
    verticalFeedArticles[effectiveFeedIndex] ?? verticalFeedArticles[0];
  const article = articleOverride ?? swipeArticle;
  anchorArticleIdRef.current = swipeArticle?.id ?? null;

  const gesturesEnabled = !filterOpen && !commentsOpen && !searchOpen;
  const verticalFeedLengthRef = useRef(verticalFeedArticles.length);
  verticalFeedLengthRef.current = verticalFeedArticles.length;

  // Infinite scroll: fetch the next page of articles once the user is
  // within a few cards of the end of what's loaded, so the feed never
  // visibly runs out. Scoped to the general "For You"/trending-off feed —
  // the trending pool is a bounded top-40 ranking (paging it further would
  // mean progressively less-trending results, not "more trending"), and the
  // country-scoped feed is a separate, already-complete endpoint response.
  useEffect(() => {
    if (displayedFeedMode === "trending" || countryFilter) return;
    if (loadingMoreArticles || !hasMoreArticlePages) return;
    if (verticalFeedArticles.length === 0) return;

    const remaining = verticalFeedArticles.length - 1 - effectiveFeedIndex;
    if (remaining > 5) return;

    let cancelled = false;
    setLoadingMoreArticles(true);

    fetch(`/api/news/more?page=${nextFeedPage}`)
      .then((res) => (res.ok ? res.json() : { articles: [] }))
      .then((data: { articles?: NewsArticle[] }) => {
        if (cancelled) return;
        const fresh = (data.articles ?? []).filter(
          (a) => !allArticles.some((existing) => existing.id === a.id)
        );
        if (fresh.length === 0) {
          consecutiveEmptyPagesRef.current += 1;
          // Still advance the page pointer even on an empty/overlapping
          // page — a page that duplicated page N-1 doesn't mean page N+1
          // will too, and retrying the *same* page number forever would be
          // the real dead end.
          setNextFeedPage((p) => p + 1);
          if (consecutiveEmptyPagesRef.current >= MAX_CONSECUTIVE_EMPTY_PAGES) {
            setHasMoreArticlePages(false);
          }
          return;
        }
        consecutiveEmptyPagesRef.current = 0;
        setAllArticles((prev) => [...prev, ...fresh]);
        setNextFeedPage((p) => p + 1);
      })
      .catch(() => {
        // A transient network hiccup shouldn't permanently disable infinite
        // scroll for the rest of the session — just skip this attempt and
        // let the effect re-fire on the next scroll/re-render.
        if (!cancelled) {
          consecutiveEmptyPagesRef.current += 1;
          if (consecutiveEmptyPagesRef.current >= MAX_CONSECUTIVE_EMPTY_PAGES) {
            setHasMoreArticlePages(false);
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingMoreArticles(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    effectiveFeedIndex,
    verticalFeedArticles.length,
    displayedFeedMode,
    countryFilter,
    loadingMoreArticles,
    hasMoreArticlePages,
    nextFeedPage,
    allArticles,
  ]);

  useEffect(() => {
    if (effectiveFeedIndex !== feedIndex) {
      setFeedIndex(effectiveFeedIndex);
      return;
    }
    const max = Math.max(0, verticalFeedArticles.length - 1);
    if (feedIndex > max) setFeedIndex(max);
  }, [effectiveFeedIndex, verticalFeedArticles.length, feedIndex, setFeedIndex]);

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
    onSidePanelChange?.(panelIndex !== PANEL_FEED || commentsOpen);
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
        favouriteTopics,
        personalizationInput,
        hiddenSources
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
      personalizationInput,
      hiddenSources,
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

    /**
     * Called whenever a committed index change (feed or panel) kicks off
     * the CSS snap transition. Blocks new gestures until that transition
     * has had time to visually finish, so state (feedIndex/panelIndex) and
     * what's on screen never get out of sync.
     */
    const lockDuringSettle = () => {
      settling.current = true;
      if (settleTimer.current) clearTimeout(settleTimer.current);
      settleTimer.current = setTimeout(() => {
        settling.current = false;
        settleTimer.current = null;
      }, TRACK_TRANSITION_MS);
    };

    const beginGesture = (
      clientX: number,
      clientY: number,
      pointerId: number,
      target: EventTarget | null
    ) => {
      if (
        !gesturesEnabledRef.current ||
        isInteractiveTarget(target) ||
        settling.current
      )
        return;

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
        if (next !== panelIndexRef.current) lockDuringSettle();
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
          // Stop at the last card rather than looping back to the first —
          // wrapping silently reads as the feed randomly resetting,
          // especially on a short filtered/personalized list where the
          // "end" is reached quickly.
          next = Math.min(maxIdx, next + 1);
          if (next !== feedIndexRef.current) lockDuringSettle();
          setFeedIndex(next);
        } else if (velocity > SWIPE_VELOCITY || dy > SWIPE_THRESHOLD_PX) {
          next = Math.max(0, next - 1);
          if (next !== feedIndexRef.current) lockDuringSettle();
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
      if (settleTimer.current) {
        clearTimeout(settleTimer.current);
        settleTimer.current = null;
      }
      settling.current = false;
    };
  }, [
    gesturesEnabled,
    releaseCapture,
    resetFeedIndex,
    setFeedIndex,
  ]);

  // Desktop/trackpad mouse-wheel support. The card track otherwise only
  // responds to touch/pointer drag, so a mouse-wheel visitor on the web
  // saw a feed that looked frozen — scrolling did nothing. Kept fully
  // separate from the drag-gesture effect above (own listener, own
  // cooldown) rather than woven into it, since that gesture state machine
  // has a history of subtle race conditions and a wheel event has a very
  // different shape (many small deltaY ticks vs. one continuous drag).
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    let cooldownUntil = 0;
    const WHEEL_COOLDOWN_MS = TRACK_TRANSITION_MS + 60;
    const WHEEL_THRESHOLD = 24;

    const onWheel = (e: WheelEvent) => {
      if (!gesturesEnabledRef.current || settling.current) return;
      if (panelIndexRef.current !== PANEL_FEED) return;
      if (isInteractiveTarget(e.target)) return;
      // Mostly-horizontal wheel gestures (e.g. a trackpad swipe) aren't
      // this feed's vertical up/next navigation — leave them alone.
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;

      const now = Date.now();
      if (now < cooldownUntil) {
        e.preventDefault();
        return;
      }

      const maxIdx = Math.max(0, verticalFeedLengthRef.current - 1);
      const current = feedIndexRef.current;
      let next = current;

      if (e.deltaY > 0) {
        // Stop at the last card instead of wrapping back to the first —
        // see matching comment in the touch/pointer handler above.
        next = Math.min(maxIdx, current + 1);
      } else {
        next = Math.max(0, current - 1);
      }

      if (next !== current) {
        e.preventDefault();
        settling.current = true;
        if (settleTimer.current) clearTimeout(settleTimer.current);
        settleTimer.current = setTimeout(() => {
          settling.current = false;
          settleTimer.current = null;
        }, TRACK_TRANSITION_MS);
        setFeedIndex(next);
        cooldownUntil = now + WHEEL_COOLDOWN_MS;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [setFeedIndex]);

  const trackTransition = isDragging
    ? ""
    : "transition-transform duration-300 ease-out";

  const hTransform = `translateX(calc(-${panelIndex} * 33.3333% + ${dragX}px))`;
  const vTransform = `translate3d(0, calc(-${feedIndex} * ${FEED_VIEWPORT_HEIGHT} + ${dragY}px), 0)`;
  const trackHeight =
    panelIndex !== PANEL_FEED ? APP_VIEWPORT_HEIGHT : FEED_VIEWPORT_HEIGHT;

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
            style={{ width: "33.3333%", touchAction: "pan-y" }}
          >
            <BusinessInfoPanel
              article={article ?? null}
              onBack={goToFeed}
              active={panelIndex === PANEL_INFO}
            />
          </div>

          <div
            data-feed-column
            className="pf-home-feed relative shrink-0 overflow-hidden bg-pocket-feed-bg"
            style={{
              width: "33.3333%",
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
                followingOnly={followingOnly}
                onToggleFollowingOnly={() => setFollowingOnly((v) => !v)}
              />
            </div>

            <div className="h-full">
            {countryFilter && countryArticlesLoading ? (
              <div
                className="pf-feed-empty flex h-full flex-col items-center justify-center px-8 text-center"
                style={tabEnterStyle(homeEntered, 120)}
              >
                <p className="text-sm font-medium text-pocket-muted">
                  Loading stories from {countryName(countryFilter)}…
                </p>
              </div>
            ) : verticalFeedArticles.length === 0 ? (
              <div
                className={`pf-feed-empty flex h-full flex-col items-center justify-center px-8 text-center transition-opacity duration-200 ease-out ${
                  tabContentVisible ? "opacity-100" : "opacity-0"
                }`}
                style={tabEnterStyle(homeEntered, 120)}
              >
                {followingOnly ? (
                  <>
                    <p className="text-lg font-bold text-pocket-text">
                      No stories from companies you follow
                    </p>
                    <p className="mt-2 text-sm font-medium text-pocket-muted">
                      Follow a few companies from an article&apos;s swipe-right panel,
                      or switch back to see everyone.
                    </p>
                    <button
                      type="button"
                      data-no-drag
                      onClick={() => setFollowingOnly(false)}
                      className="mt-6 rounded-full bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] px-6 py-2.5 text-sm font-bold text-white"
                    >
                      Show everyone
                    </button>
                  </>
                ) : countryFilter ? (
                  <>
                    <p className="text-lg font-bold text-pocket-text">
                      No stories from {countryName(countryFilter)} right now
                    </p>
                    <p className="mt-2 text-sm font-medium text-pocket-muted">
                      Marketaux hasn&apos;t indexed anything from here today —
                      check back later, or browse everyone&apos;s feed.
                    </p>
                    <button
                      type="button"
                      data-no-drag
                      onClick={() => setCountryFilter(null)}
                      className="mt-6 rounded-full bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] px-6 py-2.5 text-sm font-bold text-white"
                    >
                      Show everyone
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-bold text-pocket-text">No stories match</p>
                    <p className="mt-2 text-sm font-medium text-pocket-muted">
                      Adjust filters or search to see more news.
                    </p>
                    <button
                      type="button"
                      data-no-drag
                      onClick={() => setFilterOpen(true)}
                      className="mt-6 rounded-full bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] px-6 py-2.5 text-sm font-bold text-white"
                    >
                      Open filters
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
            style={{ width: "33.3333%", touchAction: "pan-y" }}
          >
            {article && (
              <ArticlePanel
                article={article}
                onBack={goToFeed}
                onOpenArticle={openArticle}
                active={panelIndex === PANEL_ARTICLE}
              />
            )}
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
      hideBottomNav={panelIndex !== PANEL_FEED || commentsOpen}
    >
      {feedContent}
    </MobilePageShell>
  );
}
