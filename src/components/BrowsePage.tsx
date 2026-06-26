"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Cpu,
  Globe,
  Zap,
  Activity,
  Building2,
  Landmark,
  BarChart2,
  Globe2,
  Bitcoin,
} from "lucide-react";
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

/* ── Category tokens ─────────────────────────────────────────────────────── */

type LucideIcon = React.ComponentType<{
  className?: string;
  style?: React.CSSProperties;
}>;

interface CategoryToken {
  description: string;
  Icon: LucideIcon;
  accent: string;
  tileBg: string;
  cardGradient: string;
}

const CATEGORY_TOKENS: Record<BrowseCategory, CategoryToken> = {
  Markets: {
    description: "Stocks, indices, and market-moving news",
    Icon: TrendingUp,
    accent: "#60a5fa",
    tileBg: "rgba(59,130,246,.12)",
    cardGradient: "linear-gradient(135deg,#070d1e 0%,#061320 100%)",
  },
  Technology: {
    description: "Tech earnings, innovation, and digital trends",
    Icon: Cpu,
    accent: "#a78bfa",
    tileBg: "rgba(139,92,246,.12)",
    cardGradient: "linear-gradient(135deg,#0b091e 0%,#0e0720 100%)",
  },
  Economy: {
    description: "Macro trends, policy, and economic insights",
    Icon: Globe,
    accent: "#34d399",
    tileBg: "rgba(52,211,153,.12)",
    cardGradient: "linear-gradient(135deg,#030f0b 0%,#040f18 100%)",
  },
  Crypto: {
    description: "Digital assets, blockchain, and crypto markets",
    Icon: Bitcoin,
    accent: "#52525b",
    tileBg: "rgba(82,82,91,.08)",
    cardGradient: "linear-gradient(135deg,#09090E 0%,#09090E 100%)",
  },
  Energy: {
    description: "Oil, gas, and clean energy market updates",
    Icon: Zap,
    accent: "#f59e0b",
    tileBg: "rgba(245,158,11,.10)",
    cardGradient: "linear-gradient(135deg,#120e03 0%,#150f02 100%)",
  },
  Healthcare: {
    description: "Healthcare industry, biotech, and pharma",
    Icon: Activity,
    accent: "#f87171",
    tileBg: "rgba(248,113,113,.10)",
    cardGradient: "linear-gradient(135deg,#140608 0%,#160408 100%)",
  },
  "Real Estate": {
    description: "Property markets, REITs, and real estate trends",
    Icon: Building2,
    accent: "#4ade80",
    tileBg: "rgba(74,222,128,.10)",
    cardGradient: "linear-gradient(135deg,#040f07 0%,#040f0b 100%)",
  },
  Banking: {
    description: "Banks, credit markets, and financial services",
    Icon: Landmark,
    accent: "#7dd3fc",
    tileBg: "rgba(125,211,252,.10)",
    cardGradient: "linear-gradient(135deg,#060e18 0%,#050c18 100%)",
  },
  Commodities: {
    description: "Gold, metals, agriculture, and commodity markets",
    Icon: BarChart2,
    accent: "#fbbf24",
    tileBg: "rgba(251,191,36,.10)",
    cardGradient: "linear-gradient(135deg,#121003 0%,#131002 100%)",
  },
  "World Markets": {
    description: "Global indices, currencies, and international news",
    Icon: Globe2,
    accent: "#22d3ee",
    tileBg: "rgba(34,211,238,.10)",
    cardGradient: "linear-gradient(135deg,#031218 0%,#040e18 100%)",
  },
};

/* ── Layout constants ────────────────────────────────────────────────────── */

const PAGE_BG = "#030305";
const CARD_SURFACE = "#09090E";
const BOTTOM_PADDING = "calc(9rem + env(safe-area-inset-bottom))";

const FEATURED_CATEGORIES: BrowseCategory[] = ["Markets", "Technology", "Economy"];
const ALL_TOPICS: BrowseCategory[] = BROWSE_CATEGORIES.filter(
  (c) => !FEATURED_CATEGORIES.includes(c)
);

