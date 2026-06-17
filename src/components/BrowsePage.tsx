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

/* ── Per-category visual tokens ─────────────────────────────────────────── */

interface CategoryMeta {
  emoji: string;
  description: string;
  /** CSS gradient for the small emoji icon tile */
  tileBg: string;
  /** CSS gradient for header cards / top-story placeholder */
  heroBg: string;
  /** CSS rgba border colour */
  borderColor: string;
}

const CATEGORY_META: Record<BrowseCategory, CategoryMeta> = {
  Markets: {
    emoji: "📈",
    description: "Stocks, indices, and market-moving news",
    tileBg: "linear-gradient(135deg,rgba(29,78,216,.55),rgba(8,145,178,.38))",
    heroBg: "linear-gradient(135deg,#0b1a38 0%,#061622 100%)",
    borderColor: "rgba(29,78,216,.22)",
  },
  Technology: {
    emoji: "💻",
    description: "Tech earnings, innovation, and digital trends",
    tileBg: "linear-gradient(135deg,rgba(79,70,229,.55),rgba(124,58,237,.38))",
    heroBg: "linear-gradient(135deg,#14103a 0%,#190a2e 100%)",
    borderColor: "rgba(79,70,229,.22)",
  },
  Economy: {
    emoji: "🌍",
    description: "Macro trends, policy, and economic insights",
    tileBg: "linear-gradient(135deg,rgba(5,150,105,.55),rgba(8,145,178,.38))",
    heroBg: "linear-gradient(135deg,#071d17 0%,#051720 100%)",
    borderColor: "rgba(5,150,105,.22)",
  },
  Crypto: {
    emoji: "🪙",
    description: "Digital assets, blockchain, and crypto markets",
    tileBg: "linear-gradient(135deg,rgba(107,114,128,.38),rgba(76,29,149,.28))",
    heroBg: "linear-gradient(135deg,#111118 0%,#0d0a1a 100%)",
    borderColor: "rgba(107,114,128,.16)",
  },
  Energy: {
    emoji: "⚡",
    description: "Oil, gas, and clean energy market updates",
    tileBg: "linear-gradient(135deg,rgba(217,119,6,.55),rgba(234,88,12,.38))",
    heroBg: "linear-gradient(135deg,#1e1103 0%,#190e03 100%)",
    borderColor: "rgba(217,119,6,.22)",
  },
  Healthcare: {
    emoji: "🏥",
    description: "Healthcare industry, biotech, and pharma",
    tileBg: "linear-gradient(135deg,rgba(225,29,72,.55),rgba(219,39,119,.38))",
    heroBg: "linear-gradient(135deg,#1e0811 0%,#18050e 100%)",
    borderColor: "rgba(225,29,72,.22)",
  },
  "Real Estate": {
    emoji: "🏠",
    description: "Property markets, REITs, and real estate trends",
    tileBg: "linear-gradient(135deg,rgba(22,163,74,.55),rgba(5,150,105,.38))",
    heroBg: "linear-gradient(135deg,#06180b 0%,#041510 100%)",
    borderColor: "rgba(22,163,74,.22)",
  },
  Banking: {
    emoji: "🏦",
    description: "Banks, credit markets, and financial services",
    tileBg: "linear-gradient(135deg,rgba(29,78,216,.55),rgba(59,130,246,.38))",
    heroBg: "linear-gradient(135deg,#0b1525 0%,#070f1c 100%)",
    borderColor: "rgba(29,78,216,.22)",
  },
  Commodities: {
    emoji: "🛢️",
    description: "Gold, metals, agriculture, and commodity markets",
    tileBg: "linear-gradient(135deg,rgba(217,119,6,.55),rgba(245,158,11,.38))",
    heroBg: "linear-gradient(135deg,#1e1502 0%,#191002 100%)",
    borderColor: "rgba(217,119,6,.22)",
  },
  "World Markets": {
    emoji: "🌐",
    description: "Global indices, currencies, and international news",
    tileBg: "linear-gradient(135deg,rgba(8,145,178,.55),rgba(59,130,246,.38))",
    heroBg: "linear-gradient(135deg,#05131e 0%,#040e1c 100%)",
    borderColor: "rgba(8,145,178,.22)",
  },
};

const CATEGORY_BOTTOM_PADDING =
  "calc(9rem + env(safe-area-inset-bottom))";

const BROWSE_BOTTOM_PADDING =
  "calc(3rem + max(1.25rem, env(safe-area-inset-bottom)))";

