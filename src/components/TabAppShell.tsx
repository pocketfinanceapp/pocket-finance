"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { NavigationProvider } from "@/context/NavigationContext";
import type { MarketFilter } from "@/lib/filters";
import type { NewsArticle } from "@/lib/types";
import { FeedErrorBoundary } from "./FeedErrorBoundary";
import { MarketsPage } from "./MarketsPage";
import { MobilePageShell } from "./MobilePageShell";
import { NewsFeed } from "./NewsFeed";
import { WatchlistPage } from "./WatchlistPage";
import { ProfilePage } from "./ProfilePage";
import { BrowsePage } from "./BrowsePage";
import { useNavigation } from "@/context/NavigationContext";
import { recordAppVisit } from "@/lib/profileStorage";
import { initSessionSnapshot } from "@/lib/progression";
import { appPath } from "@/lib/appPaths";

interface TabAppShellProps {
  initialArticles: NewsArticle[];
  initialTrendingArticles: NewsArticle[];
}

function TabPanels({
  initialArticles,
  initialTrendingArticles,
}: TabAppShellProps) {
  const { activeTab, navTab, navigate } = useNavigation();
  const { setMarketFilters, ensureMarketsLoaded, ensureWatchlistLoaded } =
    useApp();
  const [fadeKey, setFadeKey] = useState(0);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [profileSubPageOpen, setProfileSubPageOpen] = useState(false);

  useEffect(() => {
    ensureMarketsLoaded();
    ensureWatchlistLoaded();
    recordAppVisit();
    initSessionSnapshot();
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

  const hideBottomNav =
    sidePanelOpen || (activeTab === "profile" && profileSubPageOpen);

  return (
    <MobilePageShell activeTab={navTab} hideBottomNav={hideBottomNav}>
      <div className="relative h-full w-full">
        <TabPanel active={activeTab === "home"} fadeKey={fadeKey}>
          <FeedErrorBoundary>
            <NewsFeed
              initialArticles={initialArticles}
              initialTrendingArticles={initialTrendingArticles}
              embedded
              showAddToHomeBanner={activeTab === "home"}
              onSidePanelChange={setSidePanelOpen}
            />
          </FeedErrorBoundary>
        </TabPanel>

        <TabPanel active={activeTab === "markets"} fadeKey={fadeKey}>
          <MarketsPage
            onOpenMarketFeed={openMarketFeed}
            articles={initialArticles}
          />
        </TabPanel>

        <TabPanel active={activeTab === "browse"} fadeKey={fadeKey}>
          <BrowsePage articles={initialArticles} />
        </TabPanel>

        <TabPanel active={activeTab === "watchlist"} fadeKey={fadeKey}>
          <WatchlistPage />
        </TabPanel>

        <TabPanel active={activeTab === "profile"} fadeKey={fadeKey}>
          <ProfilePage
            onClose={() => navigate("home")}
            onSubPageChange={setProfileSubPageOpen}
          />
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

export function TabAppShell({
  initialArticles,
  initialTrendingArticles,
}: TabAppShellProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("tab") === "profile") {
      router.replace(appPath("profile"), { scroll: false });
    }
  }, [searchParams, router]);

  return (
    <NavigationProvider>
      <TabPanels
        initialArticles={initialArticles}
        initialTrendingArticles={initialTrendingArticles}
      />
    </NavigationProvider>
  );
}
