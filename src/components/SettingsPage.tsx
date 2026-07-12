"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  Bookmark,
  ChevronRight,
  ExternalLink,
  Heart,
  LogOut,
  Newspaper,
  Tag,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  loadNotificationsEnabled,
  saveNotificationsEnabled,
} from "@/lib/notificationPreferences";
import { recordActivityEvent } from "@/lib/progression";
import {
  fetchLikedArticles,
  fetchSavedArticles,
} from "@/lib/userInteractions";
import type { LikedArticleEntry, SavedArticleEntry } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { CompanyLogo } from "./CompanyLogo";
import { FeedPreferencesEditor } from "./FeedPreferencesEditor";
import { MyTopicsSelector } from "./MyTopicsSelector";
import { ScreenHeader } from "./ScreenHeader";
import { ThemeSwitcher } from "./ThemeSwitcher";

type SettingsScreen = "main" | "liked" | "saved" | "topics" | "feedPrefs";

interface SettingsPageProps {
  onBack: () => void;
  /** Open directly to a sub-screen (e.g. "liked", "saved") */
  initialScreen?: SettingsScreen;
}

export function SettingsPage({ onBack, initialScreen }: SettingsPageProps) {
  const { user, signOut } = useAuth();
  const [screen, setScreen] = useState<SettingsScreen>(initialScreen ?? "main");
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
    // If on root screen, or we landed directly on this sub-screen, return to caller
    if (
      screen === "main" ||
      (initialScreen && initialScreen !== "main" && screen === initialScreen)
    ) {
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
          : screen === "feedPrefs"
            ? "Feed Preferences"
          : "Settings";

  if (screen !== "main") {
    return (
      <div className="flex h-full min-h-0 flex-col pf-page bg-pocket-bg">
        <ScreenHeader title={subTitle} onBack={handleSubBack} />
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8">
          {screen === "topics" ? (
            <div className="pt-4">
              <p className="mb-4 text-sm text-zinc-500">
                Choose topics to personalise your Following feed.
              </p>
              <MyTopicsSelector />
            </div>
          ) : screen === "feedPrefs" ? (
            <div className="pt-4">
              <FeedPreferencesEditor />
            </div>
          ) : (
            <ArticleList
              loading={loadingList}
              emptyMessage={
                screen === "liked"
                  ? "No liked articles yet"
                  : "No saved articles yet"
              }
              countLabel={
                !loadingList
                  ? screen === "liked"
                    ? likedArticles.length > 0
                      ? `${likedArticles.length} liked article${likedArticles.length !== 1 ? "s" : ""}`
                      : undefined
                    : savedArticles.length > 0
                      ? `${savedArticles.length} saved article${savedArticles.length !== 1 ? "s" : ""}`
                      : undefined
                  : undefined
              }
              items={
                screen === "liked"
                  ? likedArticles.map((a) => ({
                      id: a.id,
                      articleId: a.articleId,
                      title: a.articleTitle,
                      url: a.articleUrl,
                      meta: `${a.ticker} · ${timeAgo(a.likedAt)}`,
                      ticker: a.ticker,
                    }))
                  : savedArticles.map((a) => ({
                      id: a.id,
                      articleId: a.articleId,
                      title: a.articleTitle,
                      url: a.articleUrl,
                      meta: `${a.ticker} · ${timeAgo(a.savedAt)}`,
                      ticker: a.ticker,
                    }))
              }
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col pf-page bg-pocket-bg">
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
          <div className="border-b border-white/[0.06] px-4 py-4 last:border-b-0">
            <p className="mb-3 text-[13px] font-medium text-white">Appearance</p>
            <ThemeSwitcher variant="picker" />
          </div>
          <SettingsRow
            icon={<Newspaper className="h-5 w-5 text-[#3B6EF5]" />}
            label="Feed Preferences"
            onClick={() => setScreen("feedPrefs")}
          />
          <SettingsRow
            icon={<Tag className="h-5 w-5 text-zinc-400" />}
            label="My Topics"
            onClick={() => setScreen("topics")}
          />
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 last:border-b-0">
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
                notificationsOn ? "bg-[#00C6C6]" : "bg-zinc-700"
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
          <div className="border-b border-white/[0.06] px-4 py-3">
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
    <section className="mt-6">
      <h3 className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
        {title}
      </h3>
      <div
        className="pf-card-surface overflow-hidden rounded-2xl"
      >
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
      className="flex w-full items-center justify-between border-b border-white/[0.06] px-4 py-3 text-left last:border-b-0 active:bg-white/[0.06]"
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-medium text-white">{label}</span>
      </div>
      <ChevronRight className="h-5 w-5 text-zinc-500" />
    </button>
  );
}

/* ── Ticker helpers (only known company tickers get a coloured logo tile) ── */

const TICKER_COLORS: Record<string, string> = {
  AAPL: "#4a4a4a",
  MSFT: "#00A4EF",
  GOOGL: "#4285F4",
  GOOG: "#4285F4",
  AMZN: "#FF9900",
  NVDA: "#76B900",
  TSLA: "#CC0000",
  META: "#0866FF",
  BTC: "#F7931A",
  ETH: "#627EEA",
  COIN: "#0052FF",
  NFLX: "#E50914",
  JPM: "#1D4D8E",
  GS: "#7399C6",
  BAC: "#E31837",
  V: "#1A1F71",
  MA: "#EB001B",
  PYPL: "#003087",
  DIS: "#006EBF",
  INTC: "#0068B5",
  AMD: "#ED1C24",
  HOOD: "#00C805",
  SHOP: "#96BF48",
  XOM: "#FF0000",
  CVX: "#007AC2",
};

const KNOWN_TICKERS = new Set(Object.keys(TICKER_COLORS));

function tickerColor(ticker: string): string {
  return TICKER_COLORS[ticker.toUpperCase()] ?? "#3B6EF5";
}

function isKnownTicker(ticker: string): boolean {
  return KNOWN_TICKERS.has(ticker.toUpperCase());
}

function ArticleList({
  items,
  emptyMessage,
  loading,
  countLabel,
}: {
  items: Array<{ id: string; articleId: string; title: string; url: string; meta: string; ticker: string }>;
  emptyMessage: string;
  loading: boolean;
  countLabel?: string;
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
    <>
      {countLabel && (
        <p className="px-1 pt-4 text-[13px] text-zinc-500">{countLabel}</p>
      )}
      <ul className="mt-3 divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              data-no-drag
              className="flex items-center gap-3 px-4 py-3 active:bg-white/[0.04]"
              onClick={() =>
                recordActivityEvent("article_opened", item.articleId, {
                  articleId: item.articleId,
                  category: item.ticker,
                })
              }
            >
              {/* Only known company tickers get the coloured logo tile */}
              {isKnownTicker(item.ticker) ? (
                <div className="shrink-0 overflow-hidden rounded-lg">
                  <CompanyLogo
                    ticker={item.ticker}
                    color={tickerColor(item.ticker)}
                    size={48}
                    shape="square"
                  />
                </div>
              ) : (
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: "var(--pocket-surface)",
                    border: "1px solid var(--pocket-border)",
                  }}
                >
                  <Newspaper className="h-5 w-5 text-zinc-600" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[13px] font-medium leading-snug text-white">
                  {item.title}
                </p>
                <p className="mt-1 text-[11px] text-zinc-500">{item.meta}</p>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-zinc-600" />
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
