"use client";

import { useApp } from "@/context/AppContext";
import { CompanyLogo } from "./CompanyLogo";
import { ScreenHeader } from "./ScreenHeader";

interface WatchlistPageProps {
  onClose: () => void;
}

export function WatchlistPage({ onClose }: WatchlistPageProps) {
  const { watchlist, removeFromWatchlist } = useApp();

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-[#0a0a0a]">
      <ScreenHeader title="Watchlist" onBack={onClose} />
      <div className="flex-1 overflow-y-auto px-4 pb-28">
        {watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-zinc-400">No saved stocks yet</p>
            <p className="mt-2 max-w-xs text-sm text-zinc-600">
              Swipe to a stock panel and tap Save to add tickers here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {watchlist.map((item) => {
              const up = item.changePercent >= 0;
              return (
                <li
                  key={item.ticker}
                  className="flex items-center justify-between py-4"
                >
                  <div className="flex items-center gap-3">
                    <CompanyLogo
                      ticker={item.ticker}
                      color={item.logoColor}
                      size={40}
                    />
                    <div>
                      <p className="font-semibold text-white">{item.ticker}</p>
                      <p className="text-xs text-zinc-500">{item.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold tabular-nums text-white">
                        {item.price.toFixed(2)}
                      </p>
                      <p
                        className={`text-sm font-medium ${
                          up ? "text-pocket-green" : "text-pocket-red"
                        }`}
                      >
                        {up ? "▲" : "▼"} {Math.abs(item.changePercent).toFixed(2)}%
                      </p>
                    </div>
                    <button
                      type="button"
                      data-no-drag
                      onClick={() => removeFromWatchlist(item.ticker)}
                      className="text-xs text-zinc-500 underline active:text-white"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
