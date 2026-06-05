"use client";

import { useEffect } from "react";
import { AppBootSplash } from "@/components/AppBootSplash";
import { AuthScreen } from "@/components/AuthScreen";
import { FeedErrorBoundary } from "@/components/FeedErrorBoundary";
import { NewsFeed } from "@/components/NewsFeed";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import type { NewsArticle } from "@/lib/types";

interface AppShellProps {
  initialArticles: NewsArticle[];
}

export function AppShell({ initialArticles }: AppShellProps) {
  const { user, loading: authLoading } = useAuth();
  const { ready, onboardingComplete, syncAppUser } = useApp();

  useEffect(() => {
    if (!authLoading) {
      syncAppUser(user?.id ?? null);
    }
  }, [user?.id, authLoading, syncAppUser]);

  if (authLoading || !ready) {
    return <AppBootSplash />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (!onboardingComplete) {
    return <OnboardingFlow />;
  }

  return (
    <FeedErrorBoundary>
      <NewsFeed initialArticles={initialArticles} />
    </FeedErrorBoundary>
  );
}
