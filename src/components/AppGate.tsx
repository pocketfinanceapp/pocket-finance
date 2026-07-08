"use client";

import { useEffect, useState } from "react";
import { AppBootSplash } from "@/components/AppBootSplash";
import { AuthScreen } from "@/components/AuthScreen";
import { ResetPasswordScreen } from "@/components/ResetPasswordScreen";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { isOnboardingComplete } from "@/lib/onboarding";
import { captureReferralFromUrl } from "@/lib/referral";

const SPLASH_MAX_MS = 2500;

/** Auth + onboarding gate — app shell stays mounted; overlays block interaction */
export function AppGate({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, isGuest, passwordRecoveryPending } =
    useAuth();
  const { ready, onboardingComplete, syncAppUser } = useApp();
  const [splashElapsed, setSplashElapsed] = useState(false);

  useEffect(() => {
    captureReferralFromUrl();
  }, []);

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
    onboardingComplete || (user ? isOnboardingComplete(user.id) : false);
  const showOnboarding = !showSplash && Boolean(user) && !onboardingDone && !passwordRecoveryPending;
  const appInteractive =
    !showSplash && !showAuth && !showOnboarding && !passwordRecoveryPending;

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

      {showAuth && <AuthScreen />}
      {passwordRecoveryPending && <ResetPasswordScreen />}
      {showOnboarding && <OnboardingFlow />}
    </>
  );
}
