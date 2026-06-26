"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Bookmark, ExternalLink, Share2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { ChartRange, Competitor, NewsArticle } from "@/lib/types";
import {
  getChartPointsForPrice,
  getStockProfile,
  resolveChartBasePrice,
} from "@/lib/stockData";
import {
  getMarketThemeConfig,
  getRelatedAssetsFromTickers,
  isMarketThemeTicker,
} from "@/lib/marketThemes";
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
import {
  STOCK_METRIC_EXPLANATIONS,
  type StockMetricExplanation,
} from "@/lib/stockMetricExplanations";
import { markFirstStockViewed } from "@/lib/achievements";
import { recordActivityEvent } from "@/lib/progression";
import { formatDate, readTime } from "@/lib/utils";
import { CompanyLogo } from "./CompanyLogo";
import { FinancialTermPopup } from "./FinancialTermPopup";
import { PriceChart } from "./PriceChart";
import { SourceBadge } from "./SourceBadge";

interface StockPanelProps {
  article: NewsArticle;
  onBack: () => void;
}

const TABS = ["Overview", "Financials", "News", "Analysis"] as const;

const ETORO_URL = "https://www.etoro.com/";

/** Bottom scroll clearance by Stock Panel variant (Safari toolbar + tap room). */
const STOCK_PANEL_BOTTOM_CLEARANCE = {
  equity: "calc(7rem + max(1.25rem, env(safe-area-inset-bottom)))",
  private: "calc(10rem + max(1.25rem, env(safe-area-inset-bottom)))",
  theme: "calc(6rem + max(1.25rem, env(safe-area-inset-bottom)))",
} as const;

function getStockPanelBottomClearance(
  isPrivate: boolean,
  isTheme: boolean
): string {
  if (isPrivate) return STOCK_PANEL_BOTTOM_CLEARANCE.private;
  if (isTheme) return STOCK_PANEL_BOTTOM_CLEARANCE.theme;
  return STOCK_PANEL_BOTTOM_CLEARANCE.equity;
}

interface MetricItem {
  label: string;
  value: string;
  explanationKey?: keyof typeof STOCK_METRIC_EXPLANATIONS;
}

function buildMetrics(ticker: string, stock: NonNullable<ReturnType<typeof getStockProfile>>): MetricItem[] {
  if (isCryptoTicker(ticker)) {
    return [
      { label: "Market Cap", value: stock.marketCap, explanationKey: "Market Cap" },
      { label: "24h Volume", value: stock.volume24h ?? "—", explanationKey: "24h Volume" },
      {
        label: "Circulating Supply",
        value: stock.circulatingSupply ?? "—",
        explanationKey: "Circulating Supply",
      },
    ];
  }

  return [
    { label: "Market Cap", value: stock.marketCap, explanationKey: "Market Cap" },
    { label: "Revenue (TTM)", value: stock.revenue, explanationKey: "Revenue (TTM)" },
    { label: "P/E Ratio", value: stock.peRatio, explanationKey: "P/E Ratio" },
    { label: "EPS (TTM)", value: stock.eps, explanationKey: "EPS (TTM)" },
    { label: "EBITDA", value: stock.ebitda, explanationKey: "EBITDA" },
    {
      label: "Dividend Yield",
      value: stock.dividendYield,
      explanationKey: "Dividend Yield",
    },
  ];
}

