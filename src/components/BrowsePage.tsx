"use client";

import { useMemo } from "react";
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

/* ── Category visual tokens ─────────────────────────────────────────────── */

type LucideIcon = React.ComponentType<{
  className?: string;
  style?: React.CSSProperties;
}>;

interface CategoryToken {
  description: string;
  Icon: LucideIcon;
  /** accent color for icon, bar, sparkline */
  accent: string;
  /** very subtle tinted tile bg */
  tileBg: string;
}

const CATEGORY_TOKENS: Record<BrowseCategory, CategoryToken> = {
  Markets: {
    description: "Stocks, indices, and market-moving news",
    Icon: TrendingUp,
    accent: "#60a5fa",
    tileBg: "rgba(59,130,246,.13)",
  },
  Technology: {
    description: "Tech earnings, innovation, and digital trends",
    Icon: Cpu,
    accent: "#a78bfa",
    tileBg: "rgba(139,92,246,.13)",
  },
  Economy: {
    description: "Macro trends, policy, and economic insights",
    Icon: Globe,
    accent: "#34d399",
    tileBg: "rgba(52,211,153,.13)",
  },
  Crypto: {
    description: "Digital assets, blockchain, and crypto markets",
    Icon: Bitcoin,
    accent: "#71717a",
    tileBg: "rgba(113,113,122,.10)",
  },
  Energy: {
    description: "Oil, gas, and clean energy market updates",
    Icon: Zap,
    accent: "#fbbf24",
    tileBg: "rgba(251,191,36,.13)",
  },
  Healthcare: {
    description: "Healthcare industry, biotech, and pharma",
    Icon: Activity,
    accent: "#f87171",
    tileBg: "rgba(248,113,113,.13)",
  },
  "Real Estate": {
    description: "Property markets, REITs, and real estate trends",
    Icon: Building2,
    accent: "#4ade80",
    tileBg: "rgba(74,222,128,.13)",
  },
  Banking: {
    description: "Banks, credit markets, and financial services",
    Icon: Landmark,
    accent: "#93c5fd",
    tileBg: "rgba(147,197,253,.13)",
  },
  Commodities: {
    description: "Gold, metals, agriculture, and commodity markets",
    Icon: BarChart2,
    accent: "#fcd34d",
    tileBg: "rgba(252,211,77,.13)",
  },
  "World Markets": {
    description: "Global indices, currencies, and international news",
    Icon: Globe2,
    accent: "#22d3ee",
    tileBg: "rgba(34,211,238,.13)",
  },
};

/** Inline SVG sparkline for the top-story placeholder */
function EditorialPlaceholder({ accent }: { accent: string }) {
  return (
    <div
      className="relative h-[80px] w-full overflow-hidden"
      style={{ background: "#09090E" }}
    >
      {/* Subtle grid texture */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.022) 1px,transparent 1px)," +
            "linear-gradient(90deg,rgba(255,255,255,.022) 1px,transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Mini sparkline */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 300 80"
        preserveAspectRatio="none"
        aria-hidden
      >
        <polygon
          points="0,68 45,58 85,62 130,45 172,38 214,42 255,26 300,18 300,80 0,80"
          fill={accent}
          fillOpacity="0.06"
        />
        <polyline
          points="0,68 45,58 85,62 130,45 172,38 214,42 255,26 300,18"
          fill="none"
          stroke={accent}
          strokeWidth="1.5"
          strokeOpacity="0.38"
          strokeLinejoin="round"
        />
      </svg>
      {/* Bottom fade so the text block blends in cleanly */}
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#09090E] to-transparent" />
    </div>
  );
}

const CARD_SURFACE = { background: "#09090E" } as const;

const CATEGORY_BOTTOM_PADDING = "calc(9rem + env(safe-area-inset-bottom))";
const BROWSE_BOTTOM_PADDING =
  "calc(3rem + max(1.25rem, env(safe-area-inset-bottom)))";

