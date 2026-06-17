"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, ChevronRight } from "lucide-react";
import {
  BROWSE_CATEGORIES,
  categoryFromSlug,
  categoryToSlug,
  filterArticlesByBrowseCategory,
  type BrowseCategory,
} from "@/lib/browseCategories";
import type { NewsArticle } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { cleanArticleTitle } from "@/lib/sourceBranding";
import { useApp } from "@/context/AppContext";
import { useNavigation } from "@/context/NavigationContext";
import { appPath } from "@/lib/appPaths";

interface BrowsePageProps {
  articles: NewsArticle[];
}

const CATEGORY_META: Record<
  BrowseCategory,
  { emoji: string; description: string }
> = {
  Markets: {
    emoji: "📈",
    description: "Stocks, indices, and market-moving news",
  },
  Technology: {
    emoji: "💻",
    description: "Tech earnings, innovation, and digital trends",
  },
  Economy: {
    emoji: "🌍",
    description: "Macro trends, policy, and economic insights",
  },
  Crypto: {
    emoji: "🪙",
    description: "Digital assets, blockchain, and crypto markets",
  },
  Energy: {
    emoji: "⚡",
    description: "Oil, gas, and clean energy market updates",
  },
  Healthcare: {
    emoji: "🏥",
    description: "Healthcare industry, biotech, and pharma",
  },
  "Real Estate": {
    emoji: "🏠",
    description: "Property markets, REITs, and real estate trends",
  },
  Banking: {
    emoji: "🏦",
    description: "Banks, credit markets, and financial services",
  },
  Commodities: {
    emoji: "🛢️",
    description: "Gold, metals, agriculture, and commodity markets",
  },
  "World Markets": {
    emoji: "🌐",
    description: "Global indices, currencies, and international news",
  },
};

const BOTTOM_PADDING =
  "calc(3rem + max(1.25rem, env(safe-area-inset-bottom)))";

