"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronRight, ExternalLink, Settings } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import {
  getReadingStreak,
  loadFavouriteTopics,
  loadRecentlyRead,
  type RecentlyReadEntry,
} from "@/lib/profileStorage";
import { timeAgo } from "@/lib/utils";
import { MyTopicsSelector } from "./MyTopicsSelector";
import { ProfileAchievements } from "./ProfileAchievements";
import { ScreenHeader } from "./ScreenHeader";
import { SettingsPage } from "./SettingsPage";

interface ProfilePageProps {
  onClose: () => void;
}

export function ProfilePage({ onClose }: ProfilePageProps) {
  const { storiesRead, likedArticlesCount, savedArticles, reloadProfileStats } =
    useApp();
  const { user, isGuest, requestSignIn } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showTopics, setShowTopics] = useState(false);
  const [streak, setStreak] = useState(0);
  const [recentlyRead, setRecentlyRead] = useState<RecentlyReadEntry[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const refreshLocalProfile = useCallback(() => {
    setStreak(getReadingStreak());
    setRecentlyRead(loadRecentlyRead());
    setSelectedTopics(loadFavouriteTopics());
  }, []);

  useEffect(() => {
    void reloadProfileStats();
    refreshLocalProfile();
  }, [reloadProfileStats, refreshLocalProfile]);

  /* ── Sub-screens ─────────────────────────────────────────────────────── */

  if (showSettings) {
    return <SettingsPage onBack={() => setShowSettings(false)} />;
  }

  if (showTopics) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-black">
        <ScreenHeader
          title="My Topics"
          onBack={() => {
            refreshLocalProfile();
            setShowTopics(false);
          }}
        />
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-10 pt-4">
          <p className="mb-4 text-sm text-zinc-500">
            Choose topics to personalise your Following feed.
          </p>
          <MyTopicsSelector />
        </div>
      </div>
    );
  }

  /* ── Guest state ─────────────────────────────────────────────────────── */

  if (isGuest && !user) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-black">
        {/* Guest profile header — no back arrow */}
        <header className="flex shrink-0 items-center border-b border-white/[0.06] px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <h1 className="flex-1 text-lg font-bold text-white">Profile</h1>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <p className="text-lg font-semibold text-white">Sign in to your account</p>
          <p className="mt-2 text-sm text-zinc-500">
            Save articles, like stories, and sync your profile across devices.
          </p>
          <button
            type="button"
            onClick={requestSignIn}
            className="mt-8 rounded-2xl bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] px-8 py-3.5 text-sm font-bold text-white"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  /* ── Derived display values ──────────────────────────────────────────── */

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Investor";

  const initials = displayName.charAt(0).toUpperCase();

  const joined = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  const streakSubtitle =
    streak > 1
      ? "Keep it up!"
      : streak === 0
        ? "Start your streak today!"
        : "Come back tomorrow!";

  /* ── Main profile ────────────────────────────────────────────────────── */

  return (
    <div className="flex h-full min-h-0 flex-col bg-black">
      {/* Root Profile header — no back arrow, settings gear top-right */}
      <header className="flex shrink-0 items-center border-b border-white/[0.06] px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <h1 className="flex-1 text-lg font-bold text-white">Profile</h1>
        <button
          type="button"
          data-no-drag
          onClick={() => setShowSettings(true)}
          className="flex h-11 w-11 items-center justify-center rounded-full active:bg-white/[0.08]"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5 text-zinc-400" />
        </button>
      </header>

      <div
        className="min-h-0 flex-1 overflow-y-auto px-5"
        style={{
          paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))",
        }}
      >
        {/* Compact user identity — user is the visual focus */}
        <div className="flex items-center gap-4 py-6">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white"
            style={{
              background:
                "linear-gradient(135deg,rgba(59,110,245,.30),rgba(0,198,198,.22))",
            }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[18px] font-bold leading-tight text-white">
              {displayName}
            </p>
            <p className="mt-0.5 truncate text-sm text-zinc-500">{user?.email}</p>
            {joined && (
              <p className="mt-0.5 text-xs text-zinc-600">Joined {joined}</p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Stories read" value={String(storiesRead)} />
          <StatCard label="Liked" value={String(likedArticlesCount)} />
          <StatCard label="Watchlist" value={String(savedArticles.length)} />
        </div>

        {/* Achievements — 2-column grid */}
        <ProfileAchievements
          articlesRead={storiesRead}
          likedCount={likedArticlesCount}
          streak={streak}
        />

        {/* Streak — exactly one card, after achievements */}
        <section className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl leading-none" aria-hidden>
              🔥
            </span>
            <div>
              <p className="text-xl font-bold text-white">
                {streak} day streak
              </p>
              <p className="mt-0.5 text-sm text-zinc-500">{streakSubtitle}</p>
            </div>
          </div>
        </section>

        {/* My Topics — compact row, no chip cloud */}
        <section className="mt-5">
          <button
            type="button"
            data-no-drag
            onClick={() => setShowTopics(true)}
            className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-left active:bg-white/[0.06]"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white">My Topics</p>
              {selectedTopics.length === 0 ? (
                <p className="mt-0.5 text-xs text-zinc-500">
                  Choose topics to personalise your Following feed.
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-zinc-500">
                  {`Following ${selectedTopics.length} topic${selectedTopics.length === 1 ? "" : "s"} · ${selectedTopics.slice(0, 3).join(", ")}${selectedTopics.length > 3 ? "…" : ""}`}
                </p>
              )}
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-zinc-600" />
          </button>
        </section>

        {/* Recently Read — hidden entirely when empty */}
        {recentlyRead.length > 0 && (
          <section className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Recently Read
            </h3>
            <ul className="mt-3 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08] bg-white/[0.03]">
              {recentlyRead.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-no-drag
                    className="flex items-start justify-between gap-3 px-4 py-3.5 active:bg-white/[0.04]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium leading-snug text-white">
                        {item.headline}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {item.sourceName} · {timeAgo(item.readAt)}
                      </p>
                    </div>
                    <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-10 text-center text-xs text-zinc-600">
          Pocket Finance · Bold news. Smarter moves.
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 text-center">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
    </div>
  );
}
