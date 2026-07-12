"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getEmailConfirmRedirectUrl, getPasswordResetRedirectUrl } from "@/lib/authRedirect";
import { LOGIN_PATH } from "@/lib/appPaths";
import {
  clearGuestMode,
  enableGuestMode,
  isGuestMode,
} from "@/lib/guestMode";
import { getSupabase } from "@/lib/supabase";

interface AuthResult {
  error: string | null;
  /** True when sign-up succeeded but email confirmation is required */
  needsConfirmation?: boolean;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** Shown on the login screen after email confirmation redirect */
  authBanner: string | null;
  clearAuthBanner: () => void;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<AuthResult>;
  signInWithApple: () => Promise<AuthResult>;
  updateDisplayName: (displayName: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  passwordRecoveryPending: boolean;
  clearPasswordRecovery: () => void;
  isGuest: boolean;
  continueAsGuest: () => void;
  requestSignIn: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const CONFIRMED_BANNER = "Email confirmed! You can now log in.";

function isEmailConfirmationUrl(): boolean {
  if (typeof window === "undefined") return false;
  const url = new URL(window.location.href);
  if (url.searchParams.get("email_confirmed") === "1") return true;
  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  const type = hash.get("type");
  return type === "signup" || type === "email" || type === "email_change";
}

function isPasswordRecoveryUrl(): boolean {
  if (typeof window === "undefined") return false;
  const url = new URL(window.location.href);
  if (url.searchParams.get("password_reset") === "1") return true;
  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  return hash.get("type") === "recovery";
}

function cleanPasswordRecoveryParams(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete("password_reset");
  url.hash = "";
  const search = url.searchParams.toString();
  const next = url.pathname + (search ? `?${search}` : "");
  window.history.replaceState({}, "", next);
}

function cleanConfirmationParams(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete("email_confirmed");
  url.hash = "";
  const search = url.searchParams.toString();
  const next = url.pathname + (search ? `?${search}` : "");
  window.history.replaceState({}, "", next);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authBanner, setAuthBanner] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [passwordRecoveryPending, setPasswordRecoveryPending] = useState(false);
  const handlingConfirmation = useRef(false);

  useEffect(() => {
    setIsGuest(isGuestMode());
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    let mounted = true;

    const finishLoading = () => {
      if (mounted) setLoading(false);
    };

    const authTimeout = window.setTimeout(finishLoading, 3000);

    const init = async () => {
      const confirmationRedirect = isEmailConfirmationUrl();
      const recoveryRedirect = isPasswordRecoveryUrl();
      if (confirmationRedirect) {
        handlingConfirmation.current = true;
      }

      try {
        const {
          data: { session: initial },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (confirmationRedirect) {
          if (initial) {
            await supabase.auth.signOut();
          }
          if (mounted) {
            setSession(null);
            setUser(null);
            setAuthBanner(CONFIRMED_BANNER);
            cleanConfirmationParams();
          }
          handlingConfirmation.current = false;
        } else if (recoveryRedirect && initial) {
          setSession(initial);
          setUser(initial.user);
          setPasswordRecoveryPending(true);
          clearGuestMode();
          setIsGuest(false);
        } else {
          setSession(initial);
          setUser(initial?.user ?? null);
          if (initial?.user) {
            clearGuestMode();
            setIsGuest(false);
          }
        }
      } finally {
        window.clearTimeout(authTimeout);
        finishLoading();
      }
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (handlingConfirmation.current) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        clearGuestMode();
        setIsGuest(false);
      }
      if (event === "PASSWORD_RECOVERY") {
        setPasswordRecoveryPending(true);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      window.clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const clearAuthBanner = useCallback(() => setAuthBanner(null), []);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      displayName: string
    ): Promise<AuthResult> => {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName.trim() },
          emailRedirectTo: getEmailConfirmRedirectUrl(),
        },
      });

      if (error) {
        return { error: error.message };
      }

      const needsConfirmation = Boolean(data.user && !data.session);
      return { error: null, needsConfirmation };
    },
    []
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error?.message ?? null };
    },
    []
  );

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    clearGuestMode();
    setIsGuest(false);
    setSession(null);
    setUser(null);
    setAuthBanner(null);
    if (typeof window !== "undefined") {
      window.location.href = LOGIN_PATH;
    }
  }, []);

  const continueAsGuest = useCallback(() => {
    enableGuestMode();
    setIsGuest(true);
  }, []);

  const requestSignIn = useCallback(() => {
    clearGuestMode();
    setIsGuest(false);
    if (typeof window !== "undefined") {
      window.location.href = LOGIN_PATH;
    }
  }, []);

  const signInWithOAuth = useCallback(
    async (provider: "google" | "apple"): Promise<AuthResult> => {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getEmailConfirmRedirectUrl(),
        },
      });
      return { error: error?.message ?? null };
    },
    []
  );

  const signInWithGoogle = useCallback(
    () => signInWithOAuth("google"),
    [signInWithOAuth]
  );

  const signInWithApple = useCallback(
    () => signInWithOAuth("apple"),
    [signInWithOAuth]
  );

  const updateDisplayName = useCallback(
    async (displayName: string): Promise<AuthResult> => {
      const trimmed = displayName.trim();
      if (!trimmed) return { error: "Name cannot be empty" };

      const supabase = getSupabase();
      const { data, error } = await supabase.auth.updateUser({
        data: { display_name: trimmed },
      });

      if (error) return { error: error.message };
      if (data.user) setUser(data.user);
      return { error: null };
    },
    []
  );

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    const supabase = getSupabase();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: getPasswordResetRedirectUrl(),
    });
    return { error: error?.message ?? null };
  }, []);

  const updatePassword = useCallback(
    async (password: string): Promise<AuthResult> => {
      const supabase = getSupabase();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return { error: error.message };
      cleanPasswordRecoveryParams();
      setPasswordRecoveryPending(false);
      return { error: null };
    },
    []
  );

  const clearPasswordRecovery = useCallback(() => {
    cleanPasswordRecoveryParams();
    setPasswordRecoveryPending(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      authBanner,
      clearAuthBanner,
      signUp,
      signIn,
      signOut,
      signInWithGoogle,
      signInWithApple,
      updateDisplayName,
      resetPassword,
      updatePassword,
      passwordRecoveryPending,
      clearPasswordRecovery,
      isGuest,
      continueAsGuest,
      requestSignIn,
    }),
    [
      user,
      session,
      loading,
      authBanner,
      clearAuthBanner,
      signUp,
      signIn,
      signOut,
      signInWithGoogle,
      signInWithApple,
      updateDisplayName,
      resetPassword,
      updatePassword,
      passwordRecoveryPending,
      clearPasswordRecovery,
      isGuest,
      continueAsGuest,
      requestSignIn,
    ]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
