"use client";

import { useEffect, useState } from "react";
import { AppBootSplash } from "@/components/AppBootSplash";
import { AuthScreen } from "@/components/AuthScreen";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";

const SPLASH_MAX_MS = 2500;

/** Auth + onboarding gate — renders children only when the user can use the app */
export function AppGate({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, isGuest } = useAuth();
  const { ready, onboardingComplete, syncAppUser } = useApp();
  const [splashElapsed, setSplashElapsed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSplashElapsed(true), SPLASH_MAX_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!authLoading) {
      void syncAppUser(user?.id ?? null);
    }
  }, [user?.id, authLoading, syncAppUser]);

  const showSplash = !splashElapsed && (authLoading || !ready);

  if (showSplash) {
    return <AppBootSplash />;
  }

  if (!user && !isGuest) {
    return <AuthScreen />;
  }

  if (user && !onboardingComplete) {
    return <OnboardingFlow />;
  }

  return <>{children}</>;
}
