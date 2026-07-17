"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  Bookmark,
  Check,
  ChevronRight,
  ExternalLink,
  Globe2,
  Heart,
  LogOut,
  Newspaper,
  Star,
  Tag,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { recordActivityEvent } from "@/lib/progression";
import {
  fetchLikedArticles,
  fetchSavedArticles,
} from "@/lib/userInteractions";
import { getTickerMetaBySymbol } from "@/lib/tickerMap";
import type { LikedArticleEntry, NewsArticle, SavedArticleEntry } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { CompanyLogo } from "./CompanyLogo";
import { FeedPreferencesEditor } from "./FeedPreferencesEditor";
import { MyTopicsSelector } from "./MyTopicsSelector";
import { RegionCurrencyEditor } from "./RegionCurrencyEditor";
import { ScreenHeader } from "./ScreenHeader";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { FadeInSection } from "./SubPageShell";
import {
  panelEnterStyle,
  PANEL_EXIT_MS,
  useTabEntered,
} from "@/lib/tabEnterAnimation";

type SettingsScreen =
  | "main"
  | "liked"
  | "saved"
  | "following"
  | "topics"
  | "feedPrefs"
  | "regionCurrency"
  | "sources";

interface SettingsPageProps {
  onBack: () => void;
  /** Open directly to a sub-screen (e.g. "liked", "saved") */
  initialScreen?: SettingsScreen;
  /** Article pool used to derive the News Sources list */
  catalogArticles?: NewsArticle[];
}

