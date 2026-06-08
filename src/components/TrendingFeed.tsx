"use client";

import type { FeedMode } from "@/lib/filterArticles";
import type { NewsArticle } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { cleanArticleTitle } from "@/lib/sourceBranding";
import { FeedHeader } from "./FeedHeader";

interface TrendingFeedProps {
  articles: NewsArticle[];
  feedMode: FeedMode;
  onFeedModeChange: (mode: FeedMode) => void;
  onOpenSearch: () => void;
  onOpenArticle: (article: NewsArticle) => void;
}

export function TrendingFeed({
  articles,
  feedMode,
  onFeedModeChange,
  onOpenSearch,
  onOpenArticle,
}: TrendingFeedProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0a0a0a]">
      <FeedHeader
        feedMode={feedMode}
        onFeedModeChange={onFeedModeChange}
        onOpenSearch={onOpenSearch}
      />

      <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {articles.map((article, index) => (
          <li key={article.id}>
            <button
              type="button"
              data-no-drag
              onClick={() => onOpenArticle(article)}
              className="flex w-full gap-3 px-4 py-3.5 text-left active:bg-white/[0.04]"
            >
              <span className="w-7 shrink-0 text-[24px] font-bold leading-none text-zinc-600">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[14px] font-semibold leading-snug text-white">
                  {cleanArticleTitle(article.headline)}
                </p>
                <p className="mt-1.5 truncate text-[11px] text-zinc-500">
                  {article.sourceName}
                  <span className="mx-1.5 text-zinc-700">·</span>
                  {timeAgo(article.publishedAt)}
                </p>
              </div>
            </button>
            {index < articles.length - 1 && (
              <div className="mx-4 h-px bg-white/[0.06]" aria-hidden />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
