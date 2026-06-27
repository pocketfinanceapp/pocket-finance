"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useNavigationOptional } from "@/context/NavigationContext";
import { tabEnterStyle, useTabPageEntered } from "@/lib/tabEnterAnimation";
import type { MarketFilter } from "@/lib/filters";
import {
  MARKET_REGIONS,
  countMarketMovers,
  formatIndexValue,
  getGlobalMarketStatus,
  getMarketById,
  getMarketSparkline,
  getMarketsByRegion,
  type GlobalMarket,
} from "@/lib/markets";
import type { MarketsSnapshot } from "@/context/AppContext";
import type { NewsArticle } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { cleanArticleTitle } from "@/lib/sourceBranding";
import { MarketSparkline } from "./MarketSparkline";
import { GlobalIndexesSection } from "./GlobalIndexesSection";
import { TopMoversSection } from "./TopMoversSection";

export const MARKETS_LIST_VERSION = "following-list-v9";

const MARKETS_SCROLL_PADDING =
  "calc(2.5rem + max(1.25rem, env(safe-area-inset-bottom)))";

/** Shared premium card shell for Markets sections */
export const MARKETS_SECTION_CARD =
  "mx-4 mt-2 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]";

export const MARKETS_SECTION_ROW =
  "flex items-center gap-3 px-4 py-3";

export const MARKETS_SECTION_HEADING =
  "px-4 pb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500";

export const MARKETS_SECTION_SPACING = "mt-5";

const PARTICLE_COUNT = 8;

interface MarketsPageProps {
  onOpenMarketFeed: (market: MarketFilter) => void;
  articles?: NewsArticle[];
}

export function MarketsPage({ onOpenMarketFeed, articles = [] }: MarketsPageProps) {
  const {
    followedMarkets,
    toggleFollowMarket,
    isFollowingMarket,
    marketsSnapshot,
    ensureMarketsLoaded,
  } = useApp();
  const navigation = useNavigationOptional();
  const tabEntered = useTabPageEntered("markets");

  useEffect(() => {
    ensureMarketsLoaded();
  }, [ensureMarketsLoaded]);

  const snapshot: MarketsSnapshot = marketsSnapshot ?? {
    markets: [],
    movers: countMarketMovers(),
    session: getGlobalMarketStatus(),
    loaded: false,
  };
  const movers = snapshot.movers;
  const session = snapshot.session;

  const followingMarkets = useMemo(
    () =>
      followedMarkets
        .map((id) => getMarketById(id))
        .filter((m): m is GlobalMarket => m !== undefined),
    [followedMarkets]
  );

  const marketNews = useMemo(
    () => articles.slice(0, 2),
    [articles]
  );

  const regions = useMemo(
    () =>
      MARKET_REGIONS.map((region) => ({
        ...region,
        markets: getMarketsByRegion(region).sort((a, b) =>
          a.name.localeCompare(b.name)
        ),
      })),
    []
  );

  return (
    <div
      data-markets-list={MARKETS_LIST_VERSION}
      className="flex h-full min-h-0 flex-col bg-black text-white"
    >
      <div
        className="relative z-20 shrink-0 border-b border-white/[0.08] bg-black after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:z-10 after:h-5 after:bg-gradient-to-b after:from-black after:to-transparent after:content-['']"
        style={tabEnterStyle(tabEntered, 0)}
      >
        <header className="px-4 pb-2.5 pt-[max(12px,env(safe-area-inset-top))]">
          <h1 className="text-[28px] font-bold tracking-tight">Markets</h1>
        </header>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        style={{ paddingBottom: MARKETS_SCROLL_PADDING }}
      >
        <div className="px-4 pt-3" style={tabEnterStyle(tabEntered, 80)}>
          <MarketSummaryBar movers={movers} session={session} />
        </div>

        {followingMarkets.length > 0 && (
          <div style={tabEnterStyle(tabEntered, 160)}>
            <FollowingSection
              markets={followingMarkets}
              onOpen={onOpenMarketFeed}
              onUnfollow={toggleFollowMarket}
            />
          </div>
        )}

        <div style={tabEnterStyle(tabEntered, 240)}>
          <GlobalIndexesSection />
        </div>
        <div style={tabEnterStyle(tabEntered, 320)}>
          <TopMoversSection />
        </div>

        {marketNews.length > 0 && (
          <div style={tabEnterStyle(tabEntered, 400)}>
            <MarketNewsSection
              articles={marketNews}
              onViewAll={() => navigation?.navigate("home")}
            />
          </div>
        )}

        {regions.map((region, regionIndex) => (
          <section
            key={region.id}
            className={MARKETS_SECTION_SPACING}
            style={tabEnterStyle(tabEntered, 480 + regionIndex * 60)}
          >
            <h2 className={MARKETS_SECTION_HEADING}>{region.label}</h2>
            <div className={MARKETS_SECTION_CARD}>
              <ul>
                {region.markets.map((market, i) => (
                  <MarketRow
                    key={market.id}
                    market={market}
                    isFollowing={isFollowingMarket(market.id)}
                    onOpen={() => onOpenMarketFeed(market.id)}
                    onFollow={() => toggleFollowMarket(market.id)}
                    showDivider={i < region.markets.length - 1}
                  />
                ))}
              </ul>
            </div>
          </section>
        ))}

        <p
          className="mx-4 mt-6 px-1 pb-1 text-center text-[11px] leading-relaxed text-zinc-600"
          style={tabEnterStyle(tabEntered, 540)}
        >
          Market data is provided for informational purposes only and should
          not be considered investment advice.
        </p>
      </div>
    </div>
  );
}