export function SettingsPage({
  onBack,
  initialScreen,
  catalogArticles = [],
}: SettingsPageProps) {
  const { user, signOut } = useAuth();
  const [screen, setScreen] = useState<SettingsScreen>(initialScreen ?? "main");
  const [exiting, setExiting] = useState(false);
  const pageEntered = useTabEntered(true);
  const [signingOut, setSigningOut] = useState(false);
  const [likedArticles, setLikedArticles] = useState<LikedArticleEntry[]>([]);
  const [savedArticles, setSavedArticles] = useState<SavedArticleEntry[]>([]);
  const [loadingList, setLoadingList] = useState(false);

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
      setExiting(true);
      window.setTimeout(() => onBack(), PANEL_EXIT_MS);
      return;
    }
    setScreen("main");
  };

  const pageStyle = panelEnterStyle(pageEntered && !exiting);

  const subTitle =
    screen === "liked"
      ? "Liked Articles"
      : screen === "saved"
        ? "Saved Articles"
        : screen === "following"
          ? "Following"
          : screen === "topics"
          ? "My Topics"
          : screen === "feedPrefs"
            ? "Feed Preferences"
            : screen === "regionCurrency"
              ? "Region"
              : screen === "sources"
                ? "News Sources"
                : "Settings";

  if (screen !== "main") {
    return (
      <div
        className="absolute inset-0 z-20 flex h-full min-h-0 flex-col pf-page bg-pocket-bg"
        style={pageStyle}
      >
        <ScreenHeader title={subTitle} onBack={handleSubBack} />
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8">
          <FadeInSection delayMs={80}>
          {screen === "topics" ? (
            <div className="pt-4">
              <p className="mb-4 text-sm text-pocket-muted">
                Choose topics to personalise your For You feed.
              </p>
              <MyTopicsSelector />
            </div>
          ) : screen === "feedPrefs" ? (
            <div className="pt-4">
              <FeedPreferencesEditor />
            </div>
          ) : screen === "regionCurrency" ? (
            <div className="pt-4">
              <RegionCurrencyEditor />
            </div>
          ) : screen === "sources" ? (
            <div className="pt-4">
              <NewsSourcesEditor catalogArticles={catalogArticles} />
            </div>
          ) : screen === "following" ? (
            <div className="pt-4">
              <FollowingEditor />
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
          </FadeInSection>
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 z-20 flex h-full min-h-0 flex-col pf-page bg-pocket-bg"
      style={pageStyle}
    >
      <ScreenHeader
        title="Settings"
        onBack={() => {
          setExiting(true);
          window.setTimeout(() => onBack(), PANEL_EXIT_MS);
        }}
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8">
        <FadeInSection delayMs={60}>
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
          <SettingsRow
            icon={<Star className="h-5 w-5 text-[#F5A623]" />}
            label="Following"
            onClick={() => setScreen("following")}
          />
        </SettingsSection>

        <SettingsSection title="Preferences">
          <div className="border-b border-[var(--pocket-border)] px-4 py-4 last:border-b-0">
            <p className="mb-3 text-[13px] font-medium text-pocket-text">
              Appearance
            </p>
            <ThemeSwitcher variant="picker" />
          </div>
          <SettingsRow
            icon={<Globe2 className="h-5 w-5 text-[#00C6C6]" />}
            label="Region"
            onClick={() => setScreen("regionCurrency")}
          />
          <SettingsRow
            icon={<Newspaper className="h-5 w-5 text-[#3B6EF5]" />}
            label="Feed Preferences"
            onClick={() => setScreen("feedPrefs")}
          />
          <SettingsRow
            icon={<Newspaper className="h-5 w-5 text-[#00C6C6]" />}
            label="News Sources"
            onClick={() => setScreen("sources")}
          />
          <SettingsRow
            icon={<Tag className="h-5 w-5 text-pocket-muted" />}
            label="My Topics"
            onClick={() => setScreen("topics")}
          />
          <div className="flex items-center justify-between border-b border-[var(--pocket-border)] px-4 py-3 last:border-b-0">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-pocket-muted" />
              <span className="font-medium text-pocket-text">Notifications</span>
            </div>
            <span className="rounded-full border border-[var(--pocket-border)] bg-[var(--pocket-surface-hover)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-pocket-muted">
              Soon
            </span>
          </div>
        </SettingsSection>

        <SettingsSection title="Account">
          <div className="border-b border-[var(--pocket-border)] px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-pocket-muted">
              Email
            </p>
            <p className="mt-1 text-sm text-pocket-text">{user?.email ?? "—"}</p>
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
        </FadeInSection>
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
      <h3 className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-pocket-muted">
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
      className="flex w-full items-center justify-between border-b border-[var(--pocket-border)] px-4 py-3 text-left last:border-b-0 active:bg-[var(--pocket-surface-hover)]"
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-medium text-pocket-text">{label}</span>
      </div>
      <ChevronRight className="h-5 w-5 text-pocket-muted" />
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
    return <p className="pt-6 text-center text-sm text-pocket-muted">Loading…</p>;
  }

  if (items.length === 0) {
    return (
      <p className="pt-6 text-center text-sm text-pocket-muted">{emptyMessage}</p>
    );
  }

  return (
    <>
      {countLabel && (
        <p className="px-1 pt-4 text-[13px] text-pocket-muted">{countLabel}</p>
      )}
      <ul className="mt-3 divide-y divide-[var(--pocket-border)] overflow-hidden rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)]">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              data-no-drag
              className="flex items-center gap-3 px-4 py-3 active:bg-[var(--pocket-surface-hover)]"
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
                  <Newspaper className="h-5 w-5 text-pocket-muted" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[13px] font-medium leading-snug text-pocket-text">
                  {item.title}
                </p>
                <p className="mt-1 text-[11px] text-pocket-muted">{item.meta}</p>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-pocket-muted" />
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

/* ── News source preferences (Marketaux covers 5,000+ sources — this lets
   people hide the handful appearing in their feed they don't want) ────── */

function NewsSourcesEditor({
  catalogArticles,
}: {
  catalogArticles: NewsArticle[];
}) {
  const { hiddenSources, toggleHiddenSource } = useApp();

  const sources = (() => {
    const counts = new Map<string, number>();
    for (const article of catalogArticles) {
      const name = article.sourceName?.trim();
      if (!name) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  })();

  if (sources.length === 0) {
    return (
      <p className="pt-6 text-center text-sm text-pocket-muted">
        No sources in your feed yet.
      </p>
    );
  }

  return (
    <>
      <p className="px-1 text-[13px] leading-relaxed text-pocket-muted">
        Hide sources you don&apos;t want to see. Your feed pulls from 5,000+
        outlets — this only affects sources currently showing up for you.
      </p>
      <ul className="mt-3 divide-y divide-[var(--pocket-border)] overflow-hidden rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)]">
        {sources.map(([name, count]) => {
          const hidden = hiddenSources.includes(name);
          return (
            <li key={name}>
              <button
                type="button"
                data-no-drag
                onClick={() => toggleHiddenSource(name)}
                className="flex w-full items-center justify-between px-4 py-3 text-left active:bg-[var(--pocket-surface-hover)]"
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[13px] font-medium ${
                      hidden ? "text-pocket-muted line-through" : "text-pocket-text"
                    }`}
                  >
                    {name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-pocket-muted">
                    {count} {count === 1 ? "story" : "stories"} in your feed
                  </p>
                </div>
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                    hidden
                      ? "border-[var(--pocket-border)] bg-transparent"
                      : "border-[#00C6C6] bg-[#00C6C6]"
                  }`}
                >
                  {!hidden && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/* ── Followed companies — boosts these tickers in the For You feed ──────── */

function FollowingEditor() {
  const { followedTickers, toggleFollowTicker } = useApp();

  if (followedTickers.length === 0) {
    return (
      <p className="pt-6 text-center text-sm text-pocket-muted">
        You&apos;re not following any companies yet. Swipe right on a story or
        open a company&apos;s page from Explore to follow it.
      </p>
    );
  }

  return (
    <>
      <p className="px-1 text-[13px] leading-relaxed text-pocket-muted">
        Companies you follow are boosted in your For You feed.
      </p>
      <ul className="mt-3 divide-y divide-[var(--pocket-border)] overflow-hidden rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)]">
        {followedTickers.map((ticker) => {
          const meta = getTickerMetaBySymbol(ticker);
          return (
            <li key={ticker}>
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="shrink-0 overflow-hidden rounded-lg">
                  <CompanyLogo ticker={ticker} color={meta.logoColor} size={40} shape="circle" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-pocket-text">
                    {meta.companyName}
                  </p>
                  <p className="text-[11px] text-pocket-muted">{ticker}</p>
                </div>
                <button
                  type="button"
                  data-no-drag
                  onClick={() => toggleFollowTicker(ticker)}
                  className="shrink-0 rounded-full border border-[var(--pocket-border)] px-3 py-1.5 text-[12px] font-semibold text-pocket-muted active:opacity-60"
                >
                  Unfollow
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
