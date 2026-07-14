"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppBootSplash } from "@/components/AppBootSplash";
import { ForceDarkTheme } from "@/components/ForceDarkTheme";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { LOGIN_PATH } from "@/lib/appPaths";
import { isOnboardingComplete } from "@/lib/onboarding";

const SPLASH_MAX_MS = 2500;

/** Auth + onboarding gate — app shell stays mounted; redirects to /login when needed */
export function AppGate({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, isGuest, passwordRecoveryPending } =
    useAuth();
  const { ready, onboardingComplete, syncAppUser } = useApp();
  const router = useRouter();
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
  const showAuth = !showSplash && !user && !isGuest;
  const onboardingDone =
    onboardingComplete ||
    (user ? isOnboardingComplete(user.id) : isOnboardingComplete());
  const showOnboarding =
    !showSplash &&
    (Boolean(user) || isGuest) &&
    !onboardingDone &&
    !passwordRecoveryPending;
  const appInteractive =
    !showSplash && !showAuth && !showOnboarding && !passwordRecoveryPending;

  useEffect(() => {
    if (showAuth) {
      router.replace(LOGIN_PATH);
    }
  }, [showAuth, router]);

  useEffect(() => {
    if (passwordRecoveryPending) {
      router.replace(`${LOGIN_PATH}?password_reset=1`);
    }
  }, [passwordRecoveryPending, router]);

  useEffect(() => {
    if (!appInteractive) return;

    const raf = requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
    });
    return () => cancelAnimationFrame(raf);
  }, [appInteractive]);

  return (
    <>
      <div className={appInteractive ? undefined : "pointer-events-none"}>
        {children}
      </div>

      {showSplash && (
        <div className="fixed inset-0 z-[110]">
          <AppBootSplash />
        </div>
      )}

      {showOnboarding && <OnboardingFlow />}
    </>
  );
}
