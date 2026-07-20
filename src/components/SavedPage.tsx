"use client";

import { useMemo } from "react";
import { Bookmark, ChevronRight, Newspaper } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useNavigation } from "@/context/NavigationContext";
import { recordActivityEvent } from "@/lib/progression";
import { tabEnterStyle, useTabPageEntered } from "@/lib/tabEnterAnimation";
import { timeAgo } from "@/lib/utils";
import type { NewsArticle, SavedArticleEntry } from "@/lib/types";
import { CompanyLogo } from "./CompanyLogo";

interface SavedPageProps {
  catalogArticles: NewsArticle[];
}

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
};

function tickerColor(ticker: string): string {
  return TICKER_COLORS[ticker.toUpperCase()] ?? "#3B6EF5";
}

export function SavedPage({ catalogArticles }: SavedPageProps) {
  const { savedArticles, unsaveArticle, requestFeedJump } = useApp();
  const { user, isGuest, requestSignIn } = useAuth();
  const { navigate } = useNavigation();
  const entered = useTabPageEntered("saved");

  // Was rebuilt from scratch on every render (including every parent
  // re-render while this tab is mounted) against the full article catalog —
  // the main cause of Saved tab feeling slow on tab switches.
  const articlesById = useMemo(
    () => new Map(catalogArticles.map((article) => [article.id, article] as const)),
    [catalogArticles]
  );

  const openSaved = (entry: SavedArticleEntry) => {
    recordActivityEvent("article_opened", entry.articleId, {
      articleId: entry.articleId,
      category: entry.ticker,
    });

    const full = articlesById.get(entry.articleId);
    if (full) {
      requestFeedJump(entry.articleId);
      navigate("home");
      return;
    }
    window.open(entry.articleUrl, "_blank", "noopener,noreferrer");
  };

  const showSignedOutState = !user && isGuest;

  return (
    <div className="pf-page relative flex h-full flex-col bg-pocket-bg text-pocket-text">
      <header
        className="flex shrink-0 flex-col border-b border-[var(--pocket-border)] px-5"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div className="flex items-center justify-between pb-3 pt-1.5">
          <h1 className="text-[1.625rem] font-bold tracking-tight">Saved</h1>
          {savedArticles.length > 0 && (
            <span className="text-[13px] font-medium text-pocket-muted">
              {savedArticles.length} saved
            </span>
          )}
        </div>
      </header>

      <div
        className="min-h-0 flex-1 overflow-y-auto px-5 pt-4"
        style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}
      >
        <div style={tabEnterStyle(entered)}>
          {showSignedOutState ? (
            <EmptyState
              title="Sign in to save stories"
              body="Create an account to bookmark articles and pick up where you left off."
              actionLabel="Sign in"
              onAction={requestSignIn}
            />
          ) : savedArticles.length === 0 ? (
            <EmptyState
              title="Nothing saved yet"
              body="Tap the bookmark icon on any story to save it here for later."
            />
          ) : (
            <ul className="divide-y divide-[var(--pocket-border)] overflow-hidden rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)]">
              {savedArticles.map((entry) => {
                const full = articlesById.get(entry.articleId);
                return (
                  <li key={entry.id}>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <button
                        type="button"
                        data-no-drag
                        onClick={() => openSaved(entry)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left active:opacity-70"
                      >
                        {full?.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={full.imageUrl}
                            alt=""
                            className="h-12 w-12 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="shrink-0 overflow-hidden rounded-lg">
                            <CompanyLogo
                              ticker={entry.ticker}
                              color={tickerColor(entry.ticker)}
                              size={48}
                              shape="square"
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-pocket-text">
                            {full?.headline ?? entry.articleTitle}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-pocket-muted">
                            {entry.ticker && (
                              <span className="font-semibold text-[#00C6C6]">
                                {entry.ticker}
                              </span>
                            )}
                            <span>·</span>
                            <span>{timeAgo(entry.savedAt)}</span>
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-pocket-muted" />
                      </button>
                      <button
                        type="button"
                        data-no-drag
                        aria-label="Remove from Saved"
                        onClick={() => void unsaveArticle(entry.articleId)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full active:bg-[var(--pocket-surface-hover)]"
                      >
                        <Bookmark className="h-[18px] w-[18px] fill-pocket-teal text-pocket-teal" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-4 pt-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--pocket-surface)]">
        <Newspaper className="h-6 w-6 text-pocket-muted" />
      </div>
      <p className="mt-4 text-[15px] font-bold text-pocket-text">{title}</p>
      <p className="mt-1.5 max-w-[260px] text-[13px] leading-relaxed text-pocket-muted">
        {body}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          data-no-drag
          onClick={onAction}
          className="mt-5 rounded-full bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] px-6 py-2.5 text-sm font-bold text-white active:scale-[0.98]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