function FollowingSection({
  markets,
  onOpen,
  onUnfollow,
}: {
  markets: GlobalMarket[];
  onOpen: (market: MarketFilter) => void;
  onUnfollow: (marketId: MarketFilter) => void;
}) {
  return (
    <section className={MARKETS_SECTION_SPACING}>
      <div className="px-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Following
        </h2>
        <p className="mt-1 text-[12px] text-zinc-600">
          {markets.length} market{markets.length === 1 ? "" : "s"} · tap to open feed
        </p>
      </div>
      <div className={MARKETS_SECTION_CARD}>
        <ul>
          {markets.map((market, i) => (
            <MarketRow
              key={market.id}
              market={market}
              isFollowing
              onOpen={() => onOpen(market.id)}
              onFollow={() => onUnfollow(market.id)}
              showDivider={i < markets.length - 1}
              accentFollowing
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

function MarketSummaryBar({
  movers,
  session,
}: {
  movers: { up: number; down: number };
  session: { open: boolean; label: "Markets open" | "Markets closed" };
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#34c759]" aria-hidden>
              ▲
            </span>
            <span className="text-sm font-bold tabular-nums text-[#34c759]">
              {movers.up}
            </span>
            <span className="text-xs text-zinc-500">up</span>
          </div>
          <div className="h-4 w-px bg-white/10" aria-hidden />
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#ff453a]" aria-hidden>
              ▼
            </span>
            <span className="text-sm font-bold tabular-nums text-[#ff453a]">
              {movers.down}
            </span>
            <span className="text-xs text-zinc-500">down</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              session.open ? "bg-[#34c759]" : "bg-zinc-500"
            }`}
            aria-hidden
          />
          <span className="text-xs font-medium text-zinc-400">
            {session.label}
          </span>
        </div>
      </div>
    </div>
  );
}

function NewsThumb({ imageUrl }: { imageUrl: string }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  const showFallback = !imageUrl || imageFailed;

  if (showFallback) {
    return (
      <div
        className="h-14 w-14 shrink-0 rounded-xl"
        style={{ background: "linear-gradient(135deg, #3B6EF5, #00C6C6)" }}
      />
    );
  }

  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-900">
      <Image
        src={imageUrl}
        alt=""
        fill
        className="object-cover"
        sizes="56px"
        unoptimized
        onError={() => setImageFailed(true)}
      />
    </div>
  );
}

function MarketNewsSection({
  articles,
  onViewAll,
}: {
  articles: NewsArticle[];
  onViewAll: () => void;
}) {
  return (
    <section className={MARKETS_SECTION_SPACING}>
      <h2 className={MARKETS_SECTION_HEADING}>Market News</h2>
      <div className={MARKETS_SECTION_CARD}>
        <ul>
          {articles.map((article, i) => (
            <li
              key={article.id}
              className={`flex gap-3 px-4 py-3 ${
                i < articles.length - 1 ? "border-b border-white/[0.06]" : ""
              }`}
            >
              <NewsThumb imageUrl={article.imageUrl} />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[14px] font-semibold leading-snug text-white">
                  {cleanArticleTitle(article.headline)}
                </p>
                <p className="mt-1.5 text-[11px] text-zinc-500">
                  {timeAgo(article.publishedAt)} · {article.sourceName}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          data-no-drag
          onClick={onViewAll}
          className="flex w-full items-center justify-center gap-1 border-t border-white/[0.06] py-3 text-sm font-medium text-zinc-400 transition-colors active:text-white"
        >
          View all news
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

function MarketRow({
  market,
  isFollowing,
  onOpen,
  onFollow,
  showDivider,
  accentFollowing = false,
}: {
  market: GlobalMarket;
  isFollowing: boolean;
  onOpen: () => void;
  onFollow: () => void;
  showDivider: boolean;
  accentFollowing?: boolean;
}) {
  const up = market.changePercent >= 0;
  const sparkline = useMemo(() => getMarketSparkline(market), [market]);

  return (
    <li
      className={`relative flex items-center gap-2 px-4 py-3 ${
        showDivider ? "border-b border-white/[0.06]" : ""
      } ${accentFollowing ? "bg-white/[0.02]" : ""}`}
    >
      {accentFollowing && (
        <div
          className="absolute bottom-2 left-0 top-2 w-[2px] rounded-full"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,198,198,0.55), rgba(59,110,245,0.25))",
          }}
        />
      )}

      <button
        type="button"
        data-no-drag
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        onClick={onOpen}
      >
        <span className="w-7 shrink-0 text-center text-lg leading-none">
          {market.flag}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-white">
            {market.name}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-zinc-500">
            {market.fullName}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[14px] tabular-nums text-white">
            {formatIndexValue(market.value)}
          </p>
          <p
            className={`mt-0.5 text-[12px] tabular-nums ${
              up ? "text-[#34c759]" : "text-[#ff453a]"
            }`}
          >
            {up ? "+" : ""}
            {market.changePercent.toFixed(2)}%
          </p>
        </div>
      </button>

      <MarketSparkline points={sparkline} up={up} />

      <FollowMarketButton isFollowing={isFollowing} onFollow={onFollow} />
    </li>
  );
}

function spawnFollowParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.35;
    const dist = 10 + Math.random() * 12;
    return {
      id: Date.now() + i + Math.random(),
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist,
      color: i % 2 === 0 ? "#00C6C6" : "#3B6EF5",
    };
  });
}

function FollowMarketButton({
  isFollowing,
  onFollow,
}: {
  isFollowing: boolean;
  onFollow: () => void;
}) {
  const [followPop, setFollowPop] = useState(false);
  const [unfollowAnim, setUnfollowAnim] = useState(false);
  const [particles, setParticles] = useState<
    { id: number; dx: number; dy: number; color: string }[]
  >([]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isFollowing) {
      setUnfollowAnim(true);
      window.setTimeout(() => setUnfollowAnim(false), 180);
    } else {
      setFollowPop(true);
      setParticles(spawnFollowParticles());
      window.setTimeout(() => {
        setFollowPop(false);
        setParticles([]);
      }, 520);
    }

    onFollow();
  };

  return (
    <button
      type="button"
      data-no-drag
      aria-label={isFollowing ? "Unfollow market" : "Follow market"}
      onClick={handleClick}
      className={`relative shrink-0 overflow-visible rounded-full px-3 text-[11px] font-semibold transition-colors duration-200 ${
        isFollowing
          ? "h-7 bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] text-white shadow-[0_2px_10px_rgba(59,110,245,0.25)]"
          : "h-7 border border-white/25 bg-transparent text-zinc-400 hover:border-white/40 hover:text-white"
      } ${followPop ? "pf-follow-pop" : ""} ${
        unfollowAnim ? "pf-follow-unfollow-subtle" : ""
      }`}
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="pf-pop-particle"
          style={
            {
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
              backgroundColor: p.color,
            } as React.CSSProperties
          }
          aria-hidden
        />
      ))}
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}
