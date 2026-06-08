"use client";

import type { NewsArticle } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { cleanArticleTitle } from "@/lib/sourceBranding";

interface TrendingFeedProps {
  articles: NewsArticle[];
  latestArticles: NewsArticle[];
  onOpenArticle: (article: NewsArticle) => void;
  onJumpToForYou: (article: NewsArticle) => void;
}

function truncateWords(text: string, maxWords: number): string {
  const words = cleanArticleTitle(text).split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return `${words.slice(0, maxWords).join(" ")}…`;
}

export function TrendingFeed({
  articles,
  latestArticles,
  onOpenArticle,
  onJumpToForYou,
}: TrendingFeedProps) {
  return (
    <div
      className="flex h-full min-h-0 flex-col bg-[#0a0a0a]"
      style={{
        paddingTop: "calc(max(0.75rem, env(safe-area-inset-top)) + 3.5rem)",
      }}
    >
      {latestArticles.length > 0 && (
        <section className="shrink-0 border-b border-white/[0.06] pb-3">
          <p className="px-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Latest
          </p>
          <div className="flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
            {latestArticles.map((article) => (
              <button
                key={article.id}
                type="button"
                data-no-drag
                onClick={() => onJumpToForYou(article)}
                className="flex max-w-[220px] shrink-0 items-center gap-2 rounded-full bg-[#1f2937] px-3 py-2 text-left active:opacity-80"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full bg-red-500"
                  aria-hidden
                />
                <span className="min-w-0 text-[11px] font-medium leading-snug text-white">
                  <span className="text-zinc-400">{article.sourceName}</span>
                  <span className="mx-1 text-zinc-600">·</span>
                  {truncateWords(article.headline, 6)}
                  <span className="mx-1 text-zinc-600">·</span>
                  <span className="text-zinc-400">
                    {timeAgo(article.publishedAt)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

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