/* ── Main component ──────────────────────────────────────────────────────── */

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

  /* ── Category detail page ────────────────────────────────────────────── */
  if (category) {
    const token = CATEGORY_TOKENS[category];
    const { Icon, accent } = token;
    const topStory = categoryArticles[0] ?? null;
    const latestStories = categoryArticles.slice(1);
    const count = categoryArticles.length;

    return (
      <div className="flex h-full min-h-0 flex-col bg-[#030305] text-white">
        {/* Pinned header */}
        <div className="relative z-20 shrink-0 border-b border-white/[0.06] bg-[#030305] after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-4 after:bg-gradient-to-b after:from-[#030305] after:to-transparent after:content-['']">
          <header className="flex items-center gap-2 px-2 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
            <button
              type="button"
              data-no-drag
              onClick={() =>
                router.replace(appPath("browse"), { scroll: false })
              }
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-white/10"
              aria-label="Back to categories"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
            <h1 className="text-[17px] font-semibold text-white">{category}</h1>
          </header>
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          style={{ paddingBottom: CATEGORY_BOTTOM_PADDING }}
        >
          {/* Category summary card */}
          <div
            className="mx-4 mt-4 overflow-hidden rounded-xl border border-white/[0.07]"
            style={CARD_SURFACE}
          >
            <div className="flex items-center gap-3 px-4 py-3.5">
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
                  <p className="mt-0.5 text-[11px] text-zinc-600">
                    Updated today
                  </p>
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
              {/* Top story */}
              {topStory && (
                <section className="mt-5 px-4">
                  <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                    Top story
                  </p>
                  <button
                    type="button"
                    data-no-drag
                    onClick={() => openInFeed(topStory)}
                    className="w-full overflow-hidden rounded-xl border border-white/[0.07] text-left active:opacity-80"
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
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      </div>
                    ) : (
                      <EditorialPlaceholder accent={accent} />
                    )}
                    <div
                      className="px-4 pb-4 pt-3"
                      style={CARD_SURFACE}
                    >
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

              {/* Latest stories */}
              {latestStories.length > 0 && (
                <section className="mt-5 px-4">
                  <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                    Latest stories
                  </p>
                  <div
                    className="overflow-hidden rounded-xl border border-white/[0.07]"
                    style={CARD_SURFACE}
                  >
                    {latestStories.map((article, index) => (
                      <div key={article.id}>
                        <button
                          type="button"
                          data-no-drag
                          onClick={() => openInFeed(article)}
                          className="flex w-full flex-col px-4 py-3 text-left active:bg-white/[0.04]"
                        >
                          <p className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-white">
                            {cleanArticleTitle(article.headline)}
                          </p>
                          {article.subheading ? (
                            <p className="mt-0.5 line-clamp-1 text-[11px] text-zinc-500">
                              {article.subheading}
                            </p>
                          ) : null}
                          <p className="mt-1 text-[11px] text-zinc-600">
                            {article.sourceName}
                            <span className="mx-1.5">·</span>
                            {timeAgo(article.publishedAt)}
                          </p>
                        </button>
                        {index < latestStories.length - 1 && (
                          <div
                            className="mx-4 h-px bg-white/[0.05]"
                            aria-hidden
                          />
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

  /* ── Browse landing page ─────────────────────────────────────────────── */
  return (
    <div className="flex h-full min-h-0 flex-col bg-[#030305] text-white">
      {/* Pinned header */}
      <div className="relative z-20 shrink-0 bg-[#030305] after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-4 after:bg-gradient-to-b after:from-[#030305] after:to-transparent after:content-['']">
        <header className="px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
          <h1 className="text-[28px] font-bold tracking-tight text-white">
            Browse
          </h1>
          <p className="mt-0.5 text-[13px] text-zinc-500">
            Explore markets, sectors, and business trends
          </p>
        </header>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2"
        style={{ paddingBottom: BROWSE_BOTTOM_PADDING }}
      >
        {/* Single grouped list — more Bloomberg/finance-native */}
        <div
          className="overflow-hidden rounded-xl border border-white/[0.07]"
          style={CARD_SURFACE}
        >
          {BROWSE_CATEGORIES.map((item, index) => {
            const token = CATEGORY_TOKENS[item];
            const { Icon, accent } = token;
            const count = categoryCounts.get(item) ?? 0;
            const isCrypto = item === "Crypto";

            return (
              <div key={item}>
                {isCrypto ? (
                  <div className="flex items-center gap-3 px-4 py-3 opacity-45">
                    {/* Left accent bar */}
                    <div
                      className="h-5 w-[3px] shrink-0 rounded-r-full"
                      style={{ background: accent }}
                    />
                    {/* Icon */}
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: token.tileBg }}
                    >
                      <Icon
                        className="h-[15px] w-[15px]"
                        style={{ color: accent }}
                      />
                    </span>
                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-zinc-400">
                        {item}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-zinc-600">
                        {token.description}
                      </p>
                    </div>
                    {/* Coming soon pill */}
                    <span className="shrink-0 rounded-md bg-zinc-800/70 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                      Soon
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    data-no-drag
                    onClick={() =>
                      router.replace(
                        appPath(`browse/${categoryToSlug(item)}`),
                        { scroll: false }
                      )
                    }
                    className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-white/[0.04]"
                  >
                    {/* Left accent bar */}
                    <div
                      className="h-5 w-[3px] shrink-0 rounded-r-full"
                      style={{ background: accent, opacity: 0.75 }}
                    />
                    {/* Icon tile */}
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: token.tileBg }}
                    >
                      <Icon
                        className="h-[15px] w-[15px]"
                        style={{ color: accent }}
                      />
                    </span>
                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-white">
                        {item}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-zinc-500">
                        {token.description}
                      </p>
                    </div>
                    {/* Story count + chevron */}
                    <span className="shrink-0 text-[11px] tabular-nums text-zinc-600">
                      {count === 1 ? "1 story" : `${count} stories`}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-700" />
                  </button>
                )}
                {index < BROWSE_CATEGORIES.length - 1 && (
                  <div className="mx-4 h-px bg-white/[0.05]" aria-hidden />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
