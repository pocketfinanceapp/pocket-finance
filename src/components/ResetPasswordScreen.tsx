"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { PocketBrand } from "@/components/PocketLogo";
import { useAuth } from "@/context/AuthContext";
import { APP_BASE } from "@/lib/appPaths";

export function ResetPasswordScreen() {
  const router = useRouter();
  const { updatePassword, clearPasswordRecovery } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await updatePassword(password);
      if (result.error) {
        setError(result.error);
      } else {
        clearPasswordRecovery();
        router.replace(APP_BASE);
      }
    } catch {
      setError("Could not update password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pf-theme-scope app-shell-height fixed inset-0 z-[120] mx-auto flex w-full max-w-mobile flex-col bg-pocket-bg px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] text-pocket-text">
      <div className="flex flex-1 flex-col justify-center">
        <div className="mb-8 flex justify-center">
          <PocketBrand layout="vertical" iconSize={64} glow="none" />
        </div>

        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl border border-[#3B6EF5]/30 bg-gradient-to-br from-[#3B6EF5]/20 to-[#00C6C6]/15">
          <Lock className="h-12 w-12 text-[#00C6C6]" strokeWidth={1.5} />
        </div>

        <h1 className="text-center text-2xl font-bold tracking-tight">
          Set a new password
        </h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-pocket-muted">
          Choose a strong password for your Pocket Finance account.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-pocket-muted">
              New password
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              minLength={6}
              className="w-full rounded-xl border border-[var(--pocket-border)] bg-[var(--pocket-surface-hover)] px-4 py-2.5 text-sm text-pocket-text placeholder:text-pocket-muted focus:border-[#3B6EF5]/50 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-pocket-muted">
              Confirm password
            </span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              minLength={6}
              className="w-full rounded-xl border border-[var(--pocket-border)] bg-[var(--pocket-surface-hover)] px-4 py-2.5 text-sm text-pocket-text placeholder:text-pocket-muted focus:border-[#3B6EF5]/50 focus:outline-none"
            />
          </label>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-2xl bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] py-4 text-base font-bold text-white shadow-[0_8px_32px_rgba(59,110,245,0.35)] transition-opacity active:scale-[0.99] disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
