"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { PocketBrand } from "@/components/PocketLogo";
import { useAuth } from "@/context/AuthContext";
import { APP_BASE, PRIVACY_PATH, TERMS_PATH } from "@/lib/appPaths";
import { FadeInSection } from "@/components/SubPageShell";

type AuthMode = "signIn" | "signUp";
type AuthView = "form" | "checkInbox" | "forgotPassword" | "resetSent";

const REMEMBER_ME_KEY = "pf_remember_me";
const REMEMBERED_EMAIL_KEY = "pf_remembered_email";
const REMEMBERED_PASSWORD_KEY = "pf_remembered_password";

function loadRememberedCredentials(): {
  email: string;
  password: string;
  rememberMe: boolean;
} {
  try {
    const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === "true";
    const email = localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? "";
    const password = rememberMe
      ? localStorage.getItem(REMEMBERED_PASSWORD_KEY) ?? ""
      : "";
    return { email, password, rememberMe: rememberMe && Boolean(email) };
  } catch {
    return { email: "", password: "", rememberMe: false };
  }
}

function persistRememberedCredentials(
  rememberMe: boolean,
  email: string,
  password: string
): void {
  try {
    if (rememberMe) {
      localStorage.setItem(REMEMBER_ME_KEY, "true");
      localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
      localStorage.setItem(REMEMBERED_PASSWORD_KEY, password);
    } else {
      localStorage.removeItem(REMEMBER_ME_KEY);
      localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      localStorage.removeItem(REMEMBERED_PASSWORD_KEY);
    }
  } catch {
    /* ignore storage errors */
  }
}

export function AuthScreen() {
  const router = useRouter();
  const {
    signIn,
    signUp,
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
    const saved = loadRememberedCredentials();
    if (saved.rememberMe) {
      setEmail(saved.email);
      setPassword(saved.password);
      setRememberMe(true);
    }
  }, []);

  const handleRememberMeChange = (checked: boolean) => {
    setRememberMe(checked);
    if (!checked) {
      persistRememberedCredentials(false, "", "");
      setPassword("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    clearAuthBanner();
    setSubmitting(true);

    try {
      if (isSignUp) {
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
          persistRememberedCredentials(rememberMe, email.trim(), password);
          router.replace(APP_BASE);
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
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
        <FadeInSection className="flex flex-1 flex-col justify-center">
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
        </FadeInSection>
      </AuthShell>
    );
  }

  if (view === "forgotPassword") {
    return (
      <AuthShell>
        <FadeInSection className="flex flex-1 flex-col justify-start pt-1">
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
        </FadeInSection>
      </AuthShell>
    );
  }

  if (view === "checkInbox") {
    return (
      <AuthShell>
        <FadeInSection className="flex flex-1 flex-col justify-center">
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
        </FadeInSection>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <FadeInSection className="flex flex-1 flex-col justify-start pt-1">
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
              onChange={handleRememberMeChange}
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

          <p className="pt-1 text-center text-[11px] leading-relaxed text-zinc-500">
            By continuing you agree to Pocket Finance&apos;s{" "}
            <a href={TERMS_PATH} target="_blank" rel="noopener noreferrer" className="text-zinc-300 underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href={PRIVACY_PATH} target="_blank" rel="noopener noreferrer" className="text-zinc-300 underline">
              Privacy Policy
            </a>
            .
          </p>
        </form>

        <button
          type="button"
          onClick={() => {
            continueAsGuest();
            router.replace(APP_BASE);
          }}
          disabled={submitting}
          className="mx-auto mt-5 mb-2 block text-center text-[12px] font-medium text-zinc-500 underline decoration-zinc-700 underline-offset-2 transition-colors active:text-zinc-300 disabled:opacity-50"
        >
          Continue without an account
        </button>
      </FadeInSection>
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
      <span className="mb-1 block text-xs font-medium text-pocket-muted">
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
        className="w-full rounded-xl border border-[var(--pocket-border)] bg-[var(--pocket-surface-hover)] px-4 py-2.5 text-sm text-pocket-text placeholder:text-pocket-muted focus:border-[#3B6EF5]/50 focus:outline-none"
      />
    </label>
  );
}