/* ── Component ───────────────────────────────────────────────────────────── */

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

  /* ── Category detail ──────────────────────────────────────────────────── */
  if (category) {
    const meta = CATEGORY_META[category];
    const topStory = categoryArticles[0] ?? null;
    const latestStories = categoryArticles.slice(1);
    const count = categoryArticles.length;

    return (
      <div className="flex h-full min-h-0 flex-col bg-black text-white">
        {/* Pinned header */}
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
          style={{ paddingBottom: CATEGORY_BOTTOM_PADDING }}
        >
          {/* Category info card */}
          <div
            className="mx-4 mt-4 overflow-hidden rounded-2xl"
            style={{ border: `1px solid ${meta.borderColor}` }}
          >
            <div
              className="flex items-center gap-3.5 px-4 py-3.5"
              style={{ background: meta.heroBg }}
            >
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl leading-none"
                style={{ background: meta.tileBg }}
                aria-hidden
              >
                {meta.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-bold text-white">{category}</p>
                <p className="mt-0.5 text-[12px] leading-snug text-white/55">
                  {meta.description}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-white/40">
                  <span>{count === 1 ? "1 story" : `${count} stories`}</span>
                  {count > 0 && (
                    <>
                      <span>·</span>
                      <span>Updated today</span>
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
                    className="w-full overflow-hidden rounded-2xl text-left active:opacity-80"
                    style={{ border: `1px solid ${meta.borderColor}` }}
                  >
                    {topStory.imageUrl ? (
                      <div className="relative aspect-[16/8] w-full overflow-hidden">
                        <Image
                          src={topStory.imageUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="(max-width: 430px) calc(100vw - 2rem)"
                          unoptimized
                        />
                        {/* Dark gradient overlay for readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>
                    ) : (
                      /* Designed gradient placeholder — no grey void */
                      <div
                        className="relative flex h-[120px] w-full items-center justify-center overflow-hidden"
                        style={{ background: meta.heroBg }}
                      >
                        <span
                          className="select-none text-[96px] leading-none opacity-[0.09]"
                          aria-hidden
                        >
                          {meta.emoji}
                        </span>
                      </div>
                    )}
                    <div
                      className="px-4 py-3.5"
                      style={{ background: meta.heroBg }}
                    >
                      <p className="line-clamp-2 text-[15px] font-bold leading-snug text-white">
                        {cleanArticleTitle(topStory.headline)}
                      </p>
                      {topStory.subheading && (
                        <p className="mt-1.5 line-clamp-2 text-[12px] leading-snug text-white/55">
                          {topStory.subheading}
                        </p>
                      )}
                      <p className="mt-2 text-[11px] text-white/40">
                        {topStory.sourceName}
                        <span className="mx-1.5 opacity-50">·</span>
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
                  <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">
                    {latestStories.map((article, index) => (
                      <div key={article.id}>
                        <button
                          type="button"
                          data-no-drag
                          onClick={() => openInFeed(article)}
                          className="flex w-full flex-col gap-1 px-4 py-3 text-left active:bg-white/[0.04]"
                        >
                          <p className="line-clamp-2 text-[14px] font-semibold leading-snug text-white">
                            {cleanArticleTitle(article.headline)}
                          </p>
                          {article.subheading ? (
                            <p className="line-clamp-1 text-[11px] leading-snug text-zinc-500">
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

  /* ── Browse landing ───────────────────────────────────────────────────── */
  return (
    <div className="flex h-full min-h-0 flex-col bg-black text-white">
      {/* Pinned header */}
      <div className="relative z-20 shrink-0 bg-black after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-4 after:bg-gradient-to-b after:from-black after:to-transparent after:content-['']">
        <header className="px-5 pb-2.5 pt-[max(0.75rem,env(safe-area-inset-top))]">
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
        style={{ paddingBottom: BROWSE_BOTTOM_PADDING }}
      >
        <div className="flex flex-col gap-1.5">
          {BROWSE_CATEGORIES.map((item) => {
            const meta = CATEGORY_META[item];
            const count = categoryCounts.get(item) ?? 0;
            const isCrypto = item === "Crypto";

            if (isCrypto) {
              return (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 opacity-50"
                  style={{ background: "#0e0e12", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg leading-none"
                    style={{ background: meta.tileBg }}
                    aria-hidden
                  >
                    {meta.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-zinc-400">{item}</p>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-zinc-600">
                      {meta.description}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-zinc-800/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
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
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left active:opacity-75"
                style={{
                  background: "#0e0e12",
                  border: `1px solid ${meta.borderColor}`,
                }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg leading-none"
                  style={{ background: meta.tileBg }}
                  aria-hidden
                >
                  {meta.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-white">{item}</p>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-zinc-500">
                    {meta.description}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] tabular-nums text-zinc-600">
                  {count === 1 ? "1 story" : `${count} stories`}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-zinc-700" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
