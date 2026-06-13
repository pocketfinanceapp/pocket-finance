"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronRight, ExternalLink, Settings } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import {
  getReadingStreak,
  loadRecentlyRead,
  type RecentlyReadEntry,
} from "@/lib/profileStorage";
import { timeAgo } from "@/lib/utils";
import { MyTopicsSelector } from "./MyTopicsSelector";
import { ProfileAchievements } from "./ProfileAchievements";
import { PocketBrand } from "./PocketLogo";
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
  const [streak, setStreak] = useState(0);
  const [recentlyRead, setRecentlyRead] = useState<RecentlyReadEntry[]>([]);

  const refreshLocalProfile = useCallback(() => {
    setStreak(getReadingStreak());
    setRecentlyRead(loadRecentlyRead());
  }, []);

  useEffect(() => {
    void reloadProfileStats();
    refreshLocalProfile();
  }, [reloadProfileStats, refreshLocalProfile]);

  if (showSettings) {
    return <SettingsPage onBack={() => setShowSettings(false)} />;
  }

  if (isGuest && !user) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-black">
        <ScreenHeader title="Profile" onBack={onClose} />
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

  const streakSubtitle =
    streak > 1
      ? "Keep it up!"
      : streak === 0
        ? "Start your streak today!"
        : "Come back tomorrow!";

  return (
    <div className="flex h-full min-h-0 flex-col bg-black">
      <ScreenHeader title="Profile" onBack={onClose} />
      <div className="min-h-0 flex-1 overflow-y-auto px-5">
        <div className="flex flex-col items-center py-10">
          <PocketBrand
            layout="vertical"
            iconSize={72}
            glow="none"
            showTagline
            wordmarkClassName="text-xl font-extrabold"
          />
          <h2 className="mt-8 text-[1.35rem] font-bold text-white">{displayName}</h2>
          <p className="mt-1.5 text-sm text-zinc-500">{user?.email}</p>
          {joined && (
            <p className="mt-1 text-xs text-zinc-600">Joined {joined}</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Stories read" value={String(storiesRead)} />
          <StatCard label="Liked" value={String(likedArticlesCount)} />
          <StatCard label="Watchlist" value={String(savedArticles.length)} />
        </div>

        <ProfileAchievements
          articlesRead={storiesRead}
          likedCount={likedArticlesCount}
          streak={streak}
        />

        <section className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden>
              🔥
            </span>
            <div>
              <p className="text-2xl font-bold text-white">
                {streak} day streak
              </p>
              <p className="mt-0.5 text-sm text-zinc-500">{streakSubtitle}</p>
            </div>
          </div>
        </section>

        <section id="profile-my-topics" className="mt-8 scroll-mt-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            My Topics
          </h3>
          <div className="mt-3">
            <MyTopicsSelector />
          </div>
        </section>

        <section className="mt-8">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Recently Read
          </h3>
          {recentlyRead.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-600">No articles read yet</p>
          ) : (
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
          )}
        </section>

        <button
          type="button"
          data-no-drag
          onClick={() => setShowSettings(true)}
          className="mt-8 flex w-full items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.04] px-5 py-4 active:bg-white/[0.08]"
        >
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-zinc-400" />
            <span className="font-medium text-white">Settings</span>
          </div>
          <ChevronRight className="h-5 w-5 text-zinc-500" />
        </button>

        <p className="mt-10 pb-6 text-center text-xs text-zinc-600">
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
      <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
    </div>
  );
}
