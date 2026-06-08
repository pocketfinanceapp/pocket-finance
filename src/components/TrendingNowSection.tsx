"use client";

import type { NewsArticle } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { cleanArticleTitle } from "@/lib/sourceBranding";
import { TRENDING_NOW_HEIGHT } from "@/lib/layout";

interface TrendingNowSectionProps {
  articles: NewsArticle[];
  onSelectArticle: (articleId: string) => void;
  onSeeAll?: () => void;
}

export function TrendingNowSection({
  articles,
  onSelectArticle,
  onSeeAll,
}: TrendingNowSectionProps) {
  if (articles.length === 0) return null;

  return (
    <section
      data-no-drag
      className="shrink-0 border-b border-white/[0.08] bg-[#0a0a0a]"
      style={{ height: TRENDING_NOW_HEIGHT }}
    >
      <div className="flex items-center justify-between px-4 pb-2 pt-3">
        <h2 className="text-[15px] font-bold tracking-tight text-white">
          Trending Now
        </h2>
        <button
          type="button"
          data-no-drag
          onClick={onSeeAll}
          className="text-[12px] font-semibold text-zinc-500 active:text-white"
        >
          See All
        </button>
      </div>

      <ul className="h-[calc(100%-40px)] overflow-y-auto overscroll-contain">
        {articles.map((article, index) => (
          <li key={article.id}>
            <button
              type="button"
              data-no-drag
              onClick={() => onSelectArticle(article.id)}
              className="flex w-full gap-3 px-4 py-2.5 text-left active:bg-white/[0.04]"
            >
              <span className="w-6 shrink-0 text-[22px] font-bold leading-none text-zinc-600">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-white">
                  {cleanArticleTitle(article.headline)}
                </p>
                <p className="mt-1 truncate text-[11px] text-zinc-500">
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
    </section>
  );
}