/** Very subtle grid for cards — texture only, not a visual element */
const GRID_TEXTURE_SUBTLE: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(rgba(255,255,255,.010) 1px,transparent 1px)," +
    "linear-gradient(90deg,rgba(255,255,255,.010) 1px,transparent 1px)",
  backgroundSize: "24px 24px",
};

/** Standard grid for detail-page header/placeholder */
const GRID_TEXTURE: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(rgba(255,255,255,.014) 1px,transparent 1px)," +
    "linear-gradient(90deg,rgba(255,255,255,.014) 1px,transparent 1px)",
  backgroundSize: "24px 24px",
};

/* ── Keyword relevance scoring for featured card selection ───────────────── */

const FEATURED_KEYWORDS: Partial<Record<BrowseCategory, string[]>> = {
  Markets: [
    "stock", "stocks", "market", "markets", "futures", "dow", "s&p", "nasdaq",
    "wall street", "shares", "rally", "selloff", "investors", "earnings",
    "fed", "rates", "yield", "ipo", "valuation", "market cap",
  ],
  Technology: [
    "ai", "chip", "chips", "nvidia", "microsoft", "apple", "google", "meta",
    "amazon", "tesla", "salesforce", "software", "cloud", "semiconductor",
    "tech", "startup", "openai",
  ],
  Economy: [
    "economy", "inflation", "fed", "rates", "jobs", "wages", "gdp",
    "recession", "consumer spending", "tariffs", "oil prices", "gas prices",
    "policy", "central bank",
  ],
};

function scoreArticle(article: NewsArticle, keywords: string[]): number {
  const text =
    `${article.headline} ${article.subheading ?? ""}`.toLowerCase();
  return keywords.reduce(
    (n, kw) => n + (text.includes(kw) ? 1 : 0),
    0
  );
}

/* ── Editorial featured card ─────────────────────────────────────────────── */

function TopStoryCard({
  item,
  article,
  count,
  onClick,
}: {
  item: BrowseCategory;
  article: NewsArticle | null;
  count: number;
  onClick: () => void;
}) {
  const token = CATEGORY_TOKENS[item];
  const { Icon, accent } = token;
  const uid = accent.replace("#", "");

  return (
    <button
      type="button"
      data-no-drag
      onClick={onClick}
      className="relative w-full overflow-hidden rounded-xl text-left active:opacity-80"
      style={{
        border: "1px solid rgba(255,255,255,0.07)",
        background: token.cardGradient,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.06)",
      }}
    >
      {/* Very subtle grid texture */}
      <div className="absolute inset-0" style={GRID_TEXTURE_SUBTLE} />
      {/* Faint sparkline in top-right corner — texture only */}
      <svg
        className="absolute right-0 top-0 h-16 w-28 opacity-[0.12]"
        viewBox="0 0 112 64"
        preserveAspectRatio="none"
        aria-hidden
      >
        <polyline
          points="0,56 20,44 40,48 60,32 80,24 100,28 112,16"
          fill="none"
          stroke={accent}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>

      {/* Content */}
      <div className="relative px-4 py-3">
        {/* Category row */}
        <div className="mb-2 flex items-center gap-1.5">
          <span
            className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md"
            style={{ background: token.tileBg }}
          >
            <Icon className="h-[11px] w-[11px]" style={{ color: accent }} />
          </span>
          <span
            className="text-[11px] font-semibold"
            style={{ color: accent }}
          >
            {item}
          </span>
          <span className="ml-auto text-[10px] tabular-nums text-zinc-600">
            {count === 1 ? "1 story" : `${count} stories`}
          </span>
        </div>

        {article ? (
          <>
            <p className="line-clamp-2 text-[14px] font-bold leading-snug text-white">
              {cleanArticleTitle(article.headline)}
            </p>
            {article.subheading && (
              <p className="mt-1 line-clamp-1 text-[11px] leading-snug text-zinc-500">
                {article.subheading}
              </p>
            )}
            <p className="mt-1.5 text-[10px] text-zinc-700">
              {article.sourceName}
              <span className="mx-1">·</span>
              {timeAgo(article.publishedAt)}
            </p>
          </>
        ) : (
          <p className="text-[13px] leading-snug text-zinc-500">
            {token.description}
          </p>
        )}
      </div>
    </button>
  );
}

