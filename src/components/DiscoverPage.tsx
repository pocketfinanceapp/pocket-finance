"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useNavigation } from "@/context/NavigationContext";
import type { NewsArticle } from "@/lib/types";
import { appPath } from "@/lib/appPaths";
import {
  BROWSE_CATEGORIES,
  categoryToSlug,
  filterArticlesByBrowseCategory,
  type BrowseCategory,
} from "@/lib/browseCategories";
import { tabEnterStyle, useTabPageEntered } from "@/lib/tabEnterAnimation";
import { buildWatchlistItems } from "@/lib/watchlistUtils";
import { getDismissedWatchlistTickers } from "@/lib/watchlistStore";
import { timeAgo } from "@/lib/utils";
import { cleanArticleTitle } from "@/lib/sourceBranding";

interface DiscoverPageProps {
  articles: NewsArticle[];
}

export function DiscoverPage({ articles }: DiscoverPageProps) {
  const router = useRouter();
  const navigation = useNavigation();
  const tabEntered = useTabPageEntered("discover");
  const { savedArticles, requestFeedJump } = useApp();
  const [expandedTopics, setExpandedTopics] = useState<Set<BrowseCategory>>(
    new Set()
  );

  const watchlistItems = useMemo(() => {
    const dismissed = getDismissedWatchlistTickers();
    return buildWatchlistItems(savedArticles).filter(
      (item) => !dismissed.has(item.ticker)
    );
  }, [savedArticles]);

  const savedWatchlistItems = useMemo(
    () => watchlistItems.slice(0, 6),
    [watchlistItems]
  );

  const topicRows = useMemo(() => {
    return BROWSE_CATEGORIES.map((topic) => {
      const topicArticles = filterArticlesByBrowseCategory(articles, topic);
      return {
        topic,
        count: topicArticles.length,
        latest: topicArticles[0] ?? null,
        articles: topicArticles.slice(0, 6),
      };
    });
  }, [articles]);

  const articleById = useMemo(() => {
    return new Map(articles.map((a) => [a.id, a]));
  }, [articles]);

  const openTopic = (topic: BrowseCategory) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) next.delete(topic);
      else next.add(topic);
      return next;
    });
  };

  const openSavedWatchlistItem = (articleId: string) => {
    requestFeedJump(articleId);
    navigation.navigate("home");
  };

  const openTopicArticle = (articleId: string) => {
    requestFeedJump(articleId);
    navigation.navigate("home");
  };

  return (
    <div className="pf-page flex h-full min-h-0 flex-col bg-pocket-bg text-pocket-text">
      <header
        className="shrink-0 px-5 pb-2"
        style={{
          paddingTop: "max(12px, env(safe-area-inset-top))",
          ...tabEnterStyle(tabEntered, 0),
        }}
      >
        <h1 className="text-[28px] font-bold tracking-tight text-pocket-text">
          Discover
        </h1>
        <p className="mt-0.5 text-[13px] text-pocket-muted">
          Saved watchlist items and fresh themes, all in one place
        </p>
      </header>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(9rem+env(safe-area-inset-bottom))]"
        style={tabEnterStyle(tabEntered, 80)}
      >
        <section className="pf-card-surface mt-2 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-pocket-muted">
              Saved Watchlist
            </p>
            <button
              type="button"
              data-no-drag
              className="text-[12px] font-semibold text-pocket-muted active:text-pocket-text"
              onClick={() => router.replace(appPath("watchlist"), { scroll: false })}
            >
              Full watchlist
            </button>
          </div>

          {watchlistItems.length === 0 ? (
            <p className="mt-3 text-[13px] text-pocket-muted">
              Save stories from Home or Markets to start building your watchlist.
            </p>
          ) : (
            <div className="mt-3 space-y-2.5">
              {savedWatchlistItems.map((item) => (
                <button
                  key={`${item.ticker}-${item.latestEntry.id}`}
                  type="button"
                  data-no-drag
                  onClick={() => openSavedWatchlistItem(item.latestEntry.articleId)}
                  className="flex w-full items-center justify-between rounded-xl border border-[var(--pocket-border)] px-3 py-2.5 text-left active:bg-white/[0.03]"
                >
                  <div className="mr-3 h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--pocket-surface-hover)]">
                    {articleById.get(item.latestEntry.articleId)?.imageUrl ? (
                      <Image
                        src={articleById.get(item.latestEntry.articleId)!.imageUrl}
                        alt={item.latestEntry.articleTitle}
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-pocket-muted">
                        {item.ticker}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-pocket-text">{item.ticker}</p>
                    <p className="mt-0.5 line-clamp-1 text-[12px] text-pocket-muted">
                      {cleanArticleTitle(item.latestEntry.articleTitle)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-pocket-muted">
                      Saved {timeAgo(item.latestEntry.savedAt)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-pocket-muted" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="pf-card-surface mt-4 rounded-2xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-pocket-muted">
            Explore Topics
          </p>
          <div className="mt-3 divide-y divide-[var(--pocket-border)] overflow-hidden rounded-xl border border-[var(--pocket-border)]">
            {topicRows.map(({ topic, latest, count, articles: topicArticles }) => {
              const isOpen = expandedTopics.has(topic);
              return (
                <div key={topic} className="w-full">
                  <button
                    type="button"
                    data-no-drag
                    onClick={() => openTopic(topic)}
                    className="w-full px-3 py-3 text-left active:bg-white/[0.03]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-pocket-text">
                          {topic}
                        </p>
                        <p className="mt-0.5 text-[11px] text-pocket-muted">
                          {count} matching stor{count === 1 ? "y" : "ies"}
                        </p>
                        {latest && (
                          <p className="mt-1 line-clamp-1 text-[12px] text-pocket-muted">
                            {cleanArticleTitle(latest.headline)}
                          </p>
                        )}
                      </div>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 shrink-0 text-pocket-muted" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0 text-pocket-muted" />
                      )}
                    </div>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isOpen ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-3 pb-3">
                      <div className="rounded-xl border border-[var(--pocket-border)] bg-[var(--pocket-bg)]">
                        {topicArticles.length === 0 ? (
                          <p className="px-3 py-2.5 text-[12px] text-pocket-muted">
                            No articles yet for this topic.
                          </p>
                        ) : (
                          topicArticles.map((article, index) => (
                            <button
                              key={article.id}
                              type="button"
                              data-no-drag
                              onClick={() => openTopicArticle(article.id)}
                              className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left active:bg-white/[0.03] ${
                                index < topicArticles.length - 1
                                  ? "border-b border-[var(--pocket-border)]"
                                  : ""
                              }`}
                            >
                              <p className="line-clamp-2 text-[12px] text-pocket-text">
                                {cleanArticleTitle(article.headline)}
                              </p>
                              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-pocket-muted" />
                            </button>
                          ))
                        )}
                      </div>
                      <button
                        type="button"
                        data-no-drag
                        onClick={() => router.replace(appPath(`browse/${categoryToSlug(topic)}`), { scroll: false })}
                        className="mt-2 text-[11px] font-semibold text-[#00C6C6]"
                      >
                        Open full {topic} topic
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}
