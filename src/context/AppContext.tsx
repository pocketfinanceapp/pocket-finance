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
  entryFromTicker,
  loadWatchlist,
  saveWatchlist,
} from "@/lib/watchlist";
import type { WatchlistEntry } from "@/lib/types";

interface AppContextValue {
  /** False until localStorage has been read on the client */
  ready: boolean;
  watchlist: WatchlistEntry[];
  addToWatchlist: (ticker: string) => void;
  removeFromWatchlist: (ticker: string) => void;
  isInWatchlist: (ticker: string) => boolean;
  followedMarkets: MarketFilter[];
  toggleFollowMarket: (m: MarketFilter) => void;
  isFollowingMarket: (m: MarketFilter) => boolean;
  setFollowedMarkets: (markets: MarketFilter[]) => void;
  marketFilters: MarketFilter[];
  setMarketFilters: (filters: MarketFilter[]) => void;
  toggleMarketFilter: (m: MarketFilter) => void;
  sectorFilters: SectorFilter[];
  setSectorFilters: (sectors: SectorFilter[]) => void;
  toggleSectorFilter: (s: SectorFilter) => void;
  clearFilters: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  storiesRead: number;
  incrementStoriesRead: () => void;
  onboardingComplete: boolean;
  completeOnboarding: (
    markets: MarketFilter[],
    sectors: SectorFilter[]
  ) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [followedMarkets, setFollowedMarketsState] = useState<MarketFilter[]>(
    []
  );
  const [marketFilters, setMarketFilters] = useState<MarketFilter[]>([]);
  const [sectorFilters, setSectorFiltersState] = useState<SectorFilter[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [storiesRead, setStoriesRead] = useState(0);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    try {
      setWatchlist(loadWatchlist());
      const complete = isOnboardingComplete();
      setOnboardingComplete(complete);
      if (complete) {
        setFollowedMarketsState(loadFollowedMarkets());
        setSectorFiltersState(loadSectorInterests());
      }
      const saved = localStorage.getItem("pocket-stories-read");
      if (saved) setStoriesRead(parseInt(saved, 10) || 0);
    } catch {
      setOnboardingComplete(false);
    } finally {
      setReady(true);
    }
  }, []);

  const setFollowedMarkets = useCallback((markets: MarketFilter[]) => {
    setFollowedMarketsState(markets);
    saveFollowedMarkets(markets);
  }, []);

  const setSectorFilters = useCallback((sectors: SectorFilter[]) => {
    setSectorFiltersState(sectors);
    saveSectorInterests(sectors);
  }, []);

  const addToWatchlist = useCallback((ticker: string) => {
    setWatchlist((prev) => {
      if (prev.some((e) => e.ticker === ticker)) return prev;
      const next = [...prev, entryFromTicker(ticker)];
      saveWatchlist(next);
      return next;
    });
  }, []);

  const removeFromWatchlist = useCallback((ticker: string) => {
    setWatchlist((prev) => {
      const next = prev.filter((e) => e.ticker !== ticker);
      saveWatchlist(next);
      return next;
    });
  }, []);

  const isInWatchlist = useCallback(
    (ticker: string) => watchlist.some((e) => e.ticker === ticker),
    [watchlist]
  );

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
    setSectorFiltersState((prev) => {
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
    saveSectorInterests([]);
    setSearchQuery("");
  }, []);

  const completeOnboarding = useCallback(
    (markets: MarketFilter[], sectors: SectorFilter[]) => {
      setFollowedMarkets(markets);
      setSectorFilters(sectors);
      setOnboardingComplete(true);
      try {
        markOnboardingComplete();
      } catch {
        /* storage blocked — in-memory state still applies this session */
      }
    },
    [setFollowedMarkets, setSectorFilters]
  );

  const incrementStoriesRead = useCallback(() => {
    setStoriesRead((n) => {
      const next = n + 1;
      try {
        localStorage.setItem("pocket-stories-read", String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      ready,
      watchlist,
      addToWatchlist,
      removeFromWatchlist,
      isInWatchlist,
      followedMarkets,
      toggleFollowMarket,
      isFollowingMarket,
      setFollowedMarkets,
      marketFilters,
      setMarketFilters,
      toggleMarketFilter,
      sectorFilters,
      setSectorFilters,
      toggleSectorFilter,
      clearFilters,
      searchQuery,
      setSearchQuery,
      storiesRead,
      incrementStoriesRead,
      onboardingComplete,
      completeOnboarding,
    }),
    [
      ready,
      watchlist,
      addToWatchlist,
      removeFromWatchlist,
      isInWatchlist,
      followedMarkets,
      toggleFollowMarket,
      isFollowingMarket,
      setFollowedMarkets,
      marketFilters,
      toggleMarketFilter,
      sectorFilters,
      setSectorFilters,
      toggleSectorFilter,
      clearFilters,
      searchQuery,
      storiesRead,
      incrementStoriesRead,
      onboardingComplete,
      completeOnboarding,
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