export function BrowsePage({ articles }: BrowsePageProps) {
  const pathname = usePathname();
  const router = useRouter();
  const navigation = useNavigation();
  const { requestFeedJump } = useApp();

  const categorySlug =
    pathname.match(/^\/app\/browse\/([^/]+)$/)?.[1] ?? null;
  const category = categorySlug ? categoryFromSlug(categorySlug) : null;

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of BROWSE_CATEGORIES) {
      counts.set(item, filterArticlesByBrowseCategory(articles, item).length);
    }
    return counts;
  }, [articles]);

  const categoryArticles = useMemo(() => {
    if (!category) return [];
    return filterArticlesByBrowseCategory(articles, category);
  }, [articles, category]);

  const openInFeed = (article: NewsArticle) => {
    requestFeedJump(article.id);
    navigation.navigate("home");
  };

  // ── Category detail page ─────────────────────────────────────────────────
  if (category) {
    const meta = CATEGORY_META[category];
    const topStory = categoryArticles[0] ?? null;
    const latestStories = categoryArticles.slice(1);
    const count = categoryArticles.length;

    return (
      <div className="flex h-full min-h-0 flex-col bg-black text-white">
        <div className="relative z-20 shrink-0 border-b border-white/[0.06] bg-black after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-4 after:bg-gradient-to-b after:from-black after:to-transparent after:content-['']">
          <header className="flex items-center gap-3 px-4 pb-2.5 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <button
              type="button"
              data-no-drag
              onClick={() =>
                router.replace(appPath("browse"), { scroll: false })
              }
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-white/10"
              aria-label="Back to categories"
            >
              <ArrowLeft className="h-6 w-6 text-white" />
            </button>
            <h1 className="text-lg font-bold text-white">{category}</h1>
          </header>
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          style={{ paddingBottom: BOTTOM_PADDING }}
        >
          {/* Category info card */}
          <div className="mx-4 mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-4">
            <div className="flex items-start gap-4">
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-3xl leading-none"
                aria-hidden
              >
                {meta.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-bold text-white">{category}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-zinc-400">
                  {meta.description}
                </p>
                <div className="mt-2 flex items-center gap-2 text-[11px]">
                  <span className="font-medium text-zinc-500">
                    {count === 1 ? "1 story" : `${count} stories`}
                  </span>
                  {count > 0 && (
                    <>
                      <span className="text-zinc-700">·</span>
                      <span className="text-zinc-500">Updated today</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {count === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-zinc-500">
              No articles in this category yet
            </p>
          ) : (
            <>
              {/* Top story */}
              {topStory && (
                <section className="mt-5 px-4">
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                    Top story
                  </h2>
                  <button
                    type="button"
                    data-no-drag
                    onClick={() => openInFeed(topStory)}
                    className="w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] text-left active:bg-white/[0.06]"
                  >
                    {topStory.imageUrl ? (
                      <div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-900">
                        <Image
                          src={topStory.imageUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="(max-width: 430px) calc(100vw - 2rem)"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-800">
                        <span
                          className="text-5xl opacity-20"
                          aria-hidden
                        >
                          {meta.emoji}
                        </span>
                      </div>
                    )}
                    <div className="px-4 py-3.5">
                      <p className="line-clamp-2 text-[16px] font-bold leading-snug text-white">
                        {cleanArticleTitle(topStory.headline)}
                      </p>
                      {topStory.subheading && (
                        <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-zinc-400">
                          {topStory.subheading}
                        </p>
                      )}
                      <p className="mt-2.5 text-[11px] text-zinc-500">
                        {topStory.sourceName}
                        <span className="mx-1.5 text-zinc-700">·</span>
                        {timeAgo(topStory.publishedAt)}
                      </p>
                    </div>
                  </button>
                </section>
              )}

              {/* Latest stories */}
              {latestStories.length > 0 && (
                <section className="mt-5 px-4">
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                    Latest stories
                  </h2>
                  <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
                    {latestStories.map((article, index) => (
                      <div key={article.id}>
                        <button
                          type="button"
                          data-no-drag
                          onClick={() => openInFeed(article)}
                          className="flex w-full flex-col gap-1 px-4 py-3.5 text-left active:bg-white/[0.04]"
                        >
                          <p className="line-clamp-2 text-[14px] font-semibold leading-snug text-white">
                            {cleanArticleTitle(article.headline)}
                          </p>
                          {article.subheading ? (
                            <p className="line-clamp-2 text-[12px] leading-snug text-zinc-500">
                              {article.subheading}
                            </p>
                          ) : null}
                          <p className="mt-0.5 text-[11px] text-zinc-600">
                            {article.sourceName}
                            <span className="mx-1.5 text-zinc-700">·</span>
                            {timeAgo(article.publishedAt)}
                          </p>
                        </button>
                        {index < latestStories.length - 1 && (
                          <div className="mx-4 h-px bg-white/[0.06]" aria-hidden />
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Browse landing ────────────────────────────────────────────────────────
  return (
    <div className="flex h-full min-h-0 flex-col bg-black text-white">
      <div className="relative z-20 shrink-0 bg-black after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-4 after:bg-gradient-to-b after:from-black after:to-transparent after:content-['']">
        <header className="px-5 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <h1 className="text-[28px] font-bold tracking-tight text-white">
            Browse
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Explore markets, sectors, and business trends
          </p>
        </header>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-3"
        style={{ paddingBottom: BOTTOM_PADDING }}
      >
        <div className="flex flex-col gap-2">
          {BROWSE_CATEGORIES.map((item) => {
            const meta = CATEGORY_META[item];
            const count = categoryCounts.get(item) ?? 0;
            const isCrypto = item === "Crypto";

            if (isCrypto) {
              return (
                <div
                  key={item}
                  className="flex items-center gap-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 opacity-60"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-xl leading-none"
                    aria-hidden
                  >
                    {meta.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-zinc-400">
                      {item}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-snug text-zinc-600">
                      {meta.description}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-zinc-800 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                    Coming soon
                  </span>
                </div>
              );
            }

            return (
              <button
                key={item}
                type="button"
                data-no-drag
                onClick={() =>
                  router.replace(
                    appPath(`browse/${categoryToSlug(item)}`),
                    { scroll: false }
                  )
                }
                className="flex items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-left transition-colors active:bg-white/[0.06]"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-xl leading-none"
                  aria-hidden
                >
                  {meta.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-white">{item}</p>
                  <p className="mt-0.5 text-[12px] leading-snug text-zinc-500">
                    {meta.description}
                  </p>
                </div>
                <span className="shrink-0 text-[12px] tabular-nums text-zinc-500">
                  {count === 1 ? "1 story" : `${count} stories`}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
