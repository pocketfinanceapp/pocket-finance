"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { NavigationProvider } from "@/context/NavigationContext";
import { isOnboardingComplete } from "@/lib/onboarding";
import type { NewsArticle } from "@/lib/types";
import { FeedErrorBoundary } from "./FeedErrorBoundary";
import { MobilePageShell } from "./MobilePageShell";
import { NewsFeed } from "./NewsFeed";
import { ProfilePage } from "./ProfilePage";
import { SavedPage } from "./SavedPage";
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
  const { ensureWatchlistLoaded, onboardingComplete } = useApp();
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [profileSubPageOpen, setProfileSubPageOpen] = useState(false);

  useEffect(() => {
    ensureWatchlistLoaded();
    recordAppVisit();
  }, [ensureWatchlistLoaded]);

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
    (activeTab === "profile" && profileSubPageOpen) ||
    showAuth ||
    passwordRecoveryPending ||
    showOnboarding;

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

        <TabPanel active={activeTab === "saved"}>
          <SavedPage catalogArticles={initialArticles} />
        </TabPanel>

        <TabPanel active={activeTab === "profile"}>
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
