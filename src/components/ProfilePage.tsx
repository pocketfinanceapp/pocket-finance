"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Calendar, ChevronRight, ExternalLink, Settings } from "lucide-react";
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

/* ── Streak milestone helpers ────────────────────────────────────────────── */

const STREAK_MILESTONES = [3, 7, 14, 30];

function getNextMilestone(streak: number): number {
  return STREAK_MILESTONES.find((m) => m > streak) ?? 30;
}

/* ── Design tokens ───────────────────────────────────────────────────────── */

const CARD_SHADOW = "inset 0 1px 0 rgba(255,255,255,.04)";

/* ─────────────────────────────────────────────────────────────────────────── */

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
    const handleTopicsBack = () => {
      refreshLocalProfile();
      setShowTopics(false);
    };
    return (
      <div className="flex h-full min-h-0 flex-col bg-black">
        {/* Custom header with wordmark + Done button */}
        <header
          className="flex shrink-0 flex-col border-b border-white/[0.06] px-4"
          style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
        >
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-600">
            Pocket Finance
          </p>
          <div className="flex items-center justify-between pb-3 pt-1.5">
            <button
              type="button"
              data-no-drag
              onClick={handleTopicsBack}
              className="flex items-center gap-1.5 text-zinc-400 active:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-[15px] font-semibold text-white">
                My Topics
              </span>
            </button>
            <button
              type="button"
              data-no-drag
              onClick={handleTopicsBack}
              className="text-[15px] font-semibold text-[#00C6C6] active:opacity-60"
            >
              Done
            </button>
          </div>
        </header>

        <div
          className="min-h-0 flex-1 overflow-y-auto px-5 pt-5"
          style={{
            paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))",
          }}
        >
          <p className="text-sm text-zinc-400">
            Choose topics to personalise your Following feed.
          </p>
          <MyTopicsSelector showCount />
        </div>
      </div>
    );
  }

  /* ── Guest state ─────────────────────────────────────────────────────── */

  if (isGuest && !user) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-black">
        <header
          className="flex shrink-0 items-center border-b border-white/[0.06] px-4 pb-3"
          style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
        >
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

  const nextMilestone = getNextMilestone(streak);
  const segmentCount = Math.min(nextMilestone, 7);
  const filledSegments = Math.min(streak, segmentCount);

  /* ── Main profile ────────────────────────────────────────────────────── */

  return (
    <div className="flex h-full min-h-0 flex-col bg-black">
      {/* Root profile header — no back arrow */}
      <header
        className="flex shrink-0 items-center border-b border-white/[0.06] px-4 pb-3"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
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
        {/* ── Unified identity + stats card ─────────────────────────── */}
        <div
          className="relative mt-5 overflow-hidden rounded-2xl"
          style={{
            background:
              "linear-gradient(155deg, rgba(9,12,30,0.97) 0%, rgba(4,5,10,0.99) 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: CARD_SHADOW,
          }}
        >
          {/* Ambient cyan highlight — top-right corner */}
          <div
            className="pointer-events-none absolute right-0 top-0 h-28 w-28"
            style={{
              background:
                "radial-gradient(circle at 85% 15%, rgba(0,198,198,0.11) 0%, transparent 70%)",
            }}
          />

          {/* Top section: avatar + identity */}
          <div className="flex items-center gap-4 px-5 pb-4 pt-5">
            {/* Gradient avatar tile */}
            <div
              className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[14px] text-2xl font-bold text-white"
              style={{
                background:
                  "linear-gradient(135deg, rgba(59,110,245,0.55), rgba(0,198,198,0.40))",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.14), 0 2px 12px rgba(0,0,0,0.4)",
              }}
            >
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[18px] font-bold leading-tight text-white">
                {displayName}
              </p>
              <p className="mt-0.5 truncate text-[13px] text-zinc-400">
                {user?.email}
              </p>
              {joined && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 shrink-0 text-zinc-600" />
                  <p className="text-[11px] text-zinc-600">Joined {joined}</p>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="mx-0 border-t border-white/[0.06]" />

          {/* Stats row */}
          <div className="grid grid-cols-3 divide-x divide-white/[0.06]">
            <StatCell label="Stories Read" value={String(storiesRead)} />
            <StatCell label="Liked" value={String(likedArticlesCount)} />
            <StatCell label="Watchlist" value={String(savedArticles.length)} />
          </div>
        </div>

        {/* ── Achievements ──────────────────────────────────────────── */}
        <ProfileAchievements
          articlesRead={storiesRead}
          likedCount={likedArticlesCount}
          streak={streak}
        />

        {/* ── Streak card — exactly one ──────────────────────────────── */}
        <div
          className="mt-4 overflow-hidden rounded-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(22,13,5,0.97) 0%, rgba(8,7,6,0.99) 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "inset 0 1px 0 rgba(255,180,0,0.06)",
          }}
        >
          <div className="flex items-center gap-4 px-4 py-4">
            {/* Fire icon tile */}
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl leading-none"
              style={{
                background:
                  "linear-gradient(135deg, rgba(251,146,60,0.28), rgba(234,88,12,0.16))",
                border: "1px solid rgba(251,146,60,0.22)",
              }}
            >
              🔥
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1">
              <p className="text-[16px] font-bold leading-tight text-white">
                {streak} day streak
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">{streakSubtitle}</p>
            </div>

            {/* Progress indicator */}
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <p className="text-[11px] font-semibold tabular-nums text-zinc-500">
                {streak}&thinsp;/&thinsp;{nextMilestone}
              </p>
              <div className="flex gap-[3px]">
                {Array.from({ length: segmentCount }).map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 w-4 rounded-full"
                    style={{
                      backgroundColor:
                        i < filledSegments
                          ? "rgba(251,146,60,0.85)"
                          : "rgba(255,255,255,0.10)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── My Topics compact row ──────────────────────────────────── */}
        <button
          type="button"
          data-no-drag
          onClick={() => setShowTopics(true)}
          className="mt-3 flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left active:bg-white/[0.05]"
          style={{
            backgroundColor: "rgba(10,11,16,0.72)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: CARD_SHADOW,
          }}
        >
          {/* Tag icon tile */}
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{
              background: "rgba(59,110,245,0.15)",
              border: "1px solid rgba(59,110,245,0.2)",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(99,143,255,0.9)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-white">My Topics</p>
            {selectedTopics.length === 0 ? (
              <p className="mt-0.5 text-[12px] text-zinc-500">
                Choose topics to personalise your Following feed.
              </p>
            ) : (
              <p className="mt-0.5 text-[12px] text-zinc-500">
                {`Following ${selectedTopics.length} topic${selectedTopics.length === 1 ? "" : "s"}`}
                {" · "}
                {selectedTopics.slice(0, 3).join(", ")}
                {selectedTopics.length > 3 ? "…" : ""}
              </p>
            )}
          </div>

          <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600" />
        </button>

        {/* ── Recently Read — hidden when empty ─────────────────────── */}
        {recentlyRead.length > 0 && (
          <section className="mt-5">
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
              Recently Read
            </h3>
            <ul
              className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl"
              style={{
                backgroundColor: "rgba(10,11,16,0.72)",
                border: "1px solid rgba(255,255,255,0.07)",
                boxShadow: CARD_SHADOW,
              }}
            >
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

        {/* ── Footer ────────────────────────────────────────────────── */}
        <p className="mt-10 text-center text-[11px] text-zinc-700">
          Pocket Finance · Bold news. Smarter moves.
        </p>
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center px-3 py-4">
      <p className="text-[22px] font-bold tabular-nums leading-tight text-white">
        {value}
      </p>
      <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-zinc-600">
        {label}
      </p>
    </div>
  );
}
