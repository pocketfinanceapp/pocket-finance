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
import { useNavigation } from "@/context/NavigationContext";

interface TabAppShellProps {
  initialArticles: NewsArticle[];
}

function TabPanels({ initialArticles }: TabAppShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeTab, navTab, navigate, registerCreateHandler } = useNavigation();
  const { setMarketFilters, ensureMarketsLoaded, ensureWatchlistLoaded } =
    useApp();
  const [fadeKey, setFadeKey] = useState(0);

  useEffect(() => {
    ensureMarketsLoaded();
    ensureWatchlistLoaded();
  }, [ensureMarketsLoaded, ensureWatchlistLoaded]);

  useEffect(() => {
    setFadeKey((k) => k + 1);
  }, [activeTab]);

  useEffect(() => {
    if (searchParams.get("sheet") === "create" && activeTab !== "home") {
      router.replace("/?sheet=create", { scroll: false });
    }
  }, [searchParams, activeTab, router]);

  const openMarketFeed = useCallback(
    (market: MarketFilter) => {
      setMarketFilters([market]);
      navigate("home");
    },
    [setMarketFilters, navigate]
  );

  const handleRegisterCreate = useCallback(
    (openCreate: () => void) => {
      registerCreateHandler(openCreate);
      return () => registerCreateHandler(null);
    },
    [registerCreateHandler]
  );

  return (
    <MobilePageShell
      activeTab={navTab}
      onCreate={() => navigate("create")}
    >
      <div className="relative h-full w-full">
        <TabPanel active={activeTab === "home"} fadeKey={fadeKey}>
          <FeedErrorBoundary>
            <NewsFeed
              initialArticles={initialArticles}
              embedded
              onRegisterCreate={handleRegisterCreate}
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
