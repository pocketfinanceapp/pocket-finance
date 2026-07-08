"use client";

import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { PocketBrand } from "@/components/PocketLogo";
import { useAuth } from "@/context/AuthContext";
import {
  getPendingReferralCode,
  storePendingReferralCode,
} from "@/lib/referral";

type AuthMode = "signIn" | "signUp";
type AuthView = "form" | "checkInbox" | "forgotPassword" | "resetSent";

const REMEMBERED_EMAIL_KEY = "pf_remembered_email";

export function AuthScreen() {
  const {
    signIn,
    signUp,
    signInWithApple,
    signInWithGoogle,
    authBanner,
    clearAuthBanner,
    continueAsGuest,
    resetPassword,
  } = useAuth();
  const [view, setView] = useState<AuthView>("form");
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [confirmedEmail, setConfirmedEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSignUp = mode === "signUp";

  useEffect(() => {
    if (authBanner) {
      setView("form");
      setMode("signIn");
      setError(null);
    }
  }, [authBanner]);

  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
      const pendingRef = getPendingReferralCode();
      if (pendingRef) {
        setReferralCode(pendingRef);
        setMode("signUp");
      }
    } catch {
      /* ignore storage errors */
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    clearAuthBanner();
    setSubmitting(true);

    try {
      if (isSignUp) {
        if (referralCode.trim()) {
          storePendingReferralCode(referralCode.trim());
        }
        const result = await signUp(email.trim(), password, displayName);
        if (result.error) {
          setError(result.error);
        } else if (result.needsConfirmation) {
          setConfirmedEmail(email.trim());
          setView("checkInbox");
        }
      } else {
        const result = await signIn(email.trim(), password);
        if (result.error) {
          setError(result.error);
        } else {
          try {
            if (rememberMe) {
              localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
            } else {
              localStorage.removeItem(REMEMBERED_EMAIL_KEY);
            }
          } catch {
            /* ignore storage errors */
          }
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOAuth = async (provider: "apple" | "google") => {
    setError(null);
    clearAuthBanner();
    setSubmitting(true);
    try {
      const result =
        provider === "apple"
          ? await signInWithApple()
          : await signInWithGoogle();
      if (result.error) setError(result.error);
    } catch {
      setError("Could not start sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const backToLogin = () => {
    setView("form");
    setMode("signIn");
    setError(null);
    clearAuthBanner();
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    clearAuthBanner();
    setSubmitting(true);
    try {
      const result = await resetPassword(email.trim());
      if (result.error) {
        setError(result.error);
      } else {
        setView("resetSent");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (view === "resetSent") {
    return (
      <AuthShell>
        <div className="flex flex-1 flex-col justify-center">
          <div className="mb-8 flex justify-center">
            <PocketBrand layout="vertical" iconSize={64} glow="none" />
          </div>

          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl border border-[#3B6EF5]/30 bg-gradient-to-br from-[#3B6EF5]/20 to-[#00C6C6]/15">
            <Mail className="h-12 w-12 text-[#00C6C6]" strokeWidth={1.5} />
          </div>

          <h1 className="text-center text-2xl font-bold tracking-tight">
            Check your inbox
          </h1>
          <p className="mt-4 text-center text-sm leading-relaxed text-zinc-400">
            We&apos;ve sent a password reset link to{" "}
            <span className="font-medium text-white">{email.trim()}</span>.
            Open the link to choose a new password.
          </p>

          <button
            type="button"
            onClick={backToLogin}
            className="mt-10 w-full rounded-2xl bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] py-4 text-base font-bold text-white shadow-[0_8px_32px_rgba(59,110,245,0.35)] transition-opacity active:scale-[0.99]"
          >
            Back to Log In
          </button>
        </div>
      </AuthShell>
    );
  }

  if (view === "forgotPassword") {
    return (
      <AuthShell>
        <div className="flex flex-1 flex-col justify-start pt-1">
          <div className="mb-3 flex justify-center">
            <PocketBrand layout="icon" iconSize={60} glow="none" />
          </div>

          <h1 className="text-center text-2xl font-bold tracking-tight">
            Reset password
          </h1>
          <p className="mt-2 text-center text-sm text-zinc-500">
            Enter your email and we&apos;ll send you a reset link.
          </p>

          <form onSubmit={handleForgotSubmit} className="mt-8 space-y-3">
            <AuthField
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] py-4 text-base font-bold text-white shadow-[0_8px_32px_rgba(59,110,245,0.35)] transition-opacity active:scale-[0.99] disabled:opacity-50"
            >
              {submitting ? "Sending…" : "Send reset link"}
            </button>

            <button
              type="button"
              onClick={backToLogin}
              className="w-full py-2 text-sm font-medium text-zinc-400 active:text-white"
            >
              Back to Log In
            </button>
          </form>
        </div>
      </AuthShell>
    );
  }

  if (view === "checkInbox") {
    return (
      <AuthShell>
        <div className="flex flex-1 flex-col justify-center">
          <div className="mb-8 flex justify-center">
            <PocketBrand layout="vertical" iconSize={64} glow="none" />
          </div>

          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl border border-[#3B6EF5]/30 bg-gradient-to-br from-[#3B6EF5]/20 to-[#00C6C6]/15">
            <Mail className="h-12 w-12 text-[#00C6C6]" strokeWidth={1.5} />
          </div>

          <h1 className="text-center text-2xl font-bold tracking-tight">
            Check your inbox
          </h1>
          <p className="mt-4 text-center text-sm leading-relaxed text-zinc-400">
            We&apos;ve sent a confirmation link to{" "}
            <span className="font-medium text-white">{confirmedEmail}</span>.
            Click the link in the email to activate your account, then come back
            here to log in.
          </p>

          <button
            type="button"
            onClick={backToLogin}
            className="mt-10 w-full rounded-2xl bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] py-4 text-base font-bold text-white shadow-[0_8px_32px_rgba(59,110,245,0.35)] transition-opacity active:scale-[0.99]"
          >
            Back to Log In
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="flex flex-1 flex-col justify-start pt-1">
        <div className="mb-3 flex justify-center">
          <PocketBrand layout="icon" iconSize={60} glow="none" />
        </div>

        <h1 className="text-center text-2xl font-bold tracking-tight">
          Welcome to Pocket Finance
        </h1>
        <p className="mt-1 text-center text-sm text-zinc-500">
          Bold news. Smarter moves.
        </p>

        <div className="mt-3 flex rounded-xl border border-white/10 bg-white/[0.04] p-1">
          <button
            type="button"
            onClick={() => {
              setMode("signIn");
              setError(null);
              clearAuthBanner();
            }}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              mode === "signIn"
                ? "bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] text-white"
                : "text-zinc-400"
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signUp");
              setError(null);
              clearAuthBanner();
            }}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              mode === "signUp"
                ? "bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] text-white"
                : "text-zinc-400"
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <OAuthButton
            label="Continue with Apple"
            disabled={submitting}
            onClick={() => handleOAuth("apple")}
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
            }
          />
          <OAuthButton
            label="Continue with Google"
            disabled={submitting}
            onClick={() => handleOAuth("google")}
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            }
          />
          <button
            type="button"
            onClick={continueAsGuest}
            disabled={submitting}
            className="flex w-full items-center justify-center rounded-xl border border-[#333] bg-transparent py-3.5 text-sm font-normal text-white transition-colors active:bg-white/[0.04] disabled:opacity-50"
          >
            Continue as Guest
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-zinc-500">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {authBanner && (
          <p className="mt-3 rounded-lg border border-[#00C6C6]/30 bg-[#00C6C6]/10 px-3 py-2.5 text-center text-sm text-[#00C6C6]">
            {authBanner}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {isSignUp && (
            <AuthField
              label="Display name"
              type="text"
              value={displayName}
              onChange={setDisplayName}
              placeholder="Your name"
              autoComplete="name"
              required
            />
          )}
          <AuthField
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
          <AuthField
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            required
            minLength={6}
          />

          {isSignUp && (
            <AuthField
              label="Referral code (optional)"
              type="text"
              value={referralCode}
              onChange={setReferralCode}
              placeholder="Friend's invite code"
              autoComplete="off"
            />
          )}

          {!isSignUp && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setView("forgotPassword");
                  setError(null);
                  clearAuthBanner();
                }}
                className="text-[12px] font-medium text-[#00C6C6] active:opacity-70"
              >
                Forgot password?
              </button>
            </div>
          )}

          {!isSignUp && (
            <RememberMeToggle
              checked={rememberMe}
              onChange={setRememberMe}
            />
          )}

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] py-4 text-base font-bold text-white shadow-[0_8px_32px_rgba(59,110,245,0.35)] transition-opacity active:scale-[0.99] disabled:opacity-50"
          >
            {submitting
              ? "Please wait…"
              : isSignUp
                ? "Create account"
                : "Log in"}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}

function RememberMeToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="mt-3 flex cursor-pointer select-none items-center gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-all duration-200 ease-out peer-focus-visible:ring-2 peer-focus-visible:ring-[#3B6EF5]/50 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#0a0a0a] ${
          checked
            ? "border-transparent bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] shadow-[0_0_14px_rgba(0,198,198,0.22)]"
            : "border-white/10 bg-white/[0.06]"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.35)] transition-transform duration-200 ease-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
      <span
        className={`text-sm transition-colors duration-200 ease-out ${
          checked ? "text-zinc-300" : "text-zinc-400"
        }`}
      >
        Remember me
      </span>
    </label>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="pf-theme-scope app-shell-height fixed inset-0 z-[100] mx-auto flex w-full max-w-mobile flex-col bg-pocket-bg px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] text-pocket-text"
    >
      {children}
    </div>
  );
}

function AuthField({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  minLength,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-zinc-400">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-[#3B6EF5]/50 focus:outline-none"
      />
    </label>
  );
}

function OAuthButton({
  label,
  onClick,
  disabled,
  icon,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/[0.04] py-3.5 text-sm font-semibold text-white transition-colors active:bg-white/[0.08] disabled:opacity-50"
    >
      {icon}
      {label}
    </button>
  );
}
