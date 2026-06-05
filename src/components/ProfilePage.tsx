"use client";

import { useState } from "react";
import { ChevronRight, LogOut, Settings } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { PocketBrand } from "./PocketLogo";
import { ScreenHeader } from "./ScreenHeader";

interface ProfilePageProps {
  onClose: () => void;
}

export function ProfilePage({ onClose }: ProfilePageProps) {
  const { storiesRead, savedArticles } = useApp();
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Investor";

  const joined = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      onClose();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0a0a0a]">
      <ScreenHeader title="Profile" onBack={onClose} />
      <div className="flex-1 overflow-y-auto px-4 pb-28">
        <div className="flex flex-col items-center py-8">
          <PocketBrand layout="vertical" iconSize={80} glow="strong" showTagline />
          <h2 className="mt-6 text-xl font-bold text-white">{displayName}</h2>
          <p className="mt-1 text-sm text-zinc-500">{user?.email}</p>
          {joined && (
            <p className="mt-0.5 text-xs text-zinc-600">Joined {joined}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Stories read" value={String(storiesRead)} />
          <StatCard label="Watchlist" value={String(savedArticles.length)} />
        </div>

        <button
          type="button"
          data-no-drag
          className="mt-6 flex w-full items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-4 active:bg-white/[0.08]"
        >
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-zinc-400" />
            <span className="font-medium text-white">Settings</span>
          </div>
          <ChevronRight className="h-5 w-5 text-zinc-500" />
        </button>

        <button
          type="button"
          data-no-drag
          onClick={handleSignOut}
          disabled={signingOut}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-4 font-medium text-red-300 active:bg-red-500/15 disabled:opacity-50"
        >
          <LogOut className="h-5 w-5" />
          {signingOut ? "Signing out…" : "Sign Out"}
        </button>

        <p className="mt-8 text-center text-xs text-zinc-600">
          Pocket Finance v1.0 · Bold news. Smarter moves.
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 text-center">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{label}</p>
    </div>
  );
}
