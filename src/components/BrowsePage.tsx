"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import {
  BROWSE_CATEGORIES,
  categoryFromSlug,
  categoryToSlug,
  filterArticlesByBrowseCategory,
} from "@/lib/browseCategories";
import type { NewsArticle } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { cleanArticleTitle } from "@/lib/sourceBranding";
import { useApp } from "@/context/AppContext";
import { useNavigation } from "@/context/NavigationContext";

interface BrowsePageProps {
  articles: NewsArticle[];
}

export function BrowsePage({ articles }: BrowsePageProps) {
  const pathname = usePathname();
  const router = useRouter();
  const navigation = useNavigation();
  const { requestFeedJump } = useApp();

  const categorySlug = pathname.match(/^\/browse\/([^/]+)$/)?.[1] ?? null;
  const category = categorySlug ? categoryFromSlug(categorySlug) : null;

  const categoryArticles = useMemo(() => {
    if (!category) return [];
    return filterArticlesByBrowseCategory(articles, category);
  }, [articles, category]);

  const openInFeed = (article: NewsArticle) => {
    requestFeedJump(article.id);
    navigation.navigate("home");
  };

  if (category) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-black">
        <header className="flex shrink-0 items-center gap-3 border-b border-white/[0.06] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <button
            type="button"
            data-no-drag
            onClick={() => router.replace("/browse", { scroll: false })}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-white/10"
            aria-label="Back to categories"
          >
            <ArrowLeft className="h-6 w-6 text-white" />
          </button>
          <h1 className="text-lg font-bold text-white">{category}</h1>
        </header>

        <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {categoryArticles.length === 0 ? (
            <li className="px-4 py-12 text-center text-sm text-zinc-500">
              No articles in this category yet
            </li>
          ) : (
            categoryArticles.map((article, index) => (
              <li key={article.id}>
                <button
                  type="button"
                  data-no-drag
                  onClick={() => openInFeed(article)}
                  className="flex w-full flex-col gap-1 px-4 py-3.5 text-left active:bg-white/[0.04]"
                >
                  <p className="line-clamp-2 text-[15px] font-semibold leading-snug text-white">
                    {cleanArticleTitle(article.headline)}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {article.sourceName}
                    <span className="mx-1.5 text-zinc-700">·</span>
                    {timeAgo(article.publishedAt)}
                  </p>
                </button>
                {index < categoryArticles.length - 1 && (
                  <div className="mx-4 h-px bg-white/[0.06]" aria-hidden />
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-black">
      <header className="shrink-0 border-b border-white/[0.06] px-5 py-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <h1 className="text-xl font-bold text-white">Browse</h1>
        <p className="mt-1 text-sm text-zinc-500">Explore by topic</p>
      </header>

      <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {BROWSE_CATEGORIES.map((item, index) => (
          <li key={item}>
            <button
              type="button"
              data-no-drag
              onClick={() =>
                router.replace(`/browse/${categoryToSlug(item)}`, {
                  scroll: false,
                })
              }
              className="flex w-full items-center justify-between px-5 py-4 text-left active:bg-white/[0.04]"
            >
              <span className="text-[15px] font-medium text-white">{item}</span>
              <ChevronRight className="h-5 w-5 text-zinc-500" />
            </button>
            {index < BROWSE_CATEGORIES.length - 1 && (
              <div className="mx-5 h-px bg-white/[0.06]" aria-hidden />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
