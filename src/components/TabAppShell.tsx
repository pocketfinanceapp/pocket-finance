"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { NavigationProvider } from "@/context/NavigationContext";
import type { MarketFilter } from "@/lib/filters";
import type { NewsArticle } from "@/lib/types";
import { FeedErrorBoundary } from "./FeedErrorBoundary";
import { MarketsPage } from "./MarketsPage";
import { MobilePageShell } from "./MobilePageShell";
import { NewsFeed } from "./NewsFeed";
import { WatchlistPage } from "./WatchlistPage";
import { useNavigation } from "@/context/NavigationContext";
import { recordAppVisit } from "@/lib/profileStorage";

interface TabAppShellProps {
  initialArticles: NewsArticle[];
}

function TabPanels({ initialArticles }: TabAppShellProps) {
  const { activeTab, navTab, navigate } = useNavigation();
  const { setMarketFilters, ensureMarketsLoaded, ensureWatchlistLoaded } =
    useApp();
  const [fadeKey, setFadeKey] = useState(0);

  useEffect(() => {
    ensureMarketsLoaded();
    ensureWatchlistLoaded();
    recordAppVisit();
  }, [ensureMarketsLoaded, ensureWatchlistLoaded]);

  useEffect(() => {
    setFadeKey((k) => k + 1);
  }, [activeTab]);

  const openMarketFeed = useCallback(
    (market: MarketFilter) => {
      setMarketFilters([market]);
      navigate("home");
    },
    [setMarketFilters, navigate]
  );

  return (
    <MobilePageShell activeTab={navTab}>
      <div className="relative h-full w-full">
        <TabPanel active={activeTab === "home"} fadeKey={fadeKey}>
          <FeedErrorBoundary>
            <NewsFeed
              initialArticles={initialArticles}
              embedded
              showAddToHomeBanner={activeTab === "home"}
            />
          </FeedErrorBoundary>
        </TabPanel>

        <TabPanel active={activeTab === "markets"} fadeKey={fadeKey}>
          <MarketsPage onOpenMarketFeed={openMarketFeed} />
        </TabPanel>

        <TabPanel active={activeTab === "watchlist"} fadeKey={fadeKey}>
          <WatchlistPage />
        </TabPanel>
      </div>
    </MobilePageShell>
  );
}

function TabPanel({
  active,
  fadeKey,
  children,
}: {
  active: boolean;
  fadeKey: number;
  children: React.ReactNode;
}) {
  return (
    <div
      key={active ? `active-${fadeKey}` : undefined}
      className={`tab-panel absolute inset-0 h-full w-full ${
        active ? "tab-panel-active" : "tab-panel-hidden"
      }`}
      aria-hidden={!active}
    >
      {children}
    </div>
  );
}

export function TabAppShell({ initialArticles }: TabAppShellProps) {
  const searchParams = useSearchParams();
  const profileOpen = searchParams.get("tab") === "profile";

  return (
    <NavigationProvider profileOpen={profileOpen}>
      <TabPanels initialArticles={initialArticles} />
    </NavigationProvider>
  );
}
