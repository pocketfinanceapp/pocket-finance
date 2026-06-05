"use client";

import { AppBootSplash } from "@/components/AppBootSplash";
import { FeedErrorBoundary } from "@/components/FeedErrorBoundary";
import { NewsFeed } from "@/components/NewsFeed";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useApp } from "@/context/AppContext";
import type { NewsArticle } from "@/lib/types";

interface AppShellProps {
  initialArticles: NewsArticle[];
}

export function AppShell({ initialArticles }: AppShellProps) {
  const { ready, onboardingComplete } = useApp();

  if (!ready) {
    return <AppBootSplash />;
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
