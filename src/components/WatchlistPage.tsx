"use client";

import { useApp } from "@/context/AppContext";
import { getStockProfile } from "@/lib/stockData";
import { CompanyLogo } from "./CompanyLogo";
import { ScreenHeader } from "./ScreenHeader";

interface WatchlistPageProps {
  onClose: () => void;
}

export function WatchlistPage({ onClose }: WatchlistPageProps) {
  const { savedArticles, unsaveArticle } = useApp();

  return (
    <div className="flex h-full min-h-0 flex-col bg-black">
      <ScreenHeader title="Watchlist" onBack={onClose} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        {savedArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-zinc-400">No saved articles yet</p>
            <p className="mt-2 max-w-xs text-sm text-zinc-600">
              Tap the bookmark on any feed card to save articles here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {savedArticles.map((item) => {
              const stock = getStockProfile(item.ticker);
              const up = stock.changePercent >= 0;
              return (
                <li key={item.id} className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <CompanyLogo
                        ticker={item.ticker}
                        color={stock.logoColor}
                        size={40}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white">
                          {item.ticker}
                        </p>
                        <p className="line-clamp-2 text-sm leading-snug text-zinc-300">
                          {item.articleTitle}
                        </p>
                        <a
                          href={item.articleUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block text-xs text-[#00C6C6]"
                          data-no-drag
                        >
                          Read article →
                        </a>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <div className="text-right">
                        <p className="font-semibold tabular-nums text-white">
                          {stock.price.toFixed(2)}
                        </p>
                        <p
                          className={`text-sm font-medium ${
                            up ? "text-pocket-green" : "text-pocket-red"
                          }`}
                        >
                          {up ? "▲" : "▼"}{" "}
                          {Math.abs(stock.changePercent).toFixed(2)}%
                        </p>
                      </div>
                      <button
                        type="button"
                        data-no-drag
                        onClick={() => void unsaveArticle(item.articleId)}
                        className="text-xs text-zinc-500 underline active:text-white"
                      >
                        Remove
                      </button>
                    </div>
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
