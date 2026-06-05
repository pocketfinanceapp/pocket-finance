"use client";

import { useEffect } from "react";
import { AppBootSplash } from "@/components/AppBootSplash";
import { AuthScreen } from "@/components/AuthScreen";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";

/** Auth + onboarding gate — renders children only when the user can use the app */
export function AppGate({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { ready, onboardingComplete, syncAppUser } = useApp();

  useEffect(() => {
    if (!authLoading) {
      void syncAppUser(user?.id ?? null);
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

  return <>{children}</>;
}
