"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  Bookmark,
  ChevronRight,
  ExternalLink,
  Heart,
  LogOut,
  Tag,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  loadNotificationsEnabled,
  saveNotificationsEnabled,
} from "@/lib/notificationPreferences";
import {
  fetchLikedArticles,
  fetchSavedArticles,
} from "@/lib/userInteractions";
import type { LikedArticleEntry, SavedArticleEntry } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { MyTopicsSelector } from "./MyTopicsSelector";
import { ScreenHeader } from "./ScreenHeader";

type SettingsScreen = "main" | "liked" | "saved" | "topics";

interface SettingsPageProps {
  onBack: () => void;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const { user, signOut } = useAuth();
  const [screen, setScreen] = useState<SettingsScreen>("main");
  const [notificationsOn, setNotificationsOn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [likedArticles, setLikedArticles] = useState<LikedArticleEntry[]>([]);
  const [savedArticles, setSavedArticles] = useState<SavedArticleEntry[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    setNotificationsOn(loadNotificationsEnabled());
  }, []);

  const loadLiked = useCallback(async () => {
    if (!user?.id) return;
    setLoadingList(true);
    const items = await fetchLikedArticles(user.id);
    setLikedArticles(items);
    setLoadingList(false);
  }, [user?.id]);

  const loadSaved = useCallback(async () => {
    if (!user?.id) return;
    setLoadingList(true);
    const items = await fetchSavedArticles(user.id);
    setSavedArticles(items);
    setLoadingList(false);
  }, [user?.id]);

  useEffect(() => {
    if (screen === "liked") void loadLiked();
    if (screen === "saved") void loadSaved();
  }, [screen, loadLiked, loadSaved]);

  const handleNotificationsToggle = () => {
    const next = !notificationsOn;
    setNotificationsOn(next);
    saveNotificationsEnabled(next);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      onBack();
    } finally {
      setSigningOut(false);
    }
  };

  const handleSubBack = () => {
    if (screen === "main") {
      onBack();
      return;
    }
    setScreen("main");
  };

  const subTitle =
    screen === "liked"
      ? "Liked Articles"
      : screen === "saved"
        ? "Saved Articles"
        : screen === "topics"
          ? "My Topics"
          : "Settings";

  if (screen !== "main") {
    return (
      <div className="flex h-full min-h-0 flex-col bg-black">
        <ScreenHeader title={subTitle} onBack={handleSubBack} />
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8">
          {screen === "topics" ? (
            <div className="pt-4">
              <p className="text-sm text-zinc-500">
                Tap topics to personalize your feed interests.
              </p>
              <div className="mt-4">
                <MyTopicsSelector />
              </div>
            </div>
          ) : (
            <ArticleList
              loading={loadingList}
              emptyMessage={
                screen === "liked"
                  ? "No liked articles yet"
                  : "No saved articles yet"
              }
              items={
                screen === "liked"
                  ? likedArticles.map((a) => ({
                      id: a.id,
                      title: a.articleTitle,
                      url: a.articleUrl,
                      meta: `${a.ticker} · ${timeAgo(a.likedAt)}`,
                    }))
                  : savedArticles.map((a) => ({
                      id: a.id,
                      title: a.articleTitle,
                      url: a.articleUrl,
                      meta: `${a.ticker} · ${timeAgo(a.savedAt)}`,
                    }))
              }
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-black">
      <ScreenHeader title="Settings" onBack={onBack} />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8">
        <SettingsSection title="My Activity">
          <SettingsRow
            icon={<Heart className="h-5 w-5 text-red-400" />}
            label="Liked Articles"
            onClick={() => setScreen("liked")}
          />
          <SettingsRow
            icon={<Bookmark className="h-5 w-5 text-[#00C6C6]" />}
            label="Saved Articles"
            onClick={() => setScreen("saved")}
          />
        </SettingsSection>

        <SettingsSection title="Preferences">
          <SettingsRow
            icon={<Tag className="h-5 w-5 text-zinc-400" />}
            label="My Topics"
            onClick={() => setScreen("topics")}
          />
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3.5 last:border-b-0">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-zinc-400" />
              <span className="font-medium text-white">Notifications</span>
            </div>
            <button
              type="button"
              data-no-drag
              role="switch"
              aria-checked={notificationsOn}
              onClick={handleNotificationsToggle}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                notificationsOn ? "bg-[#3B6EF5]" : "bg-zinc-700"
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  notificationsOn ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </SettingsSection>

        <SettingsSection title="Account">
          <div className="border-b border-white/[0.06] px-4 py-3.5">
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              Email
            </p>
            <p className="mt-1 text-sm text-white">{user?.email ?? "—"}</p>
          </div>
          <button
            type="button"
            data-no-drag
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full items-center justify-center gap-2 px-4 py-4 font-medium text-red-400 active:bg-white/[0.04] disabled:opacity-50"
          >
            <LogOut className="h-5 w-5" />
            {signingOut ? "Signing out…" : "Sign Out"}
          </button>
        </SettingsSection>
      </div>
    </div>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h3 className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
        {title}
      </h3>
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
        {children}
      </div>
    </section>
  );
}

function SettingsRow({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-no-drag
      onClick={onClick}
      className="flex w-full items-center justify-between border-b border-white/[0.06] px-4 py-3.5 text-left last:border-b-0 active:bg-white/[0.06]"
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-medium text-white">{label}</span>
      </div>
      <ChevronRight className="h-5 w-5 text-zinc-500" />
    </button>
  );
}

function ArticleList({
  items,
  emptyMessage,
  loading,
}: {
  items: Array<{ id: string; title: string; url: string; meta: string }>;
  emptyMessage: string;
  loading: boolean;
}) {
  if (loading) {
    return <p className="pt-6 text-center text-sm text-zinc-500">Loading…</p>;
  }

  if (items.length === 0) {
    return (
      <p className="pt-6 text-center text-sm text-zinc-600">{emptyMessage}</p>
    );
  }

  return (
    <ul className="mt-4 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08] bg-white/[0.03]">
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            data-no-drag
            className="flex items-start justify-between gap-3 px-4 py-3.5 active:bg-white/[0.04]"
          >
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium leading-snug text-white">
                {item.title}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{item.meta}</p>
            </div>
            <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" />
          </a>
        </li>
      ))}
    </ul>
  );
}
