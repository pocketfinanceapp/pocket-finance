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
    tileBg: "rgba(59,130,246,.10)",
  },
  Technology: {
    description: "Tech earnings, innovation, and digital trends",
    Icon: Cpu,
    accent: "#a78bfa",
    tileBg: "rgba(139,92,246,.10)",
  },
  Economy: {
    description: "Macro trends, policy, and economic insights",
    Icon: Globe,
    accent: "#34d399",
    tileBg: "rgba(52,211,153,.10)",
  },
  Crypto: {
    description: "Digital assets, blockchain, and crypto markets",
    Icon: Bitcoin,
    accent: "#52525b",
    tileBg: "rgba(82,82,91,.08)",
  },
  Energy: {
    description: "Oil, gas, and clean energy market updates",
    Icon: Zap,
    accent: "#f59e0b",
    tileBg: "rgba(245,158,11,.10)",
  },
  Healthcare: {
    description: "Healthcare industry, biotech, and pharma",
    Icon: Activity,
    accent: "#f87171",
    tileBg: "rgba(248,113,113,.10)",
  },
  "Real Estate": {
    description: "Property markets, REITs, and real estate trends",
    Icon: Building2,
    accent: "#4ade80",
    tileBg: "rgba(74,222,128,.10)",
  },
  Banking: {
    description: "Banks, credit markets, and financial services",
    Icon: Landmark,
    accent: "#7dd3fc",
    tileBg: "rgba(125,211,252,.10)",
  },
  Commodities: {
    description: "Gold, metals, agriculture, and commodity markets",
    Icon: BarChart2,
    accent: "#fbbf24",
    tileBg: "rgba(251,191,36,.10)",
  },
  "World Markets": {
    description: "Global indices, currencies, and international news",
    Icon: Globe2,
    accent: "#22d3ee",
    tileBg: "rgba(34,211,238,.10)",
  },
};

/* ── Shared decorative textures ─────────────────────────────────────────── */

const GRID_TEXTURE: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(rgba(255,255,255,.022) 1px,transparent 1px)," +
    "linear-gradient(90deg,rgba(255,255,255,.022) 1px,transparent 1px)",
  backgroundSize: "24px 24px",
};

