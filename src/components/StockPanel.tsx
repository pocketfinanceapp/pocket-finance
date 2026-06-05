"use client";

import { useState } from "react";
import { ArrowLeft, Bookmark, ExternalLink, Share2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { ChartRange, NewsArticle } from "@/lib/types";
import { getStockProfile } from "@/lib/stockData";
import { CompanyLogo } from "./CompanyLogo";
import { PriceChart } from "./PriceChart";

interface StockPanelProps {
  article: NewsArticle;
  onBack: () => void;
}

const TABS = ["Overview", "Financials", "News", "Analysis"] as const;

const ETORO_URL = "https://www.etoro.com/";

export function StockPanel({ article, onBack }: StockPanelProps) {
  const stock = getStockProfile(article.ticker);
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useApp();
  const saved = isInWatchlist(stock.ticker);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Overview");
  const [chartRange, setChartRange] = useState<ChartRange>("1D");
  const [toast, setToast] = useState<string | null>(null);
  const isUp = stock.changePercent >= 0;

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  const toggleSave = () => {
    if (saved) {
      removeFromWatchlist(stock.ticker);
      setToast("Removed from watchlist");
    } else {
      addToWatchlist(stock.ticker);
      setToast("Added to watchlist");
    }
    setTimeout(() => setToast(null), 1500);
  };

  return (
    <div className="flex h-full flex-col bg-[#0a0a0a] text-white">
      <header className="shrink-0 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-start justify-between">
          <button
            type="button"
            data-no-drag
            onPointerDown={stop}
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-full active:bg-white/10"
            aria-label="Back"
            style={{ touchAction: "manipulation" }}
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              data-no-drag
              onPointerDown={stop}
              onClick={toggleSave}
              className="flex h-11 w-11 items-center justify-center rounded-full active:bg-white/10"
              aria-label={saved ? "Remove from watchlist" : "Save to watchlist"}
              style={{ touchAction: "manipulation" }}
            >
              <Bookmark
                className={`h-5 w-5 ${saved ? "fill-white text-white" : "text-white"}`}
              />
            </button>
            <button
              type="button"
              data-no-drag
              onPointerDown={stop}
              onClick={() => {
                void navigator.share?.({
                  title: stock.ticker,
                  url: ETORO_URL,
                });
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full active:bg-white/10"
              aria-label="Share"
              style={{ touchAction: "manipulation" }}
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-1 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold">{stock.ticker}</h1>
            <p className="text-sm text-zinc-400">{stock.name}</p>
          </div>
          <CompanyLogo
            ticker={stock.ticker}
            color={stock.logoColor}
            size={44}
          />
        </div>

        <nav className="mt-4 flex gap-5 border-b border-white/[0.08]">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              data-no-drag
              onPointerDown={stop}
              onClick={() => setActiveTab(tab)}
              className={`relative pb-2.5 text-sm font-medium ${
                activeTab === tab ? "text-white" : "text-zinc-500"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6]" />
              )}
            </button>
          ))}
        </nav>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {activeTab === "Overview" ? (
          <>
            <div className="mt-4">
              <p className="text-3xl font-bold tracking-tight">
                {stock.price.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                <span className="text-lg font-normal text-zinc-400">USD</span>
              </p>
              <p
                className={`mt-1 text-sm font-medium ${
                  isUp ? "text-pocket-green" : "text-pocket-red"
                }`}
              >
                {isUp ? "▲" : "▼"} {Math.abs(stock.change).toFixed(2)} (
                {Math.abs(stock.changePercent).toFixed(2)}%) Today
              </p>
            </div>

            <a
              href={`${ETORO_URL}?utm_source=pocket_finance`}
              target="_blank"
              rel="noopener noreferrer"
              data-no-drag
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.04] py-3.5 text-sm font-semibold text-white transition-colors active:scale-[0.98] active:bg-white/[0.08]"
              style={{ touchAction: "manipulation" }}
            >
              Trade this stock
              <ExternalLink className="h-4 w-4" />
            </a>
            <p className="mt-1.5 text-center text-[10px] text-zinc-600">
              Affiliate partner · eToro
            </p>

            <PriceChart
              data={stock.chartData[chartRange]}
              range={chartRange}
              onRangeChange={setChartRange}
            />

            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-7 border-t border-white/[0.08] pt-8">
              <Stat label="Market Cap" value={stock.marketCap} />
              <Stat label="Revenue (TTM)" value={stock.revenue} />
              <Stat label="P/E Ratio" value={stock.peRatio} />
              <Stat label="EPS (TTM)" value={stock.eps} />
              <Stat label="EBITDA" value={stock.ebitda} />
              <Stat label="Dividend Yield" value={stock.dividendYield} />
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Competitors</h2>
                <span className="bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] bg-clip-text text-sm font-medium text-transparent">
                  View all
                </span>
              </div>
              <ul className="mt-3 divide-y divide-white/[0.08]">
                {stock.competitors.map((c) => (
                  <li
                    key={c.ticker}
                    className="flex items-center justify-between py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <CompanyLogo
                        ticker={c.ticker}
                        color={c.color}
                        size={36}
                      />
                      <div>
                        <p className="font-semibold">{c.ticker}</p>
                        <p className="text-xs text-zinc-500">{c.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{c.price.toFixed(2)}</p>
                      <p
                        className={`text-xs font-medium ${
                          c.changePercent >= 0
                            ? "text-pocket-green"
                            : "text-pocket-red"
                        }`}
                      >
                        {c.changePercent >= 0 ? "▲" : "▼"}{" "}
                        {Math.abs(c.changePercent).toFixed(2)}%
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <div className="flex h-48 items-center justify-center text-zinc-500">
            <p className="text-sm">{activeTab} — coming soon</p>
          </div>
        )}
      </div>

      {toast && (
        <div className="pointer-events-none absolute bottom-28 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/80 px-4 py-2 text-sm text-white">
          {toast}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-1.5 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
