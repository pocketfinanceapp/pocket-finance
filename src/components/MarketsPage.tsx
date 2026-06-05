"use client";

import { useMemo } from "react";
import { useApp } from "@/context/AppContext";
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
import { MarketSparkline } from "./MarketSparkline";

export const MARKETS_LIST_VERSION = "following-cards-v5";

interface MarketsPageProps {
  onOpenMarketFeed: (market: MarketFilter) => void;
}

export function MarketsPage({ onOpenMarketFeed }: MarketsPageProps) {
  const { followedMarkets, toggleFollowMarket, isFollowingMarket } = useApp();

  const movers = useMemo(() => countMarketMovers(), []);
  const session = useMemo(() => getGlobalMarketStatus(), []);

  const followingMarkets = useMemo(
    () =>
      followedMarkets
        .map((id) => getMarketById(id))
        .filter((m): m is GlobalMarket => m !== undefined),
    [followedMarkets]
  );

  const regions = useMemo(
    () =>
      MARKET_REGIONS.map((region) => ({
        ...region,
        markets: getMarketsByRegion(region).sort((a, b) => {
          const aFollowed = followedMarkets.includes(a.id);
          const bFollowed = followedMarkets.includes(b.id);
          if (aFollowed !== bFollowed) return aFollowed ? -1 : 1;
          return a.name.localeCompare(b.name);
        }),
      })),
    [followedMarkets]
  );

  return (
    <div
      data-markets-list={MARKETS_LIST_VERSION}
      className="flex h-full min-h-0 flex-col bg-black text-white"
    >
      <header className="shrink-0 border-b border-white/10 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
        <h1 className="text-[28px] font-bold tracking-tight">Markets</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        <div className="px-4 pt-3">
          <MarketSummaryBar movers={movers} session={session} />
        </div>

        {followingMarkets.length > 0 && (
          <section className="mt-4">
            <h2 className="px-4 pb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Following
            </h2>
            <div className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide">
              {followingMarkets.map((market) => (
                <FollowingMarketCard
                  key={market.id}
                  market={market}
                  onOpen={() => onOpenMarketFeed(market.id)}
                />
              ))}
            </div>
            <div
              className="mx-4 mt-4 h-px bg-gradient-to-r from-transparent via-[#3B6EF5]/50 to-transparent"
              aria-hidden
            />
          </section>
        )}

        {regions.map((region, index) => (
          <section key={region.id} className="mt-4">
            {index > 0 && (
              <div
                className="mx-4 mb-3 h-px bg-gradient-to-r from-transparent via-[#3B6EF5]/50 to-transparent"
                aria-hidden
              />
            )}
            <h2 className="px-4 pb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              {region.label}
            </h2>
            <ul>
              {region.markets.map((market) => (
                <MarketRow
                  key={market.id}
                  market={market}
                  isFollowing={isFollowingMarket(market.id)}
                  onOpen={() => onOpenMarketFeed(market.id)}
                  onFollow={() => toggleFollowMarket(market.id)}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
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
      className="w-[160px] shrink-0 rounded-xl border border-white/10 bg-[#111111] p-3 text-left transition-colors active:bg-[#161616]"
    >
      <div className="flex items-center gap-1.5">
        <span className="text-base leading-none">{market.flag}</span>
        <span className="text-sm font-semibold text-white">{market.name}</span>
      </div>
      <p className="mt-2.5 truncate text-[20px] font-bold leading-tight tabular-nums text-white">
        {formatIndexValue(market.value)}
      </p>
      <p
        className={`mt-0.5 text-[13px] font-medium tabular-nums ${
          up ? "text-[#34c759]" : "text-[#ff453a]"
        }`}
      >
        {up ? "+" : ""}
        {market.changePercent.toFixed(2)}%
      </p>
      <div className="mt-2.5 flex justify-start">
        <MarketSparkline points={sparkline} up={up} width={128} height={24} />
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
    <div className="rounded-xl border border-white/10 bg-[#111111] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#34c759]" aria-hidden>
              ▲
            </span>
            <span className="text-sm font-semibold tabular-nums text-[#34c759]">
              {movers.up}
            </span>
            <span className="text-xs text-zinc-500">up</span>
          </div>
          <div className="h-4 w-px bg-white/10" aria-hidden />
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#ff453a]" aria-hidden>
              ▼
            </span>
            <span className="text-sm font-semibold tabular-nums text-[#ff453a]">
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

function MarketRow({
  market,
  isFollowing,
  onOpen,
  onFollow,
}: {
  market: GlobalMarket;
  isFollowing: boolean;
  onOpen: () => void;
  onFollow: () => void;
}) {
  const up = market.changePercent >= 0;
  const sparkline = useMemo(() => getMarketSparkline(market), [market]);

  return (
    <li className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
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
          <p className="truncate text-[11px] text-zinc-500">{market.fullName}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[14px] tabular-nums text-white">
            {formatIndexValue(market.value)}
          </p>
          <p
            className={`flex items-center justify-end gap-0.5 text-[12px] tabular-nums ${
              up ? "text-[#34c759]" : "text-[#ff453a]"
            }`}
          >
            <span className="text-[10px] leading-none" aria-hidden>
              {up ? "▲" : "▼"}
            </span>
            {up ? "+" : ""}
            {market.changePercent.toFixed(2)}%
          </p>
        </div>
      </button>

      <MarketSparkline points={sparkline} up={up} />

      <button
        type="button"
        data-no-drag
        onClick={(e) => {
          e.stopPropagation();
          onFollow();
        }}
        className={`h-7 shrink-0 rounded-full px-3 text-[11px] font-semibold transition-colors ${
          isFollowing
            ? "bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] text-white shadow-[0_2px_12px_rgba(59,110,245,0.3)]"
            : "border border-white/25 bg-transparent text-zinc-400"
        }`}
      >
        {isFollowing ? "Following" : "Follow"}
      </button>
    </li>
  );
}