/** Sparkline used in Top Story placeholder and hero card */
function SparklineSVG({
  accent,
  className,
}: {
  accent: string;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 56"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={`sl-${accent.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points="0,48 28,40 56,43 84,30 112,24 140,28 168,15 200,10 200,56 0,56"
        fill={`url(#sl-${accent.replace("#", "")})`}
      />
      <polyline
        points="0,48 28,40 56,43 84,30 112,24 140,28 168,15 200,10"
        fill="none"
        stroke={accent}
        strokeWidth="1.5"
        strokeOpacity="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Editorial Top Story visual — grid texture + sparkline */
function EditorialPlaceholder({ accent }: { accent: string }) {
  return (
    <div
      className="relative h-[80px] w-full overflow-hidden"
      style={{
        background: "linear-gradient(135deg,#07090F 0%,#090C15 100%)",
        boxShadow: `inset 0 0 40px ${accent}08`,
      }}
    >
      <div className="absolute inset-0" style={GRID_TEXTURE} />
      <SparklineSVG
        accent={accent}
        className="absolute inset-0 h-full w-full"
      />
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#09090E] to-transparent" />
    </div>
  );
}

const CARD_SURFACE = "#09090E";
const PAGE_BG = "#030305";
const BOTTOM_PADDING = "calc(9rem + env(safe-area-inset-bottom))";

const HERO_CATEGORIES: BrowseCategory[] = ["Markets", "Technology", "Economy"];

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
      <div
        className="flex h-full min-h-0 flex-col text-white"
        style={{ background: PAGE_BG }}
      >
        {/* Pinned header */}
        <div
          className="relative z-20 shrink-0 border-b border-white/[0.06] after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-5 after:bg-gradient-to-b after:from-[#030305] after:to-transparent after:content-['']"
          style={{ background: PAGE_BG }}
        >
          <header className="flex items-center gap-2 px-2 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
            <button
              type="button"
              data-no-drag
              onClick={() =>
                router.replace(appPath("browse"), { scroll: false })
              }
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
          {/* Category summary card — with grid texture */}
          <div
            className="relative mx-4 mt-4 overflow-hidden rounded-xl border border-white/[0.07]"
            style={{
              background: CARD_SURFACE,
              boxShadow: `inset 0 0 40px ${accent}08`,
            }}
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
                      boxShadow: `0 0 24px ${accent}0A`,
                    }}
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

              {/* Latest stories */}
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

  /* ── Browse landing page ─────────────────────────────────────────────── */
  return (
    <div
      className="flex h-full min-h-0 flex-col text-white"
      style={{ background: PAGE_BG }}
    >
      {/* Pinned header */}
      <div
        className="relative z-20 shrink-0 after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-4 after:bg-gradient-to-b after:from-[#030305] after:to-transparent after:content-['']"
        style={{ background: PAGE_BG }}
      >
        <header className="px-5 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
          <h1 className="text-[28px] font-bold tracking-tight text-white">Browse</h1>
          <p className="mt-0.5 text-[13px] text-zinc-500">
            Explore markets, sectors, and business trends
          </p>
        </header>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-3"
        style={{ paddingBottom: BOTTOM_PADDING }}
      >
        {/* ── Premium hero discovery card ───────────────────────────────── */}
        <div
          className="relative mb-4 overflow-hidden rounded-xl border border-white/[0.07]"
          style={{
            background: "linear-gradient(135deg,#07090F 0%,#0A0D1A 60%,#08091A 100%)",
            boxShadow:
              "0 0 60px rgba(34,211,238,.06), 0 0 40px rgba(139,92,246,.05)",
          }}
        >
          {/* Grid texture */}
          <div className="absolute inset-0" style={GRID_TEXTURE} />
          {/* Ambient glow blobs */}
          <div
            className="absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl"
            style={{ background: "rgba(34,211,238,.07)" }}
          />
          <div
            className="absolute -bottom-8 left-1/3 h-24 w-24 rounded-full blur-2xl"
            style={{ background: "rgba(139,92,246,.06)" }}
          />

          <div className="relative flex items-stretch gap-3 px-4 py-4">
            {/* Left: text + pills */}
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-white">Explore the market</p>
              <p className="mt-0.5 text-[11.5px] leading-snug text-zinc-500">
                Follow the sectors and themes moving today&apos;s stories
              </p>
              {/* Live stat pills */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {HERO_CATEGORIES.map((cat) => {
                  const t = CATEGORY_TOKENS[cat];
                  const n = categoryCounts.get(cat) ?? 0;
                  return (
                    <div
                      key={cat}
                      className="flex items-center gap-1.5 rounded-full border border-white/[0.08] px-2.5 py-1"
                      style={{ background: "rgba(255,255,255,.04)" }}
                    >
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: t.accent }}
                      />
                      <span className="text-[10px] font-medium text-zinc-400">
                        {cat}
                      </span>
                      <span className="text-[10px] tabular-nums text-zinc-600">
                        {n}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Right: mini sparkline */}
            <div className="flex shrink-0 items-center">
              <svg
                className="h-14 w-20 opacity-50"
                viewBox="0 0 80 56"
                preserveAspectRatio="none"
                aria-hidden
              >
                <defs>
                  <linearGradient id="heroLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.8" />
                  </linearGradient>
                  <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon
                  points="0,46 12,38 24,40 36,28 48,22 60,26 72,14 80,8 80,56 0,56"
                  fill="url(#heroFill)"
                />
                <polyline
                  points="0,46 12,38 24,40 36,28 48,22 60,26 72,14 80,8"
                  fill="none"
                  stroke="url(#heroLine)"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* ── Grouped category list ──────────────────────────────────────── */}
        <div
          className="overflow-hidden rounded-xl border border-white/[0.07]"
          style={{
            background: CARD_SURFACE,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.04)",
          }}
        >
          {BROWSE_CATEGORIES.map((item, index) => {
            const token = CATEGORY_TOKENS[item];
            const { Icon, accent } = token;
            const count = categoryCounts.get(item) ?? 0;
            const isCrypto = item === "Crypto";

            return (
              <div key={item}>
                {isCrypto ? (
                  <div className="flex items-center gap-3 px-4 py-3 opacity-40">
                    <div
                      className="h-5 w-[3px] shrink-0 rounded-r-full"
                      style={{ background: accent }}
                    />
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: token.tileBg }}
                    >
                      <Icon className="h-[15px] w-[15px]" style={{ color: accent }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-zinc-400">{item}</p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-zinc-600">
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
                    onClick={() =>
                      router.replace(
                        appPath(`browse/${categoryToSlug(item)}`),
                        { scroll: false }
                      )
                    }
                    className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-white/[0.03]"
                  >
                    <div
                      className="h-5 w-[3px] shrink-0 rounded-r-full opacity-60"
                      style={{ background: accent }}
                    />
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: token.tileBg }}
                    >
                      <Icon className="h-[15px] w-[15px]" style={{ color: accent }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-white">{item}</p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-zinc-500">
                        {token.description}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] tabular-nums text-zinc-700">
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
