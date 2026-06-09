"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Bookmark, ExternalLink, Share2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { ChartRange, NewsArticle } from "@/lib/types";
import {
  getChartPointsForPrice,
  getStockProfile,
  resolveChartBasePrice,
} from "@/lib/stockData";
import {
  getPrivateCompanyProfile,
  isPrivateTicker,
  type PrivateCompanyProfile,
} from "@/lib/privateTickers";
import type { MassiveStockQuote } from "@/lib/massiveApi";
import {
  isCryptoTicker,
  isNonStockMarketTicker,
  isUsListedStockTicker,
} from "@/lib/usStockTickers";
import { getArticleDisplayTicker, getTickerMetaBySymbol } from "@/lib/tickerMap";
import { formatDate, readTime } from "@/lib/utils";
import { CompanyLogo } from "./CompanyLogo";
import { PriceChart } from "./PriceChart";
import { SourceBadge } from "./SourceBadge";

interface StockPanelProps {
  article: NewsArticle;
  onBack: () => void;
}

const TABS = ["Overview", "Financials", "News", "Analysis"] as const;

const ETORO_URL = "https://www.etoro.com/";

export function StockPanel({ article, onBack }: StockPanelProps) {
  const ticker = getArticleDisplayTicker(article);
  const privateCompany = isPrivateTicker(ticker);
  const privateProfile = privateCompany ? getPrivateCompanyProfile(ticker) : null;
  const stock = privateCompany ? null : getStockProfile(ticker);
  const meta = getTickerMetaBySymbol(ticker);
  const { saveArticle, unsaveArticle, isArticleSaved } = useApp();
  const saved = isArticleSaved(article.id);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Overview");
  const [chartRange, setChartRange] = useState<ChartRange>("1D");
  const [toast, setToast] = useState<string | null>(null);
  const [liveQuote, setLiveQuote] = useState<MassiveStockQuote | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveTab("Overview");
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [article.id, ticker]);

  useEffect(() => {
    if (activeTab === "Overview") {
      scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [activeTab, ticker]);

  useEffect(() => {
    setLiveQuote(null);
    if (!stock || privateCompany || !isUsListedStockTicker(ticker)) return;

    let cancelled = false;

    void fetch(`/api/stock?ticker=${encodeURIComponent(ticker)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: MassiveStockQuote | null) => {
        if (
          !cancelled &&
          (data?.source === "massive" || data?.source === "override")
        ) {
          setLiveQuote(data);
        }
      })
      .catch(() => {
        /* fall back to demo price */
      });

    return () => {
      cancelled = true;
    };
  }, [ticker, stock, privateCompany]);

  const displayPrice = liveQuote?.price ?? stock?.price ?? 0;
  const displayChange = liveQuote?.change ?? stock?.change ?? 0;
  const displayChangePercent =
    liveQuote?.changePercent ?? stock?.changePercent ?? 0;
  const hasMassiveQuote = liveQuote !== null;
  const isUp = displayChangePercent >= 0;
  const showMarketData = !isNonStockMarketTicker(ticker);
  const tradeLabel = isCryptoTicker(ticker)
    ? "Trade this crypto"
    : "Trade this stock";
  const chartBasePrice = resolveChartBasePrice(
    displayPrice,
    stock?.price,
    ticker
  );
  const chartPoints = useMemo(
    () =>
      stock && showMarketData && chartBasePrice > 0
        ? getChartPointsForPrice(
            chartBasePrice,
            ticker,
            chartRange,
            stock.price
          )
        : [],
    [stock, showMarketData, chartBasePrice, ticker, chartRange]
  );

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  const toggleSave = async () => {
    if (saved) {
      const ok = await unsaveArticle(article.id);
      setToast(ok ? "Removed from watchlist" : "Could not remove");
    } else {
      const ok = await saveArticle(article);
      setToast(ok ? "Added to watchlist" : "Could not save");
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
                  title: ticker,
                  url: article.sourceUrl,
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

        {!privateCompany && (
          <div className="mt-1">
            <h1 className="text-xl font-bold">{ticker}</h1>
            <p className="text-sm text-zinc-400">{meta.companyName}</p>
          </div>
        )}

        {!privateCompany && (
          <nav className="mt-4 flex w-full border-b border-white/[0.08]">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                data-no-drag
                onPointerDown={stop}
                onClick={() => setActiveTab(tab)}
                className={`relative flex-1 pb-2.5 text-center text-sm font-medium ${
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
        )}
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-32">
        {privateCompany && privateProfile ? (
          <PrivateCompanyProfileView
            ticker={ticker}
            profile={privateProfile}
            article={article}
          />
        ) : activeTab === "Overview" && stock ? (
          showMarketData ? (
            <>
              <section className="mt-4 shrink-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-3xl font-bold tracking-tight">
                    {displayPrice.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    <span className="text-lg font-normal text-zinc-400">
                      USD
                    </span>
                  </p>
                  {hasMassiveQuote && (
                    <div className="flex flex-col gap-0.5">
                      <span className="w-fit rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Delayed
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        Prices delayed 15min
                      </span>
                    </div>
                  )}
                </div>
                <p
                  className={`mt-1 text-sm font-medium ${
                    isUp ? "text-pocket-green" : "text-pocket-red"
                  }`}
                >
                  {isUp ? "▲" : "▼"} {Math.abs(displayChange).toFixed(2)} (
                  {Math.abs(displayChangePercent).toFixed(2)}%) Today
                </p>
              </section>

              <a
                href={`${ETORO_URL}?utm_source=pocket_finance`}
                target="_blank"
                rel="noopener noreferrer"
                data-no-drag
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] py-3.5 text-sm font-bold text-white shadow-[0_8px_32px_rgba(59,110,245,0.25)] transition-transform active:scale-[0.98]"
                style={{ touchAction: "manipulation" }}
              >
                {tradeLabel}
                <ExternalLink className="h-4 w-4" />
              </a>
              <p className="mt-1.5 text-center text-[10px] text-zinc-600">
                Affiliate partner · eToro
              </p>

              <PriceChart
                key={`${ticker}-${chartRange}-${Math.round(chartBasePrice)}`}
                data={chartPoints}
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

              {stock.competitors.length > 0 && (
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
              )}
            </>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">
              Market data not available for this ticker
            </p>
          )
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

function parseMilestone(entry: string): { year: string; text: string } {
  const match = entry.match(/^(\d{4})\s*[—–-]\s*(.+)$/);
  if (match) return { year: match[1], text: match[2] };
  return { year: "", text: entry };
}

function PrivateCompanyProfileView({
  ticker,
  profile,
  article,
}: {
  ticker: string;
  profile: PrivateCompanyProfile;
  article: NewsArticle;
}) {
  return (
    <div className="mt-2">
      <div className="flex flex-col items-center text-center">
        <CompanyLogo
          ticker={ticker}
          color={profile.color}
          size={80}
          shape="circle"
        />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          {profile.fullName}
        </h1>
        <span className="mt-2 rounded-full bg-zinc-700/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-300">
          Private Company
        </span>
        <p className="mt-3 text-sm text-zinc-500">
          Founded {profile.founded} · {profile.headquarters} · CEO{" "}
          {profile.ceo}
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-4 text-center">
        <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          Last Known Valuation
        </p>
        <p className="mt-1.5 text-3xl font-bold tracking-tight text-white">
          {profile.valuation}
        </p>
        <p className="mt-1 text-xs text-zinc-500">Not publicly traded</p>
      </div>

      <p className="mt-6 text-[15px] leading-relaxed text-zinc-300">
        {profile.description}
      </p>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Key Milestones
        </h2>
        <ul className="relative mt-4 space-y-0 border-l border-white/[0.1] pl-5">
          {profile.milestones.map((entry) => {
            const { year, text } = parseMilestone(entry);
            return (
              <li key={entry} className="relative pb-5 last:pb-0">
                <span
                  className="absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[#0a0a0a]"
                  style={{ backgroundColor: profile.color }}
                />
                {year && (
                  <p className="text-xs font-semibold text-zinc-500">{year}</p>
                )}
                <p className="mt-0.5 text-sm leading-snug text-zinc-200">
                  {text}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <PrivateCompanyNews article={article} />
    </div>
  );
}

function PrivateCompanyNews({ article }: { article: NewsArticle }) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        News
      </h2>

      <article className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
        <h3 className="text-lg font-bold leading-snug">{article.headline}</h3>

        {article.subheading && (
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            {article.subheading}
          </p>
        )}

        <div className="mt-3 opacity-80">
          <SourceBadge
            sourceName={article.sourceName}
            sourceId={article.sourceId}
            sourceUrl={article.sourceUrl}
            publishedAt={article.publishedAt}
            timeLabel={`${formatDate(article.publishedAt)} · ${readTime(article.body)}`}
            size="sm"
          />
        </div>

        {article.imageUrl && (
          <div className="relative mt-4 aspect-[16/10] w-full overflow-hidden rounded-xl">
            <Image
              src={article.imageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 430px) 100vw"
              unoptimized
            />
          </div>
        )}

        <a
          href={article.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-no-drag
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.04] py-3 text-sm font-semibold text-white transition-colors active:scale-[0.98] active:bg-white/[0.08]"
          style={{ touchAction: "manipulation" }}
        >
          Read full article
          <ExternalLink className="h-4 w-4" />
        </a>
      </article>
    </section>
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
