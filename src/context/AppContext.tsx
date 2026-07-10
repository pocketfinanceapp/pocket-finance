"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
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
  fetchSavedArticles,
  fetchUserLikedCount,
  fetchUserStoriesRead,
  incrementUserStoriesRead,
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
  marketFilters: MarketFilter[];
  setMarketFilters: (filters: MarketFilter[]) => void;
  toggleMarketFilter: (m: MarketFilter) => void;
  sectorFilters: SectorFilter[];
  toggleSectorFilter: (s: SectorFilter) => void;
  clearFilters: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  storiesRead: number;
  likedArticlesCount: number;
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
    sectors: SectorFilter[]
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
  const [marketFilters, setMarketFilters] = useState<MarketFilter[]>([]);
  const [sectorFilters, setSectorFiltersState] = useState<SectorFilter[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [storiesRead, setStoriesRead] = useState(0);
  const [likedArticlesCount, setLikedArticlesCount] = useState(0);
  const [feedIndex, setFeedIndexState] = useState(0);
  const [feedJumpArticleId, setFeedJumpArticleId] = useState<string | null>(
    null
  );
  const [companyPanelTicker, setCompanyPanelTicker] = useState<string | null>(
    null
  );
  const [companyPanelReturnTab, setCompanyPanelReturnTab] =
    useState<NavTab | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(() => {
    if (typeof window === "undefined") return false;
    return isOnboardingComplete();
  });
  const [appUserId, setAppUserId] = useState<string | null>(null);
  const [watchlistLoaded, setWatchlistLoaded] = useState(false);
  const [marketsSnapshot, setMarketsSnapshot] =
    useState<MarketsSnapshot | null>(null);

  const reloadProfileStats = useCallback(async () => {
    if (!appUserId) {
      setStoriesRead(0);
      setLikedArticlesCount(0);
      return;
    }
    const [stories, liked] = await Promise.all([
      fetchUserStoriesRead(appUserId),
      fetchUserLikedCount(appUserId),
    ]);
    setStoriesRead(stories);
    setLikedArticlesCount(liked);
  }, [appUserId]);

  const reloadSavedArticles = useCallback(
    async (force = false) => {
      if (!appUserId) {
        setSavedArticles([]);
        setWatchlistLoaded(false);
        return;
      }
      if (!force && watchlistLoaded) return;
      const articles = await fetchSavedArticles(appUserId);
      setSavedArticles(articles);
      setWatchlistLoaded(true);
    },
    [appUserId, watchlistLoaded]
  );

  const ensureWatchlistLoaded = useCallback(() => {
    if (!appUserId || watchlistLoaded) return;
    void reloadSavedArticles(true);
  }, [appUserId, watchlistLoaded, reloadSavedArticles]);

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
    if (isOnboardingComplete()) {
      setFollowedMarketsState(loadFollowedMarkets());
      setSectorInterestsState(loadSectorInterests());
      setOnboardingComplete(true);
    }
  }, [ensureMarketsLoaded]);

  const syncAppUser = useCallback(
    async (userId: string | null) => {
      if (!userId) {
        setAppUserId(null);
        setOnboardingComplete(false);
        setSavedArticles([]);
        setWatchlistLoaded(false);
        setStoriesRead(0);
        setLikedArticlesCount(0);
        return;
      }

      const alreadySynced = appUserId === userId && watchlistLoaded;
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

      const articles = await fetchSavedArticles(userId);
      setSavedArticles(articles);
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
      const liked = await fetchUserLikedCount(userId);
      setStoriesRead(stories);
      setLikedArticlesCount(liked);

      // One-time baseline migration — runs only on first load, then no-ops
      migrateActivityData({
        articlesRead: stories,
        savedArticles: articles,
      });
      // Capture session snapshot after all Supabase data is loaded so the
      // curator achievement (liked count) is accurate from the start.
      initSessionSnapshot({ likedArticlesCount: liked });
      grantAchievementRewards({ likedArticlesCount: liked });
    },
    [appUserId, watchlistLoaded]
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
  }, []);

  const completeOnboarding = useCallback(
    (markets: MarketFilter[], sectors: SectorFilter[]) => {
      setFollowedMarkets(markets);
      setSectorInterestsState(sectors);
      saveSectorInterests(sectors);
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
      setCompanyPanelReturnTab(returnTab ?? null);
    },
    []
  );

  const clearCompanyPanelRequest = useCallback(() => {
    setCompanyPanelTicker(null);
  }, []);

  const clearCompanyPanelReturnTab = useCallback(() => {
    setCompanyPanelReturnTab(null);
  }, []);

  const incrementStoriesRead = useCallback(() => {
    setStoriesRead((n) => n + 1);
    if (!appUserId) return;
    void incrementUserStoriesRead(appUserId).then((next) => {
      if (next !== null) setStoriesRead(next);
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
      marketFilters,
      setMarketFilters,
      toggleMarketFilter,
      sectorFilters,
      toggleSectorFilter,
      clearFilters,
      searchQuery,
      setSearchQuery,
      storiesRead,
      likedArticlesCount,
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
      marketFilters,
      toggleMarketFilter,
      sectorFilters,
      toggleSectorFilter,
      clearFilters,
      searchQuery,
      storiesRead,
      likedArticlesCount,
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
