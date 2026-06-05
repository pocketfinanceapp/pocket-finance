"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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
import type { NewsArticle, SavedArticleEntry } from "@/lib/types";

interface AppContextValue {
  ready: boolean;
  savedArticles: SavedArticleEntry[];
  saveArticle: (article: NewsArticle) => Promise<boolean>;
  unsaveArticle: (articleId: string) => Promise<boolean>;
  isArticleSaved: (articleId: string) => boolean;
  reloadSavedArticles: () => Promise<void>;
  followedMarkets: MarketFilter[];
  toggleFollowMarket: (m: MarketFilter) => void;
  isFollowingMarket: (m: MarketFilter) => boolean;
  setFollowedMarkets: (markets: MarketFilter[]) => void;
  sectorInterests: SectorFilter[];
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
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [appUserId, setAppUserId] = useState<string | null>(null);

  useEffect(() => {
    setReady(true);
  }, []);

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

  const reloadSavedArticles = useCallback(async () => {
    if (!appUserId) {
      setSavedArticles([]);
      return;
    }
    const articles = await fetchSavedArticles(appUserId);
    setSavedArticles(articles);
  }, [appUserId]);

  const syncAppUser = useCallback(
    async (userId: string | null) => {
      setAppUserId(userId);
      if (!userId) {
        setOnboardingComplete(false);
        setSavedArticles([]);
        setStoriesRead(0);
        setLikedArticlesCount(0);
        return;
      }
      try {
        const complete = isOnboardingComplete(userId);
        setOnboardingComplete(complete);
        if (complete) {
          setFollowedMarketsState(loadFollowedMarkets());
          setSectorInterestsState(loadSectorInterests());
        } else {
          setFollowedMarketsState([]);
          setSectorInterestsState([]);
        }
      } catch {
        setOnboardingComplete(false);
      }
      const articles = await fetchSavedArticles(userId);
      setSavedArticles(articles);

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
    },
    []
  );

  const saveArticle = useCallback(
    async (article: NewsArticle) => {
      if (!appUserId) return false;
      if (savedArticles.some((s) => s.articleId === article.id)) return true;

      const ok = await dbSaveArticle(appUserId, article);
      if (ok) {
        const articles = await fetchSavedArticles(appUserId);
        setSavedArticles(articles);
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
      followedMarkets,
      toggleFollowMarket,
      isFollowingMarket,
      setFollowedMarkets,
      sectorInterests,
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
      followedMarkets,
      toggleFollowMarket,
      isFollowingMarket,
      setFollowedMarkets,
      sectorInterests,
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
