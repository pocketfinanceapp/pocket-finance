"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { NavTab } from "@/components/BottomNav";
import type { MarketFilter, SectorFilter } from "@/lib/filters";
import { isOnboardingComplete, markOnboardingComplete } from "@/lib/onboarding";
import {
  loadFollowedMarkets,
  saveFollowedMarkets,
} from "@/lib/marketPreferences";
import {
  loadSectorInterests,
  saveSectorInterests,
} from "@/lib/sectorPreferences";
import {
  loadHiddenSources,
  saveHiddenSources,
} from "@/lib/sourcePreferences";
import {
  loadFollowedTickers,
  saveFollowedTickers,
} from "@/lib/tickerPreferences";
import {
  currencyForRegion,
  DEFAULT_APP_CURRENCY,
  DEFAULT_APP_REGION,
  loadCurrencyManualOverride,
  loadPreferredCurrency,
  loadPreferredRegion,
  saveCurrencyManualOverride,
  savePreferredCurrency,
  savePreferredRegion,
  type AppCurrency,
  type AppRegionId,
} from "@/lib/regionPreferences";
import { setActiveDisplayCurrency } from "@/lib/utils";
import {
  fetchSavedArticles,
  fetchUserLikedCount,
  fetchUserLikedArticleIds,
  fetchLikeCounts,
  fetchUserStoriesRead,
  setUserStoriesRead,
  saveArticle as dbSaveArticle,
  unsaveArticle as dbUnsaveArticle,
} from "@/lib/userInteractions";
import {
  countMarketMovers,
  getGlobalMarketStatus,
  type GlobalMarket,
  GLOBAL_MARKETS,
} from "@/lib/markets";
import { resolveArticleTicker } from "@/lib/tickerMap";
import { trackEvent } from "@/lib/analytics";
import type { NewsArticle, SavedArticleEntry } from "@/lib/types";
import {
  grantAchievementRewards,
  initSessionSnapshot,
  migrateActivityData,
  recordActivityEvent,
} from "@/lib/progression";
import { restoreWatchlistTicker } from "@/lib/watchlistStore";

export interface MarketsSnapshot {
  markets: GlobalMarket[];
  movers: { up: number; down: number };
  session: { open: boolean; label: "Markets open" | "Markets closed" };
  loaded: boolean;
}

