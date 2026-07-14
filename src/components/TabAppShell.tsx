"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { NavigationProvider } from "@/context/NavigationContext";
import type { MarketFilter } from "@/lib/filters";
import { isOnboardingComplete } from "@/lib/onboarding";
import type { NewsArticle } from "@/lib/types";
import { FeedErrorBoundary } from "./FeedErrorBoundary";
import { MarketsPage } from "./MarketsPage";
import { MobilePageShell } from "./MobilePageShell";
import { NewsFeed } from "./NewsFeed";
import { DiscoverPage } from "./DiscoverPage";
import { WatchlistPage } from "./WatchlistPage";
import { ProfilePage } from "./ProfilePage";
import { GlobalCompanyPanel } from "./GlobalCompanyPanel";
import { useNavigation } from "@/context/NavigationContext";
import { recordAppVisit } from "@/lib/profileStorage";
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
  const { user, isGuest, passwordRecoveryPending } = useAuth();
  const { setMarketFilters, ensureWatchlistLoaded, onboardingComplete, companyPanelTicker, requestCompanyPanel } =
    useApp();
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [profileSubPageOpen, setProfileSubPageOpen] = useState(false);

  useEffect(() => {
    ensureWatchlistLoaded();
    recordAppVisit();
  }, [ensureWatchlistLoaded]);

  const openMarketFeed = useCallback(
    (market: MarketFilter) => {
      setMarketFilters([market]);
      navigate("home");
    },
    [setMarketFilters, navigate]
  );

  const showAuth = !user && !isGuest;
  const onboardingDone =
    onboardingComplete ||
    (user ? isOnboardingComplete(user.id) : isOnboardingComplete());
  const showOnboarding =
    (Boolean(user) || isGuest) &&
    !onboardingDone &&
    !passwordRecoveryPending;

  const hideBottomNav =
    sidePanelOpen ||
    Boolean(companyPanelTicker) ||
    (activeTab === "profile" && profileSubPageOpen) ||
    showAuth ||
    passwordRecoveryPending ||
    showOnboarding;

  const openCompanyFromTab = useCallback(
    (ticker: string) => {
      requestCompanyPanel(ticker, activeTab);
    },
    [requestCompanyPanel, activeTab]
  );

  return (
    <MobilePageShell activeTab={navTab} hideBottomNav={hideBottomNav}>
      <div className="app-themed pf-theme-scope relative h-full w-full">
        <TabPanel active={activeTab === "home"}>
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

        <TabPanel active={activeTab === "markets"}>
          <MarketsPage
            onOpenMarketFeed={openMarketFeed}
            onOpenCompany={openCompanyFromTab}
          />
        </TabPanel>

        <TabPanel active={activeTab === "discover"}>
          <DiscoverPage
            articles={initialArticles}
            onOpenCompany={openCompanyFromTab}
            onOpenMarketFeed={openMarketFeed}
          />
        </TabPanel>

        <TabPanel active={activeTab === "watchlist"}>
          <WatchlistPage articles={initialArticles} />
        </TabPanel>

        <TabPanel active={activeTab === "profile"}>
          <ProfilePage
            onClose={() => navigate("home")}
            onSubPageChange={setProfileSubPageOpen}
          />
        </TabPanel>

        <GlobalCompanyPanel catalogArticles={initialArticles} />
      </div>
    </MobilePageShell>
  );
}

function TabPanel({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
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
