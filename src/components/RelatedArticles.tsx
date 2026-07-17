"use client";

import Image from "next/image";
import type { NewsArticle } from "@/lib/types";
import { hasUsableFeedImage } from "@/lib/feedImage";
import { cleanArticleTitle } from "@/lib/sourceBranding";

interface RelatedArticlesProps {
  article: NewsArticle;
  items: NewsArticle[];
  loading: boolean;
  onSelect?: (article: NewsArticle) => void;
}

/**
 * "More on this story" — powered by Marketaux's news/similar/{uuid}
 * endpoint. `items`/`loading` come from the shared useSimilarArticles hook
 * (lifted to ArticlePanel so the same fetch also feeds the multi-source
 * Pocket Briefing, instead of each component fetching it separately). Only
 * renders for articles that came from Marketaux (have a marketauxUuid);
 * NewsAPI/demo articles simply don't show this section rather than
 * fabricating related links.
 */
export function RelatedArticles({
  article,
  items,
  loading,
  onSelect,
}: RelatedArticlesProps) {
  const uuid = article.marketauxUuid;

  if (!uuid) return null;
  if (!loading && items.length === 0) return null;

  return (
    <div className="mt-7">
      <h2 className="mb-2.5 text-[13px] font-bold uppercase tracking-widest text-pocket-muted">
        More on this story
      </h2>

      {loading ? (
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[7.5rem] w-44 shrink-0 animate-pulse rounded-2xl bg-[var(--pocket-surface-hover)]"
            />
          ))}
        </div>
      ) : (
        <div className="-mx-5 overflow-x-auto px-5">
          <div className="flex w-max gap-3 pb-1">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                data-no-drag
                onClick={() => onSelect?.(item)}
                className="w-44 shrink-0 rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)] p-2.5 text-left active:opacity-70"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-[var(--pocket-surface-hover)]">
                  {hasUsableFeedImage(item.imageUrl) && (
                    <Image
                      src={item.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="176px"
                      unoptimized
                    />
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-[12px] font-semibold leading-snug text-pocket-text">
                  {cleanArticleTitle(item.headline)}
                </p>
                <p className="mt-1 truncate text-[10px] text-pocket-muted">
                  {item.sourceName}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
