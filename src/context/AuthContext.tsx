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
import { getEmailConfirmRedirectUrl } from "@/lib/authRedirect";
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
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (handlingConfirmation.current) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        clearGuestMode();
        setIsGuest(false);
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
  }, []);

  const continueAsGuest = useCallback(() => {
    enableGuestMode();
    setIsGuest(true);
  }, []);

  const requestSignIn = useCallback(() => {
    clearGuestMode();
    setIsGuest(false);
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
