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

const FEATURED_PRIMARY: BrowseCategory = "Markets";
const FEATURED_SECONDARY: BrowseCategory[] = ["Technology", "Economy"];
const ALL_TOPICS: BrowseCategory[] = BROWSE_CATEGORIES.filter(
  (c) => c !== FEATURED_PRIMARY && !FEATURED_SECONDARY.includes(c)
);

/** Standard grid texture — category detail header/placeholder */
const GRID_TEXTURE: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(rgba(255,255,255,.014) 1px,transparent 1px)," +
    "linear-gradient(90deg,rgba(255,255,255,.014) 1px,transparent 1px)",
  backgroundSize: "24px 24px",
};

/** Lighter grid — Featured cards so text stays legible */
const GRID_TEXTURE_SUBTLE: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(rgba(255,255,255,.010) 1px,transparent 1px)," +
    "linear-gradient(90deg,rgba(255,255,255,.010) 1px,transparent 1px)",
  backgroundSize: "24px 24px",
};

/* ── Featured card ───────────────────────────────────────────────────────── */

function FeaturedCard({
  item,
  count,
  primary,
  onClick,
}: {
  item: BrowseCategory;
  count: number;
  /** true = full-width primary, false = half-width secondary */
  primary: boolean;
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
      className={[
        "relative overflow-hidden rounded-xl text-left active:opacity-80",
        primary ? "h-[118px] w-full" : "h-[114px] min-w-0 flex-1",
      ].join(" ")}
      style={{
        border: "1px solid rgba(255,255,255,0.07)",
        background: token.cardGradient,
        // Primary only: restrained outer glow; both: subtle inner top highlight
        boxShadow: primary
          ? `inset 0 1px 0 rgba(255,255,255,.07),0 0 28px ${accent}0C`
          : "inset 0 1px 0 rgba(255,255,255,.05)",
      }}
    >
      {/* Grid texture — subtle, not a design element */}
      <div className="absolute inset-0" style={GRID_TEXTURE_SUBTLE} />
      {/* Accent glow blob — primary only */}
      {primary && (
        <div
          className="absolute -right-5 -top-5 h-20 w-20 rounded-full blur-2xl"
          style={{ background: `${accent}12` }}
        />
      )}
      {/* Sparkline at bottom */}
      <svg
        className="absolute inset-x-0 bottom-0 h-[52px] w-full"
        viewBox="0 0 200 52"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id={`fc-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.09" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points="0,40 40,32 80,36 120,22 160,16 200,8 200,52 0,52"
          fill={`url(#fc-${uid})`}
        />
        <polyline
          points="0,40 40,32 80,36 120,22 160,16 200,8"
          fill="none"
          stroke={accent}
          strokeWidth="1.5"
          strokeOpacity="0.28"
          strokeLinejoin="round"
        />
      </svg>
      {/* Bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/15 to-transparent" />

      {/* Content */}
      <div className="relative flex h-full flex-col p-4">
        <div className="flex items-center gap-2.5">
          <span
            className={[
              "flex shrink-0 items-center justify-center rounded-lg",
              primary ? "h-8 w-8" : "h-7 w-7",
            ].join(" ")}
            style={{ background: token.tileBg }}
          >
            <Icon
              className={primary ? "h-[15px] w-[15px]" : "h-[13px] w-[13px]"}
              style={{ color: accent }}
            />
          </span>
          <div className="min-w-0 flex-1">
            <p
              className={[
                "truncate font-bold leading-tight text-white",
                primary ? "text-[14px]" : "text-[13px]",
              ].join(" ")}
            >
              {item}
            </p>
            <p className="text-[10px] tabular-nums text-zinc-500">
              {count === 1 ? "1 story" : `${count} stories`}
            </p>
          </div>
        </div>
        {/* Description only on primary — secondary cards stay clean */}
        {primary && (
          <p className="mt-2.5 line-clamp-2 text-[12px] text-zinc-400">
            {token.description}
          </p>
        )}
      </div>
    </button>
  );
}

/* ── Editorial placeholder for Top Story ────────────────────────────────── */

function EditorialPlaceholder({ accent }: { accent: string }) {
  const uid = accent.replace("#", "");
  return (
    <div
      className="relative h-[80px] w-full overflow-hidden"
      style={{
        background: "linear-gradient(135deg,#07090F 0%,#090C15 100%)",
        boxShadow: `inset 0 0 40px ${accent}08`,
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

  const categoryArticles = useMemo(() => {
    if (!category) return [];
    return filterArticlesByBrowseCategory(articles, category);
  }, [articles, category]);

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
          <h1 className="text-[28px] font-bold tracking-tight text-white">Browse</h1>
          <p className="mt-0.5 text-[13px] text-zinc-500">
            Explore markets, sectors, and business trends
          </p>
        </header>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        style={{ paddingBottom: BOTTOM_PADDING }}
      >
        {/* ── Featured grid ────────────────────────────────────────────── */}
        <section className="px-4 pt-3">
          <p className="mb-3 text-[13px] font-semibold text-white">Featured</p>

          {/* Primary card — Markets, full width */}
          <FeaturedCard
            item={FEATURED_PRIMARY}
            count={categoryCounts.get(FEATURED_PRIMARY) ?? 0}
            primary
            onClick={() => navigateTo(FEATURED_PRIMARY)}
          />

          {/* Secondary row — Technology + Economy */}
          <div className="mt-2.5 flex gap-2.5">
            {FEATURED_SECONDARY.map((item) => (
              <FeaturedCard
                key={item}
                item={item}
                count={categoryCounts.get(item) ?? 0}
                primary={false}
                onClick={() => navigateTo(item)}
              />
            ))}
          </div>
        </section>

        {/* ── All topics grouped list ──────────────────────────────────── */}
        <section className="mt-6 px-4">
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
                          {token.description}
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
