"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppBootSplash } from "@/components/AppBootSplash";
import { AuthScreen } from "@/components/AuthScreen";
import { ForceDarkTheme } from "@/components/ForceDarkTheme";
import { ResetPasswordScreen } from "@/components/ResetPasswordScreen";
import { AppProviders } from "@/components/AppProviders";
import { useAuth } from "@/context/AuthContext";

function LoginPageContent() {
  const { user, loading, isGuest, passwordRecoveryPending } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (passwordRecoveryPending) return;
    if (user || isGuest) {
      router.replace("/home");
    }
  }, [user, loading, isGuest, passwordRecoveryPending, router]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100]">
        <AppBootSplash forceDark />
      </div>
    );
  }

  if (!passwordRecoveryPending && (user || isGuest)) {
    return null;
  }

  return (
    <ForceDarkTheme>
      {passwordRecoveryPending ? <ResetPasswordScreen /> : <AuthScreen />}
    </ForceDarkTheme>
  );
}

export default function LoginPage() {
  return (
    <main className="app-shell-height bg-pocket-bg">
      <AppProviders>
        <LoginPageContent />
      </AppProviders>
    </main>
  );
}