export function StockPanel({ article, onBack }: StockPanelProps) {
  const ticker = getArticleDisplayTicker(article);
  const privateCompany = isPrivateTicker(ticker);
  const marketTheme = isMarketThemeTicker(ticker);
  const privateProfile = privateCompany ? getPrivateCompanyProfile(ticker) : null;
  const stock = privateCompany || marketTheme ? null : getStockProfile(ticker);
  const meta = getTickerMetaBySymbol(ticker);
  const themeConfig = marketTheme ? getMarketThemeConfig(ticker) : null;
  const { saveArticle, unsaveArticle, isArticleSaved } = useApp();
  const saved = isArticleSaved(article.id);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Overview");
  const [chartRange, setChartRange] = useState<ChartRange>("1D");
  const [toast, setToast] = useState<string | null>(null);
  const [liveQuote, setLiveQuote] = useState<MassiveStockQuote | null>(null);
  const [activeMetric, setActiveMetric] =
    useState<StockMetricExplanation | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    markFirstStockViewed();
  }, []);

  useEffect(() => {
    recordActivityEvent("stock_panel_opened", ticker, { ticker });
  }, [ticker]);

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
  const showMarketData = stock !== null && !isNonStockMarketTicker(ticker);
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
  const metrics = stock ? buildMetrics(ticker, stock) : [];
  const relatedTitle =
    isCryptoTicker(ticker) || marketTheme ? "Related assets" : "Competitors";
  const competitors = stock?.competitors ?? [];

  // Determine which tabs have real content to show.
  // Set to true / non-empty when that tab's content is implemented.
  const hasFinancialData = false;
  const relatedNews: NewsArticle[] | null = null;
  const assetAnalysis: unknown = null;

  const availableTabs = (
    [
      { id: "Overview", available: true },
      { id: "Financials", available: hasFinancialData },
      { id: "News", available: (relatedNews ?? []).length > 0 },
      { id: "Analysis", available: Boolean(assetAnalysis) },
    ] as Array<{ id: (typeof TABS)[number]; available: boolean }>
  ).filter((tab) => tab.available);

  // Reset to Overview if the active tab is no longer in the available list
  // (e.g. when navigating to a ticker that has fewer tabs).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!availableTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab("Overview");
    }
  }, [availableTabs, activeTab]);

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  const toggleSave = async () => {
    if (saved) {
      const ok = await unsaveArticle(article.id);
      setToast(ok ? "Removed from watchlist" : "Could not remove");
    } else {
      const ok = await saveArticle(article);
      if (ok) {
        recordActivityEvent("stock_watchlisted", ticker, { ticker });
      }
      setToast(ok ? "Added to watchlist" : "Could not save");
    }
    setTimeout(() => setToast(null), 1500);
  };

  const showTabs = !privateCompany && !marketTheme;
  const bottomClearance = getStockPanelBottomClearance(
    privateCompany,
    marketTheme
  );

  return (
    <div className="relative flex h-full flex-col bg-black text-white">
      <div className="relative z-20 shrink-0 bg-black">
        <header className="px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              data-no-drag
              onPointerDown={stop}
              onClick={onBack}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-white/10"
              aria-label="Back"
              style={{ touchAction: "manipulation" }}
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div className="flex shrink-0 items-center gap-1">
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

          {marketTheme && themeConfig ? (
            <StockIdentityHeader
              className="mt-2"
              title={themeConfig.title}
              subtitle={themeConfig.subtitle}
            />
          ) : null}
        </header>

        {showTabs && (
          <nav className="relative flex w-full border-b border-white/[0.08] bg-black px-4 after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-5 after:bg-gradient-to-b after:from-black after:to-transparent after:content-['']">
            {availableTabs.map(({ id: tab }) => (
              <button
                key={tab}
                type="button"
                data-no-drag
                onPointerDown={stop}
                onClick={() => setActiveTab(tab)}
                className={`relative flex-1 pb-2.5 pt-1 text-center text-sm font-medium ${
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
      </div>

      <div
        ref={scrollRef}
        className="relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain px-4"
      >
        {privateCompany && privateProfile ? (
          <PrivateCompanyProfileView
            ticker={ticker}
            profile={privateProfile}
            article={article}
          />
        ) : marketTheme && themeConfig ? (
          <MarketThemePanelView config={themeConfig} />
        ) : showTabs && stock ? (
          <>
            <StockIdentityHeader title={ticker} subtitle={meta.companyName} />
            {activeTab === "Overview" && showMarketData ? (
              <>
                <section className="mt-4 shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[2rem] font-bold leading-none tracking-tight">
                  {displayPrice.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  <span className="text-base font-normal text-zinc-500">
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
                className={`mt-2 text-sm font-semibold ${
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

            <div className="mt-7">
              <PriceChart
                key={`${ticker}-${chartRange}-${Math.round(chartBasePrice)}`}
                data={chartPoints}
                range={chartRange}
                onRangeChange={setChartRange}
              />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {metrics.map((metric) => (
                <Stat
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  onInfoClick={
                    metric.explanationKey
                      ? () =>
                          setActiveMetric(
                            STOCK_METRIC_EXPLANATIONS[metric.explanationKey!]
                          )
                      : undefined
                  }
                />
              ))}
            </div>

            {competitors.length > 0 && (
              <AssetList title={relatedTitle} assets={competitors} />
            )}
              </>
            ) : (
              <div className="flex h-48 items-center justify-center text-zinc-500">
                <p className="text-sm">{activeTab} — coming soon</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-48 items-center justify-center text-zinc-500">
            <p className="text-sm">Overview — coming soon</p>
          </div>
        )}
        <div
          aria-hidden
          className="shrink-0"
          style={{ minHeight: bottomClearance }}
        />
      </div>

      {toast && (
        <div className="pointer-events-none absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/80 px-4 py-2 text-sm text-white">
          {toast}
        </div>
      )}

      <FinancialTermPopup
        term={activeMetric}
        onClose={() => setActiveMetric(null)}
      />
    </div>
  );
}

function StockIdentityHeader({
  title,
  subtitle,
  className = "mt-5",
}: {
  title: string;
  subtitle: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <h1 className="text-[1.625rem] font-bold tracking-tight">{title}</h1>
      <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p>
    </div>
  );
}

function MarketThemePanelView({
  config,
}: {
  config: ReturnType<typeof getMarketThemeConfig>;
}) {
  const relatedAssets = getRelatedAssetsFromTickers(config.relatedTickers);

  return (
    <div>
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-6 text-center">
        <p className="text-sm leading-relaxed text-zinc-400">{config.message}</p>
      </div>

      {relatedAssets.length > 0 && (
        <AssetList title="Related assets" assets={relatedAssets} />
      )}
    </div>
  );
}

function AssetList({ title, assets }: { title: string; assets: Competitor[] }) {
  return (
    <div className="mt-8">
      <h2 className="font-semibold">{title}</h2>
      <ul className="mt-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
        {assets.map((asset, index) => (
          <li
            key={asset.ticker}
            className={`flex items-center justify-between px-4 py-3.5 ${
              index < assets.length - 1 ? "border-b border-white/[0.06]" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <CompanyLogo ticker={asset.ticker} color={asset.color} size={36} />
              <div>
                <p className="font-semibold">{asset.ticker}</p>
                <p className="text-xs text-zinc-500">{asset.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">{asset.price.toFixed(2)}</p>
              <p
                className={`text-xs font-medium ${
                  asset.changePercent >= 0
                    ? "text-pocket-green"
                    : "text-pocket-red"
                }`}
              >
                {asset.changePercent >= 0 ? "▲" : "▼"}{" "}
                {Math.abs(asset.changePercent).toFixed(2)}%
              </p>
            </div>
          </li>
        ))}
      </ul>
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
    <div className="mt-3">
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

function Stat({
  label,
  value,
  onInfoClick,
}: {
  label: string;
  value: string;
  onInfoClick?: () => void;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-3">
      <div className="flex items-center gap-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          {label}
        </p>
        {onInfoClick && (
          <button
            type="button"
            data-no-drag
            data-interactive
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onInfoClick();
            }}
            className="flex h-4 w-4 items-center justify-center text-xs leading-none text-[#9ca3af]"
            aria-label={`What is ${label}?`}
            style={{ touchAction: "manipulation" }}
          >
            ⓘ
          </button>
        )}
      </div>
      <p className="mt-1.5 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
