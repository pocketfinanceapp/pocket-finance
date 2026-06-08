"use client";

import { useApp } from "@/context/AppContext";
import { getStockProfile } from "@/lib/stockData";
import { getTickerMetaBySymbol, resolveSavedTicker } from "@/lib/tickerMap";
import { shouldShowWatchlistPrice } from "@/lib/usStockTickers";
import { CompanyLogo } from "./CompanyLogo";

export function WatchlistPage() {
  const { savedArticles, unsaveArticle } = useApp();

  return (
    <div className="flex h-full min-h-0 flex-col bg-black text-white">
      <header className="shrink-0 border-b border-white/10 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
        <h1 className="text-[28px] font-bold tracking-tight">Watchlist</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pb-2">
        {savedArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
            <p className="text-zinc-400">No saved articles yet</p>
            <p className="mt-2 max-w-xs text-sm text-zinc-600">
              Tap the bookmark on any feed card to save articles here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {savedArticles.map((item) => {
              const ticker = resolveSavedTicker(item);
              const meta = getTickerMetaBySymbol(ticker);
              const showPrice = shouldShowWatchlistPrice(ticker);
              const stock = showPrice ? getStockProfile(ticker) : null;
              const up = stock ? stock.changePercent >= 0 : false;
              return (
                <li key={item.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <CompanyLogo
                        ticker={ticker}
                        color={meta.logoColor}
                        size={40}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white">{ticker}</p>
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
                      {showPrice && stock ? (
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
                      ) : null}
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
