"use client";

import { useApp } from "@/context/AppContext";
import type { MarketFilter } from "@/lib/filters";
import {
  GLOBAL_MARKETS,
  formatIndexValue,
  type GlobalMarket,
} from "@/lib/markets";

interface MarketsPageProps {
  onClose: () => void;
  onOpenMarketFeed: (market: MarketFilter) => void;
}

export function MarketsPage({ onClose, onOpenMarketFeed }: MarketsPageProps) {
  const { toggleFollowMarket, isFollowingMarket } = useApp();

  return (
    <div className="flex h-full flex-col bg-black text-white">
      <div className="border-b border-neutral-800 px-4 py-3 pt-[max(12px,env(safe-area-inset-top))]">
        <button type="button" onClick={onClose} className="text-sm text-neutral-400">
          ← Back
        </button>
        <h1 className="mt-2 text-xl font-bold">Markets</h1>
      </div>

      <ul className="flex-1 overflow-y-auto pb-24">
        {GLOBAL_MARKETS.map((market) => (
          <MarketListRow
            key={market.id}
            market={market}
            following={isFollowingMarket(market.id)}
            onOpen={() => onOpenMarketFeed(market.id)}
            onToggleFollow={() => toggleFollowMarket(market.id)}
          />
        ))}
      </ul>
    </div>
  );
}

function MarketListRow({
  market,
  following,
  onOpen,
  onToggleFollow,
}: {
  market: GlobalMarket;
  following: boolean;
  onOpen: () => void;
  onToggleFollow: () => void;
}) {
  const up = market.changePercent >= 0;

  return (
    <li className="flex items-center gap-3 border-b border-neutral-900 px-4 py-3">
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        onClick={onOpen}
      >
        <span className="text-lg">{market.flag}</span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
          {market.name}
        </span>
        <span className="shrink-0 text-sm tabular-nums text-white">
          {formatIndexValue(market.value)}
        </span>
        <span
          className={`w-14 shrink-0 text-right text-sm tabular-nums ${
            up ? "text-green-500" : "text-red-500"
          }`}
        >
          {up ? "+" : ""}
          {market.changePercent.toFixed(2)}%
        </span>
      </button>
      <button
        type="button"
        onClick={onToggleFollow}
        className="shrink-0 border border-neutral-600 px-2 py-0.5 text-xs text-neutral-300"
      >
        {following ? "Following" : "Follow"}
      </button>
    </li>
  );
}
