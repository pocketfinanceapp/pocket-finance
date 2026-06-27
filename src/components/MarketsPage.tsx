"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { PopReaction } from "@/components/PopReaction";
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

export const MARKETS_LIST_VERSION = "global-indexes-movers-v8";

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
}: {
  markets: GlobalMarket[];
  onOpen: (market: MarketFilter) => void;
}) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    const el = carouselRef.current;
    if (!el) return;
    // card = 68vw, gap-3 = 12px; no container padding (margins on first/last card)
    const cardWidth = el.clientWidth * 0.68;
    const gap = 12;
    const index = Math.round(el.scrollLeft / (cardWidth + gap));
    setActiveIndex(Math.min(markets.length - 1, Math.max(0, index)));
  };

  return (
    <section className={MARKETS_SECTION_SPACING}>
      <h2 className={MARKETS_SECTION_HEADING}>Following</h2>
      {/*
        No container padding — first card gets ml-[16vw] and last gets mr-[16vw].
        (100vw - 68vw) / 2 = 16vw so snap-center aligns perfectly without scroll-padding.
      */}
      <div
        ref={carouselRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 scrollbar-hide"
      >
        {markets.map((market) => (
          <FollowingMarketCard
            key={market.id}
            market={market}
            onOpen={() => onOpen(market.id)}
          />
        ))}
      </div>
      {markets.length > 1 && (
        <div className="mt-2.5 flex justify-center gap-1.5">
          {markets.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === activeIndex
                  ? "w-4 bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6]"
                  : "w-1.5 bg-zinc-700"
              }`}
              aria-hidden
            />
          ))}
        </div>
      )}
    </section>
  );
}

function FollowingMarketCard({
  market,
  onOpen,
}: {
  market: GlobalMarket;
  onOpen: () => void;
}) {
  const up = market.changePercent >= 0;
  const sparkline = useMemo(() => getMarketSparkline(market), [market]);

  return (
    <button
      type="button"
      data-no-drag
      onClick={onOpen}
      className="w-[68vw] shrink-0 snap-center rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3.5 text-left transition-colors active:bg-white/[0.06] first:ml-[16vw] last:mr-[16vw]"
    >
      <div className="flex items-center gap-2">
        <span className="text-base leading-none">{market.flag}</span>
        <span className="truncate text-sm font-semibold text-white">
          {market.name}
        </span>
      </div>
      <p className="mt-2.5 truncate text-[20px] font-bold leading-tight tabular-nums text-white">
        {formatIndexValue(market.value)}
      </p>
      <p
        className={`mt-0.5 text-[13px] font-semibold tabular-nums ${
          up ? "text-[#34c759]" : "text-[#ff453a]"
        }`}
      >
        {up ? "+" : ""}
        {market.changePercent.toFixed(2)}%
      </p>
      <div className="mt-2.5">
        <MarketSparkline points={sparkline} up={up} width={200} height={26} />
      </div>
    </button>
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
}: {
  market: GlobalMarket;
  isFollowing: boolean;
  onOpen: () => void;
  onFollow: () => void;
  showDivider: boolean;
}) {
  const up = market.changePercent >= 0;
  const sparkline = useMemo(() => getMarketSparkline(market), [market]);

  return (
    <li
      className={`flex items-center gap-2 px-4 py-3 ${
        showDivider ? "border-b border-white/[0.06]" : ""
      }`}
    >
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

function FollowMarketButton({
  isFollowing,
  onFollow,
}: {
  isFollowing: boolean;
  onFollow: () => void;
}) {
  const [unfollowAnim, setUnfollowAnim] = useState(false);

  const handleClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isFollowing) {
      setUnfollowAnim(true);
      window.setTimeout(() => setUnfollowAnim(false), 280);
    }
    onFollow();
  };

  if (isFollowing) {
    return (
      <button
        type="button"
        data-no-drag
        onClick={handleClick}
        className={`h-7 shrink-0 rounded-full bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] px-3 text-[11px] font-semibold text-white shadow-[0_2px_12px_rgba(59,110,245,0.3)] transition-all duration-300 ${
          unfollowAnim ? "pf-follow-unfollow" : ""
        }`}
      >
        Following
      </button>
    );
  }

  return (
    <PopReaction
      aria-label="Follow market"
      onClick={() => handleClick()}
      className="h-7 shrink-0 rounded-full border border-white/25 bg-transparent px-3 text-[11px] font-semibold text-zinc-400 transition-colors duration-300 hover:border-white/40 hover:text-white"
    >
      Follow
    </PopReaction>
  );
}