interface AppContextValue {
  ready: boolean;
  savedArticles: SavedArticleEntry[];
  saveArticle: (article: NewsArticle) => Promise<boolean>;
  unsaveArticle: (articleId: string) => Promise<boolean>;
  isArticleSaved: (articleId: string) => boolean;
  reloadSavedArticles: (force?: boolean) => Promise<void>;
  watchlistLoaded: boolean;
  ensureWatchlistLoaded: () => void;
  marketsSnapshot: MarketsSnapshot | null;
  ensureMarketsLoaded: () => void;
  followedMarkets: MarketFilter[];
  toggleFollowMarket: (m: MarketFilter) => void;
  isFollowingMarket: (m: MarketFilter) => boolean;
  setFollowedMarkets: (markets: MarketFilter[]) => void;
  sectorInterests: SectorFilter[];
  toggleSectorInterest: (s: SectorFilter) => void;
  preferredRegion: AppRegionId;
  preferredCurrency: AppCurrency;
  setPreferredRegion: (region: AppRegionId) => void;
  setPreferredCurrency: (
    currency: AppCurrency,
    options?: { manual?: boolean }
  ) => void;
  marketFilters: MarketFilter[];
  setMarketFilters: (filters: MarketFilter[]) => void;
  toggleMarketFilter: (m: MarketFilter) => void;
  sectorFilters: SectorFilter[];
  toggleSectorFilter: (s: SectorFilter) => void;
  clearFilters: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  countryFilter: string | null;
  setCountryFilter: (code: string | null) => void;
  hiddenSources: string[];
  toggleHiddenSource: (source: string) => void;
  isSourceHidden: (source: string) => boolean;
  followedTickers: string[];
  toggleFollowTicker: (ticker: string) => void;
  isFollowingTicker: (ticker: string) => boolean;
  storiesRead: number;
  likedArticlesCount: number;
  /**
   * Every liked article id for the current user, fetched once here instead
   * of per-card. Each FeedCard's like button used to call
   * fetchUserLikedArticleIds itself via useArticleLikes — with a dozen-plus
   * cards mounted at once (or more over a long scroll session), that meant
   * a dozen-plus identical full-table Supabase fetches for the exact same
   * data on every load, which is what a "liked_articles?select=article_id"
   * request storm in the network log traces back to. One shared fetch here,
   * updated locally on like/unlike, replaces all of them.
   */
  likedArticleIds: Set<string>;
  setLikedArticleIds: Dispatch<SetStateAction<Set<string>>>;
  /**
   * Global like counts, keyed by article id. The feed renders every card
   * at once (no virtualization), so each FeedCard used to fetch its own
   * count independently on mount — a burst of dozens of concurrent
   * count=exact HEAD queries against liked_articles that was tripping
   * intermittent 503s from Supabase. ensureLikeCountsLoaded batches
   * whatever ids get requested within a short window into one query.
   */
  likeCounts: Map<string, number>;
  ensureLikeCountsLoaded: (articleIds: string[]) => void;
  feedIndex: number;
  setFeedIndex: (index: number) => void;
  resetFeedIndex: () => void;
  feedJumpArticleId: string | null;
  requestFeedJump: (articleId: string) => void;
  clearFeedJump: () => void;
  companyPanelTicker: string | null;
  companyPanelReturnTab: NavTab | null;
  requestCompanyPanel: (ticker: string, returnTab?: NavTab) => void;
  clearCompanyPanelRequest: () => void;
  clearCompanyPanelReturnTab: () => void;
  incrementStoriesRead: () => void;
  reloadProfileStats: () => Promise<void>;
  onboardingComplete: boolean;
  completeOnboarding: (
    markets: MarketFilter[],
    sectors: SectorFilter[],
    region: AppRegionId,
    currency?: AppCurrency
  ) => void;
  syncAppUser: (userId: string | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [savedArticles, setSavedArticles] = useState<SavedArticleEntry[]>([]);
  const [followedMarkets, setFollowedMarketsState] = useState<MarketFilter[]>(
    []
  );
  const [sectorInterests, setSectorInterestsState] = useState<SectorFilter[]>(
    []
  );
  const [preferredRegion, setPreferredRegionState] = useState<AppRegionId>(
    DEFAULT_APP_REGION
  );
  const [preferredCurrency, setPreferredCurrencyState] =
    useState<AppCurrency>(DEFAULT_APP_CURRENCY);
  const [marketFilters, setMarketFilters] = useState<MarketFilter[]>([]);
  const [sectorFilters, setSectorFiltersState] = useState<SectorFilter[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [hiddenSources, setHiddenSources] = useState<string[]>([]);
  const [followedTickers, setFollowedTickers] = useState<string[]>([]);
  const [storiesRead, setStoriesRead] = useState(0);
  const [likedArticlesCount, setLikedArticlesCount] = useState(0);
  const [likedArticleIds, setLikedArticleIds] = useState<Set<string>>(
    new Set()
  );
  const [likeCounts, setLikeCounts] = useState<Map<string, number>>(
    new Map()
  );
  // Ids already fetched or queued, so repeat mounts of the same card don't
  // re-queue a count that's already known or already in flight.
  const likeCountKnownRef = useRef<Set<string>>(new Set());
  const likeCountQueueRef = useRef<Set<string>>(new Set());
  const likeCountFlushTimerRef = useRef<number | null>(null);

  const ensureLikeCountsLoaded = useCallback((articleIds: string[]) => {
    let hasNew = false;
    for (const id of articleIds) {
      if (!likeCountKnownRef.current.has(id)) {
        likeCountKnownRef.current.add(id);
        likeCountQueueRef.current.add(id);
        hasNew = true;
      }
    }
    if (!hasNew || likeCountFlushTimerRef.current !== null) return;

    // Short window so every card that mounts in the same render burst
    // (or the same scroll-triggered batch) gets folded into one query
    // instead of each firing its own request the instant it mounts.
    likeCountFlushTimerRef.current = window.setTimeout(async () => {
      const ids = Array.from(likeCountQueueRef.current);
      likeCountQueueRef.current.clear();
      likeCountFlushTimerRef.current = null;
      if (ids.length === 0) return;
      const counts = await fetchLikeCounts(ids);
      setLikeCounts((prev) => {
        const next = new Map(prev);
        for (const [id, count] of counts) next.set(id, count);
        return next;
      });
    }, 60);
  }, []);

  const [feedIndex, setFeedIndexState] = useState(0);
  const [feedJumpArticleId, setFeedJumpArticleId] = useState<string | null>(
    null
  );
  const [companyPanelTicker, setCompanyPanelTicker] = useState<string | null>(
    null
  );
  const [companyPanelReturnTab, setCompanyPanelReturnTab] =
    useState<NavTab | null>(null);
  // Always start false, matching the server-rendered HTML. Reading
  // isOnboardingComplete() here directly (client-only, via localStorage)
  // caused a hydration mismatch (React error #418) for any already-
  // onboarded returning user: the server always renders as "not
  // onboarded", but the client's first render would immediately see
  // localStorage and render as "onboarded" — a structural difference (the
  // onboarding overlay itself) on effectively every load. The mount effect
  // below already re-checks isOnboardingComplete() and updates this right
  // after mount, so real behavior is unaffected.
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [appUserId, setAppUserId] = useState<string | null>(null);
  const [watchlistLoaded, setWatchlistLoaded] = useState(false);
  const [marketsSnapshot, setMarketsSnapshot] =
    useState<MarketsSnapshot | null>(null);

  // Kept in sync with the state above so syncAppUser/reloadSavedArticles/
  // ensureWatchlistLoaded can read the *current* values without listing
  // appUserId/watchlistLoaded as dependencies. Those callbacks are the ones
  // that set this same state, so depending on it made their own identity
  // change mid-flight (before the in-progress async fetch resolved) —
  // callers whose effects depend on the callback's identity (AppGate's
  // syncAppUser effect, TabAppShell's ensureWatchlistLoaded effect) would
  // then re-fire and kick off a second, duplicate round of fetches. Ref
  // reads avoid the self-referential dependency without changing behavior.
  const appUserIdRef = useRef<string | null>(null);
  const watchlistLoadedRef = useRef(false);
  useEffect(() => {
    appUserIdRef.current = appUserId;
  }, [appUserId]);
  useEffect(() => {
    watchlistLoadedRef.current = watchlistLoaded;
  }, [watchlistLoaded]);

  // Tracks an in-flight syncAppUser(userId) call. The stable-identity fix
  // above stops syncAppUser from *recreating itself* mid-flight, but a
  // second legitimate call for the same userId (e.g. two onAuthStateChange
  // events firing back-to-back — INITIAL_SESSION then SIGNED_IN — before
  // the first call's fetches resolve) can still arrive while
  // watchlistLoadedRef is still false, so the "already synced" check alone
  // doesn't catch it. This dedupes by userId: a second call for the same
  // userId just awaits the first call's in-flight promise instead of
  // re-running fetchSavedArticles/fetchUserStoriesRead/fetchUserLikedCount/
  // fetchUserLikedArticleIds a second time.
  const syncInFlightRef = useRef<{ userId: string; promise: Promise<void> } | null>(
    null
  );

  const reloadProfileStats = useCallback(async () => {
    if (!appUserId) {
      setStoriesRead(0);
      setLikedArticlesCount(0);
      setLikedArticleIds(new Set());
      return;
    }
    const [stories, liked, likedIds] = await Promise.all([
      fetchUserStoriesRead(appUserId),
      fetchUserLikedCount(appUserId),
      fetchUserLikedArticleIds(appUserId),
    ]);
    setStoriesRead(stories);
    setLikedArticlesCount(liked);
    setLikedArticleIds(likedIds);
  }, [appUserId]);

  const reloadSavedArticles = useCallback(async (force = false) => {
    const currentUserId = appUserIdRef.current;
    if (!currentUserId) {
      setSavedArticles([]);
      setWatchlistLoaded(false);
      return;
    }
    if (!force && watchlistLoadedRef.current) return;
    const articles = await fetchSavedArticles(currentUserId);
    setSavedArticles(articles);
    setWatchlistLoaded(true);
  }, []);

  const ensureWatchlistLoaded = useCallback(() => {
    if (!appUserIdRef.current || watchlistLoadedRef.current) return;
    void reloadSavedArticles(true);
  }, [reloadSavedArticles]);

  const ensureMarketsLoaded = useCallback(() => {
    setMarketsSnapshot((prev) => {
      if (prev?.loaded) return prev;
      return {
        markets: GLOBAL_MARKETS,
        movers: countMarketMovers(),
        session: getGlobalMarketStatus(),
        loaded: true,
      };
    });
  }, []);

  useEffect(() => {
    setReady(true);
    ensureMarketsLoaded();
    const region = loadPreferredRegion();
    const currency = loadPreferredCurrency();
    setPreferredRegionState(region);
    setPreferredCurrencyState(currency);
    setActiveDisplayCurrency(currency);
    setHiddenSources(loadHiddenSources());
    setFollowedTickers(loadFollowedTickers());
    if (isOnboardingComplete()) {
      setFollowedMarketsState(loadFollowedMarkets());
      setSectorInterestsState(loadSectorInterests());
      setOnboardingComplete(true);
    }
  }, [ensureMarketsLoaded]);

  const syncAppUser = useCallback(
    async (userId: string | null) => {
      if (!userId) {
        syncInFlightRef.current = null;
        appUserIdRef.current = null;
        setAppUserId(null);
        const complete = isOnboardingComplete();
        setOnboardingComplete(complete);
        if (complete) {
          setFollowedMarketsState(loadFollowedMarkets());
          setSectorInterestsState(loadSectorInterests());
        } else {
          setFollowedMarketsState([]);
          setSectorInterestsState([]);
        }
        setSavedArticles([]);
        watchlistLoadedRef.current = false;
        setWatchlistLoaded(false);
        setStoriesRead(0);
        setLikedArticlesCount(0);
        setLikedArticleIds(new Set());
        return;
      }

      // A second call for the same userId while the first is still
      // in-flight (e.g. two auth events firing back-to-back) just rides
      // along on the first call's promise instead of re-fetching.
      if (syncInFlightRef.current?.userId === userId) {
        await syncInFlightRef.current.promise;
        return;
      }

      // Read + update the refs synchronously (not just via the mirroring
      // effects above) so a second syncAppUser call fired back-to-back with
      // the same userId — before this call's state updates have committed
      // and re-rendered — still sees an accurate "already synced" gate.
      const alreadySynced =
        appUserIdRef.current === userId && watchlistLoadedRef.current;
      appUserIdRef.current = userId;
      setAppUserId(userId);

      try {
        const complete = isOnboardingComplete(userId);
        setOnboardingComplete(complete);
        if (complete) {
          markOnboardingComplete(userId);
          setFollowedMarketsState(loadFollowedMarkets());
          setSectorInterestsState(loadSectorInterests());
        } else {
          setFollowedMarketsState([]);
          setSectorInterestsState([]);
        }
      } catch {
        setOnboardingComplete(false);
      }

      if (alreadySynced) return;

      const runSync = async () => {
        const articles = await fetchSavedArticles(userId);
        setSavedArticles(articles);
        watchlistLoadedRef.current = true;
        setWatchlistLoaded(true);

        let stories = await fetchUserStoriesRead(userId);
        try {
          const legacy = localStorage.getItem("pocket-stories-read");
          const legacyCount = legacy ? parseInt(legacy, 10) || 0 : 0;
          if (legacyCount > stories) {
            await setUserStoriesRead(userId, legacyCount);
            stories = legacyCount;
            localStorage.removeItem("pocket-stories-read");
          }
        } catch {
          /* storage blocked */
        }
        const [liked, likedIds] = await Promise.all([
          fetchUserLikedCount(userId),
          fetchUserLikedArticleIds(userId),
        ]);
        setStoriesRead(stories);
        setLikedArticlesCount(liked);
        setLikedArticleIds(likedIds);

        // One-time baseline migration — runs only on first load, then no-ops
        migrateActivityData({
          articlesRead: stories,
          savedArticles: articles,
        });
        // Capture session snapshot after all Supabase data is loaded so the
        // curator achievement (liked count) is accurate from the start.
        initSessionSnapshot({ likedArticlesCount: liked });
        grantAchievementRewards({ likedArticlesCount: liked });
      };

      const promise = runSync().finally(() => {
        if (syncInFlightRef.current?.userId === userId) {
          syncInFlightRef.current = null;
        }
      });
      syncInFlightRef.current = { userId, promise };
      await promise;
    },
    // Deliberately no appUserId/watchlistLoaded deps — this function sets
    // both, so depending on them would recreate it mid-flight and cause
    // AppGate's syncAppUser effect to re-fire before the fetches above
    // resolve, duplicating them. Current values are read via the refs.
    []
  );

  const saveArticle = useCallback(
    async (article: NewsArticle) => {
      if (!appUserId) return false;
      if (savedArticles.some((s) => s.articleId === article.id)) return true;

      // If this ticker was previously dismissed from the Watchlist, restore it
      // before the optimistic update so WatchlistPage re-renders immediately.
      restoreWatchlistTicker(resolveArticleTicker(article));

      const optimistic: SavedArticleEntry = {
        id: `optimistic-${article.id}`,
        articleId: article.id,
        articleTitle: article.headline,
        articleUrl: article.sourceUrl,
        ticker: resolveArticleTicker(article),
        savedAt: new Date().toISOString(),
      };
      setSavedArticles((prev) => [optimistic, ...prev]);
      setWatchlistLoaded(true);

      const ok = await dbSaveArticle(appUserId, article);
      if (!ok) {
        setSavedArticles((prev) =>
          prev.filter((s) => s.articleId !== article.id)
        );
      } else {
        recordActivityEvent("article_saved", article.id, {
          articleId: article.id,
        });
        trackEvent(appUserId, "article_saved", article.id);
      }
      return ok;
    },
    [appUserId, savedArticles]
  );

  const unsaveArticle = useCallback(
    async (articleId: string) => {
      if (!appUserId) return false;
      const ok = await dbUnsaveArticle(appUserId, articleId);
      if (ok) {
        setSavedArticles((prev) =>
          prev.filter((s) => s.articleId !== articleId)
        );
      }
      return ok;
    },
    [appUserId]
  );

  const isArticleSaved = useCallback(
    (articleId: string) =>
      savedArticles.some((s) => s.articleId === articleId),
    [savedArticles]
  );

  const setFollowedMarkets = useCallback((markets: MarketFilter[]) => {
    setFollowedMarketsState(markets);
    saveFollowedMarkets(markets);
  }, []);

  const toggleFollowMarket = useCallback((m: MarketFilter) => {
    setFollowedMarketsState((prev) => {
      const next = prev.includes(m)
        ? prev.filter((x) => x !== m)
        : [...prev, m];
      saveFollowedMarkets(next);
      return next;
    });
  }, []);

  const isFollowingMarket = useCallback(
    (m: MarketFilter) => followedMarkets.includes(m),
    [followedMarkets]
  );

  const toggleMarketFilter = useCallback((m: MarketFilter) => {
    setMarketFilters((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  }, []);

  const toggleSectorFilter = useCallback((s: SectorFilter) => {
    setSectorFiltersState((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }, []);

  const toggleSectorInterest = useCallback((s: SectorFilter) => {
    setSectorInterestsState((prev) => {
      const next = prev.includes(s)
        ? prev.filter((x) => x !== s)
        : [...prev, s];
      saveSectorInterests(next);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setMarketFilters([]);
    setSectorFiltersState([]);
    setSearchQuery("");
    setCountryFilter(null);
  }, []);

  const toggleHiddenSource = useCallback((source: string) => {
    setHiddenSources((prev) => {
      const next = prev.includes(source)
        ? prev.filter((s) => s !== source)
        : [...prev, source];
      saveHiddenSources(next);
      return next;
    });
  }, []);

  const isSourceHidden = useCallback(
    (source: string) => hiddenSources.includes(source),
    [hiddenSources]
  );

  const toggleFollowTicker = useCallback(
    (ticker: string) => {
      const upper = ticker.trim().toUpperCase();
      if (!upper) return;
      setFollowedTickers((prev) => {
        const wasFollowing = prev.includes(upper);
        const next = wasFollowing
          ? prev.filter((t) => t !== upper)
          : [...prev, upper];
        saveFollowedTickers(next);
        trackEvent(
          appUserId,
          wasFollowing ? "ticker_unfollowed" : "ticker_followed",
          upper
        );
        return next;
      });
    },
    [appUserId]
  );

  const isFollowingTicker = useCallback(
    (ticker: string) => followedTickers.includes(ticker.trim().toUpperCase()),
    [followedTickers]
  );

  const setPreferredRegion = useCallback((region: AppRegionId) => {
    setPreferredRegionState(region);
    savePreferredRegion(region);
    if (!loadCurrencyManualOverride()) {
      const nextCurrency = currencyForRegion(region);
      setPreferredCurrencyState(nextCurrency);
      savePreferredCurrency(nextCurrency);
      setActiveDisplayCurrency(nextCurrency);
    }
  }, []);

  const setPreferredCurrency = useCallback(
    (currency: AppCurrency, options?: { manual?: boolean }) => {
      setPreferredCurrencyState(currency);
      savePreferredCurrency(currency);
      saveCurrencyManualOverride(options?.manual !== false);
      setActiveDisplayCurrency(currency);
    },
    []
  );

  const completeOnboarding = useCallback(
    (
      markets: MarketFilter[],
      sectors: SectorFilter[],
      region: AppRegionId,
      currency?: AppCurrency
    ) => {
      const nextCurrency = currency ?? currencyForRegion(region);
      setFollowedMarkets(markets);
      setSectorInterestsState(sectors);
      saveSectorInterests(sectors);
      setPreferredRegionState(region);
      savePreferredRegion(region);
      setPreferredCurrencyState(nextCurrency);
      savePreferredCurrency(nextCurrency);
      saveCurrencyManualOverride(false);
      setActiveDisplayCurrency(nextCurrency);
      setOnboardingComplete(true);
      try {
        markOnboardingComplete(appUserId ?? undefined);
      } catch {
        /* storage blocked */
      }
    },
    [setFollowedMarkets, appUserId]
  );

  const setFeedIndex = useCallback((index: number) => {
    setFeedIndexState(Math.max(0, index));
  }, []);

  const resetFeedIndex = useCallback(() => {
    setFeedIndexState(0);
  }, []);

  const requestFeedJump = useCallback((articleId: string) => {
    setFeedJumpArticleId(articleId);
  }, []);

  const clearFeedJump = useCallback(() => {
    setFeedJumpArticleId(null);
  }, []);

  const requestCompanyPanel = useCallback(
    (ticker: string, returnTab?: NavTab) => {
      const upper = ticker.trim().toUpperCase();
      if (!upper) return;
      setCompanyPanelTicker(upper);
      if (returnTab !== undefined) {
        setCompanyPanelReturnTab(returnTab);
      }
    },
    []
  );

  const clearCompanyPanelRequest = useCallback(() => {
    setCompanyPanelTicker(null);
  }, []);

  const clearCompanyPanelReturnTab = useCallback(() => {
    setCompanyPanelReturnTab(null);
  }, []);

  // incrementStoriesRead fires on every feed scroll (it's an impression
  // counter, not a "genuinely read" tracker — see getUniqueArticlesOpened
  // in progression.ts for that). Previously this called
  // incrementUserStoriesRead() on every single call, which did a Supabase
  // SELECT followed by an UPSERT (two round trips) per scroll — a fast
  // scroll session could fire dozens of these per minute, and concurrent
  // calls could even race and lose increments (read-modify-write with no
  // locking). Local state still updates instantly for UI responsiveness;
  // the Supabase write is now debounced to one UPSERT (no preceding
  // SELECT needed — we already know the target value locally) a couple of
  // seconds after scrolling settles.
  const storiesReadSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const incrementStoriesRead = useCallback(() => {
    setStoriesRead((n) => {
      const next = n + 1;
      if (appUserId) {
        if (storiesReadSyncTimer.current) {
          clearTimeout(storiesReadSyncTimer.current);
        }
        storiesReadSyncTimer.current = setTimeout(() => {
          storiesReadSyncTimer.current = null;
          void setUserStoriesRead(appUserId, next);
        }, 2000);
      }
      return next;
    });
  }, [appUserId]);

  const value = useMemo(
    () => ({
      ready,
      savedArticles,
      saveArticle,
      unsaveArticle,
      isArticleSaved,
      reloadSavedArticles,
      watchlistLoaded,
      ensureWatchlistLoaded,
      marketsSnapshot,
      ensureMarketsLoaded,
      followedMarkets,
      toggleFollowMarket,
      isFollowingMarket,
      setFollowedMarkets,
      sectorInterests,
      toggleSectorInterest,
      preferredRegion,
      preferredCurrency,
      setPreferredRegion,
      setPreferredCurrency,
      marketFilters,
      setMarketFilters,
      toggleMarketFilter,
      sectorFilters,
      toggleSectorFilter,
      clearFilters,
      searchQuery,
      setSearchQuery,
      countryFilter,
      setCountryFilter,
      hiddenSources,
      toggleHiddenSource,
      isSourceHidden,
      followedTickers,
      toggleFollowTicker,
      isFollowingTicker,
      storiesRead,
      likedArticlesCount,
      likedArticleIds,
      setLikedArticleIds,
      likeCounts,
      ensureLikeCountsLoaded,
      feedIndex,
      setFeedIndex,
      resetFeedIndex,
      feedJumpArticleId,
      requestFeedJump,
      clearFeedJump,
      companyPanelTicker,
      companyPanelReturnTab,
      requestCompanyPanel,
      clearCompanyPanelRequest,
      clearCompanyPanelReturnTab,
      incrementStoriesRead,
      reloadProfileStats,
      onboardingComplete,
      completeOnboarding,
      syncAppUser,
    }),
    [
      ready,
      savedArticles,
      saveArticle,
      unsaveArticle,
      isArticleSaved,
      reloadSavedArticles,
      watchlistLoaded,
      ensureWatchlistLoaded,
      marketsSnapshot,
      ensureMarketsLoaded,
      followedMarkets,
      toggleFollowMarket,
      isFollowingMarket,
      setFollowedMarkets,
      sectorInterests,
      toggleSectorInterest,
      preferredRegion,
      preferredCurrency,
      setPreferredRegion,
      setPreferredCurrency,
      marketFilters,
      toggleMarketFilter,
      sectorFilters,
      toggleSectorFilter,
      clearFilters,
      searchQuery,
      countryFilter,
      hiddenSources,
      toggleHiddenSource,
      isSourceHidden,
      followedTickers,
      toggleFollowTicker,
      isFollowingTicker,
      storiesRead,
      likedArticlesCount,
      likedArticleIds,
      likeCounts,
      ensureLikeCountsLoaded,
      feedIndex,
      setFeedIndex,
      resetFeedIndex,
      feedJumpArticleId,
      requestFeedJump,
      clearFeedJump,
      companyPanelTicker,
      companyPanelReturnTab,
      requestCompanyPanel,
      clearCompanyPanelRequest,
      clearCompanyPanelReturnTab,
      incrementStoriesRead,
      reloadProfileStats,
      onboardingComplete,
      completeOnboarding,
      syncAppUser,
    ]
  );

  return (
    <AppContext.Provider value={value}>{children}</AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