/* ── Editorial placeholder for Top Story (detail page) ──────────────────── */

function EditorialPlaceholder({ accent }: { accent: string }) {
  const uid = accent.replace("#", "");
  return (
    <div
      className="relative h-[80px] w-full overflow-hidden"
      style={{
        background: "linear-gradient(135deg,#07090F 0%,#090C15 100%)",
        boxShadow: `inset 0 0 40px ${accent}06`,
      }}
    >
      <div className="absolute inset-0" style={GRID_TEXTURE} />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 200 56"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id={`ep-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.11" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points="0,48 28,40 56,43 84,30 112,24 140,28 168,15 200,10 200,56 0,56"
          fill={`url(#ep-${uid})`}
        />
        <polyline
          points="0,48 28,40 56,43 84,30 112,24 140,28 168,15 200,10"
          fill="none"
          stroke={accent}
          strokeWidth="1.5"
          strokeOpacity="0.32"
          strokeLinejoin="round"
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#09090E] to-transparent" />
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */

export function BrowsePage({ articles }: BrowsePageProps) {
  const pathname = usePathname();
  const router = useRouter();
  const navigation = useNavigation();
  const { requestFeedJump } = useApp();

  const categorySlug = pathname.match(/^\/app\/browse\/([^/]+)$/)?.[1] ?? null;
  const category = categorySlug ? categoryFromSlug(categorySlug) : null;

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of BROWSE_CATEGORIES) {
      counts.set(item, filterArticlesByBrowseCategory(articles, item).length);
    }
    return counts;
  }, [articles]);

  /** Top article per category for All Topics rows (no deduplication needed) */
  const categoryTopArticle = useMemo(() => {
    const map = new Map<BrowseCategory, NewsArticle | null>();
    for (const item of BROWSE_CATEGORIES) {
      const filtered = filterArticlesByBrowseCategory(articles, item);
      map.set(item, filtered[0] ?? null);
    }
    return map;
  }, [articles]);

  /**
   * Keyword-scored, deduplicated top articles for the 3 featured cards.
   * Candidates for each category are sorted by keyword-relevance score so
   * the most on-topic article wins. Deduplication across cards is applied
   * after scoring so no two cards share the same headline.
   */
  const featuredTopArticle = useMemo(() => {
    const usedIds = new Set<string>();
    const map = new Map<BrowseCategory, NewsArticle | null>();
    for (const item of FEATURED_CATEGORIES) {
      const filtered = filterArticlesByBrowseCategory(articles, item);
      const keywords = FEATURED_KEYWORDS[item] ?? [];

      // Sort by relevance score descending, preserving recency among ties
      const scored = filtered
        .map((a) => ({ a, score: scoreArticle(a, keywords) }))
        .sort((x, y) => y.score - x.score);

      // Pick highest-scoring article not already used
      const best = scored.find(({ a }) => !usedIds.has(a.id));
      if (best) {
        usedIds.add(best.a.id);
        map.set(item, best.a);
      } else {
        // Fallback: first unique article regardless of score
        const fallback = filtered.find((a) => !usedIds.has(a.id));
        const pick = fallback ?? filtered[0] ?? null;
        if (pick) usedIds.add(pick.id);
        map.set(item, pick);
      }
    }
    return map;
  }, [articles]);

  const categoryArticles = useMemo(() => {
    if (!category) return [];
    return filterArticlesByBrowseCategory(articles, category);
  }, [articles, category]);

  const [topStoryImageFailed, setTopStoryImageFailed] = useState(false);
  useEffect(() => {
    setTopStoryImageFailed(false);
  }, [category]);

  const openInFeed = (article: NewsArticle) => {
    requestFeedJump(article.id);
    navigation.navigate("home");
  };

  const navigateTo = (item: BrowseCategory) =>
    router.replace(appPath(`browse/${categoryToSlug(item)}`), { scroll: false });

  /* ── Category detail ─────────────────────────────────────────────────── */
  if (category) {
    const token = CATEGORY_TOKENS[category];
    const { Icon, accent } = token;
    const topStory = categoryArticles[0] ?? null;
    const latestStories = categoryArticles.slice(1);
    const count = categoryArticles.length;

    return (
      <div className="flex h-full min-h-0 flex-col text-white" style={{ background: PAGE_BG }}>
        {/* Pinned header */}
        <div
          className="relative z-20 shrink-0 border-b border-white/[0.06] after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-5 after:bg-gradient-to-b after:from-[#030305] after:to-transparent after:content-['']"
          style={{ background: PAGE_BG }}
        >
          <header className="flex items-center gap-2 px-2 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
            <button
              type="button"
              data-no-drag
              onClick={() => router.replace(appPath("browse"), { scroll: false })}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-white/[0.08]"
              aria-label="Back to categories"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
            <h1 className="text-[17px] font-semibold text-white">{category}</h1>
          </header>
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          style={{ paddingBottom: BOTTOM_PADDING }}
        >
          {/* Category summary card */}
          <div
            className="relative mx-4 mt-4 overflow-hidden rounded-xl border border-white/[0.07]"
            style={{ background: CARD_SURFACE, boxShadow: `inset 0 0 40px ${accent}06` }}
          >
            <div className="absolute inset-0" style={GRID_TEXTURE} />
            <div className="relative flex items-center gap-3 px-4 py-3.5">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: token.tileBg }}
              >
                <Icon className="h-[18px] w-[18px]" style={{ color: accent }} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-white">{category}</p>
                <p className="mt-0.5 text-[12px] leading-snug text-zinc-500">
                  {token.description}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[12px] font-medium text-zinc-400">
                  {count === 1 ? "1 story" : `${count} stories`}
                </p>
                {count > 0 && (
                  <p className="mt-0.5 text-[11px] text-zinc-600">Updated today</p>
                )}
              </div>
            </div>
          </div>

          {count === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-zinc-600">
              No articles in this category yet
            </p>
          ) : (
            <>
              {topStory && (
                <section className="mt-5 px-4">
                  <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
                    Top story
                  </p>
                  <button
                    type="button"
                    data-no-drag
                    onClick={() => openInFeed(topStory)}
                    className="w-full overflow-hidden rounded-xl text-left active:opacity-80"
                    style={{
                      border: "1px solid rgba(255,255,255,0.07)",
                      boxShadow: `0 0 28px ${accent}0B`,
                    }}
                  >
                    {topStory.imageUrl && !topStoryImageFailed ? (
                      <div className="relative aspect-[16/8] w-full overflow-hidden">
                        <Image
                          src={topStory.imageUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="(max-width: 430px) calc(100vw - 2rem)"
                          unoptimized
                          onError={() => setTopStoryImageFailed(true)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      </div>
                    ) : (
                      <EditorialPlaceholder accent={accent} />
                    )}
                    <div className="px-4 pb-4 pt-3" style={{ background: CARD_SURFACE }}>
                      <p className="line-clamp-2 text-[15px] font-bold leading-snug text-white">
                        {cleanArticleTitle(topStory.headline)}
                      </p>
                      {topStory.subheading && (
                        <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-zinc-500">
                          {topStory.subheading}
                        </p>
                      )}
                      <p className="mt-2 text-[11px] text-zinc-600">
                        {topStory.sourceName}
                        <span className="mx-1.5">·</span>
                        {timeAgo(topStory.publishedAt)}
                      </p>
                    </div>
                  </button>
                </section>
              )}

              {latestStories.length > 0 && (
                <section className="mt-5 px-4">
                  <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
                    Latest stories
                  </p>
                  <div
                    className="overflow-hidden rounded-xl border border-white/[0.07]"
                    style={{ background: CARD_SURFACE }}
                  >
                    {latestStories.map((article, index) => (
                      <div key={article.id}>
                        <button
                          type="button"
                          data-no-drag
                          onClick={() => openInFeed(article)}
                          className="flex w-full flex-col px-4 py-3 text-left active:bg-white/[0.03]"
                        >
                          <p className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-white">
                            {cleanArticleTitle(article.headline)}
                          </p>
                          {article.subheading && (
                            <p className="mt-0.5 line-clamp-1 text-[11px] text-zinc-500">
                              {article.subheading}
                            </p>
                          )}
                          <p className="mt-1 text-[11px] text-zinc-600">
                            {article.sourceName}
                            <span className="mx-1.5">·</span>
                            {timeAgo(article.publishedAt)}
                          </p>
                        </button>
                        {index < latestStories.length - 1 && (
                          <div className="mx-4 h-px bg-white/[0.05]" aria-hidden />
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

  /* ── Browse landing ──────────────────────────────────────────────────── */
  return (
    <div className="flex h-full min-h-0 flex-col text-white" style={{ background: PAGE_BG }}>
      {/* Pinned header */}
      <div
        className="relative z-20 shrink-0 after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-5 after:bg-gradient-to-b after:from-[#030305] after:to-transparent after:content-['']"
        style={{ background: PAGE_BG }}
      >
        <header className="px-5 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
          <h1 className="text-[28px] font-bold tracking-tight text-white">Discover</h1>
          <p className="mt-0.5 text-[13px] text-zinc-500">
            Find the stories and themes moving markets
          </p>
        </header>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        style={{ paddingBottom: BOTTOM_PADDING }}
      >
        {/* ── Top stories by topic ──────────────────────────────────────── */}
        <section className="px-4 pt-3">
          <p className="mb-3 text-[13px] font-semibold text-white">
            Top stories by topic
          </p>
          <div className="flex flex-col gap-2.5">
            {FEATURED_CATEGORIES.map((item) => (
              <TopStoryCard
                key={item}
                item={item}
                article={featuredTopArticle.get(item) ?? null}
                count={categoryCounts.get(item) ?? 0}
                onClick={() => navigateTo(item)}
              />
            ))}
          </div>
        </section>

        {/* ── All topics ───────────────────────────────────────────────── */}
        <section className="mt-5 px-4">
          <p className="mb-3 text-[13px] font-semibold text-white">All topics</p>
          <div
            className="overflow-hidden rounded-xl border border-white/[0.06]"
            style={{
              background: "rgba(9,9,14,0.60)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.03)",
            }}
          >
            {ALL_TOPICS.map((item, index) => {
              const token = CATEGORY_TOKENS[item];
              const { Icon, accent } = token;
              const count = categoryCounts.get(item) ?? 0;
              const topArticle = categoryTopArticle.get(item) ?? null;
              const isCrypto = item === "Crypto";

              return (
                <div key={item}>
                  {isCrypto ? (
                    <div className="flex items-center gap-3 px-4 py-2.5 opacity-40">
                      <div
                        className="h-4 w-[3px] shrink-0 rounded-r-full"
                        style={{ background: accent }}
                      />
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: token.tileBg }}
                      >
                        <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-zinc-400">{item}</p>
                        <p className="mt-0.5 line-clamp-1 text-[10.5px] text-zinc-600">
                          {token.description}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                        Soon
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      data-no-drag
                      onClick={() => navigateTo(item)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left active:bg-white/[0.03]"
                    >
                      <div
                        className="h-4 w-[3px] shrink-0 rounded-r-full opacity-60"
                        style={{ background: accent }}
                      />
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: token.tileBg }}
                      >
                        <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-white">{item}</p>
                        <p className="mt-0.5 line-clamp-1 text-[10.5px] text-zinc-500">
                          {topArticle
                            ? cleanArticleTitle(topArticle.headline)
                            : token.description}
                        </p>
                      </div>
                      <span className="shrink-0 text-[10.5px] tabular-nums text-zinc-700">
                        {count === 1 ? "1 story" : `${count} stories`}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-700" />
                    </button>
                  )}
                  {index < ALL_TOPICS.length - 1 && (
                    <div className="mx-4 h-px bg-white/[0.05]" aria-hidden />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
