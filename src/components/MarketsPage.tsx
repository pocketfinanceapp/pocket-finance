"use client";

/** Markets page (/markets) — slim list rows, no cards */
import { useApp } from "@/context/AppContext";
import type { MarketFilter } from "@/lib/filters";
import {
  GLOBAL_MARKETS,
  formatIndexValue,
  type GlobalMarket,
} from "@/lib/markets";

export const MARKETS_LIST_VERSION = "slim-rows-v3";

interface MarketsPageProps {
  onOpenMarketFeed: (market: MarketFilter) => void;
}

export function MarketsPage({ onOpenMarketFeed }: MarketsPageProps) {
  const { followedMarkets, toggleFollowMarket, isFollowingMarket } = useApp();

  const following = GLOBAL_MARKETS.filter((m) => followedMarkets.includes(m.id));
  const rest = GLOBAL_MARKETS.filter((m) => !followedMarkets.includes(m.id));

  return (
    <div
      data-markets-list={MARKETS_LIST_VERSION}
      className="flex h-full min-h-0 flex-col bg-black text-white"
    >
      <header className="shrink-0 border-b border-white/10 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
        <h1 className="text-[28px] font-bold tracking-tight">Markets</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pb-2">
        {following.length > 0 && (
          <>
            <p className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Following
            </p>
            <ul>
              {following.map((m) => (
                <MarketRow
                  key={m.id}
                  market={m}
                  isFollowing
                  onOpen={() => onOpenMarketFeed(m.id)}
                  onFollow={() => toggleFollowMarket(m.id)}
                />
              ))}
            </ul>
          </>
        )}

        <p className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {following.length > 0 ? "All markets" : "Markets"}
        </p>
        <ul>
          {rest.map((m) => (
            <MarketRow
              key={m.id}
              market={m}
              isFollowing={isFollowingMarket(m.id)}
              onOpen={() => onOpenMarketFeed(m.id)}
              onFollow={() => toggleFollowMarket(m.id)}
            />
          ))}
        </ul>
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

  return (
    <li className="flex h-11 items-center gap-2 border-b border-white/[0.06] px-4">
      <button
        type="button"
        data-no-drag
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
        onClick={onOpen}
      >
        <span className="w-6 shrink-0 text-center text-base leading-none">
          {market.flag}
        </span>
        <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-white">
          {market.name}
        </span>
        <span className="shrink-0 text-[15px] tabular-nums text-white">
          {formatIndexValue(market.value)}
        </span>
        <span
          className={`w-[52px] shrink-0 text-right text-[13px] tabular-nums ${
            up ? "text-[#34c759]" : "text-[#ff453a]"
          }`}
        >
          {up ? "+" : ""}
          {market.changePercent.toFixed(2)}%
        </span>
      </button>
      <button
        type="button"
        data-no-drag
        onClick={(e) => {
          e.stopPropagation();
          onFollow();
        }}
        className={`h-6 shrink-0 rounded-full border px-2 text-[11px] font-medium ${
          isFollowing
            ? "border-white/30 text-white"
            : "border-white/20 text-zinc-400"
        }`}
      >
        {isFollowing ? "Following" : "Follow"}
      </button>
    </li>
  );
}
