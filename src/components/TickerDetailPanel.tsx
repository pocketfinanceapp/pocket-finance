"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check, Plus } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useNavigation } from "@/context/NavigationContext";
import { getTickerMetaBySymbol } from "@/lib/tickerMap";
import type { MarketauxSentimentPoint } from "@/lib/marketauxApi";
import type { NewsArticle } from "@/lib/types";
import {
  panelEnterStyle,
  PANEL_EXIT_MS,
  useTabEntered,
} from "@/lib/tabEnterAnimation";
import { timeAgo } from "@/lib/utils";
import { recordActivityEvent } from "@/lib/progression";
import { CompanyLogo } from "./CompanyLogo";
import { SentimentBadge } from "./SentimentBadge";

interface TickerDetailPanelProps {
  ticker: string;
  catalogArticles: NewsArticle[];
  onClose: () => void;
}

/** Simple SVG sentiment-over-time line — never a price chart. */
function SentimentSparkline({ points }: { points: MarketauxSentimentPoint[] }) {
  const withData = points.filter(
    (p): p is MarketauxSentimentPoint & { sentimentAvg: number } =>
      p.sentimentAvg !== null
  );
  if (withData.length < 2) return null;

  const width = 320;
  const height = 120;
  const padding = 14;
  const values = withData.map((p) => p.sentimentAvg);
  const min = Math.min(-0.3, ...values);
  const max = Math.max(0.3, ...values);
  const range = max - min || 1;

  const coords = withData.map((p, i) => {
    const x =
      padding + (i / (withData.length - 1)) * (width - padding * 2);
    const y =
      height - padding - ((p.sentimentAvg - min) / range) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const zeroY = height - padding - ((0 - min) / range) * (height - padding * 2);
  const last = coords[coords.length - 1]?.split(",").map(Number);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-[120px] w-full"
      preserveAspectRatio="none"
    >
      <line
        x1={padding}
        y1={zeroY}
        x2={width - padding}
        y2={zeroY}
        stroke="var(--pocket-border)"
        strokeDasharray="4 4"
        strokeWidth="1"
      />
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke="#00C6C6"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last && (
        <circle cx={last[0]} cy={last[1]} r={3.5} fill="#00C6C6" />
      )}
    </svg>
  );
}

export function TickerDetailPanel({
  ticker,
  catalogArticles,
  onClose,
}: TickerDetailPanelProps) {
  const {
    clearFilters,
    setSearchQuery,
    requestFeedJump,
    toggleFollowTicker,
    isFollowingTicker,
  } = useApp();
  const { navigate } = useNavigation();
  const [exiting, setExiting] = useState(false);
  const entered = useTabEntered(true);
  const [points, setPoints] = useState<MarketauxSentimentPoint[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);
  const [followToast, setFollowToast] = useState<string | null>(null);

  const following = isFollowingTicker(ticker);
  const articles = catalogArticles
    .filter((a) => a.ticker.toUpperCase() === ticker.toUpperCase())
    .slice(0, 8);

  // Tickers outside our ~170-entry curated catalog fall back to showing the
  // bare ticker as the "company name" (e.g. header reads "SCHL / SCHL"
  // instead of "Scholastic Corporation / SCHL"). The articles already
  // loaded for this ticker carry Marketaux's real entity name, so prefer
  // that over the generic fallback rather than one-off adding every company
  // to the static catalog.
  const catalogMeta = getTickerMetaBySymbol(ticker);
  const isGenericFallback =
    catalogMeta.companyName.toUpperCase() === ticker.toUpperCase();
  const realCompanyName = articles.find(
    (a) => a.companyName && a.companyName.toUpperCase() !== ticker.toUpperCase()
  )?.companyName;
  const meta =
    isGenericFallback && realCompanyName
      ? { ...catalogMeta, companyName: realCompanyName }
      : catalogMeta;

  const handleBack = () => {
    setExiting(true);
    window.setTimeout(onClose, PANEL_EXIT_MS);
  };

  const handleFollow = () => {
    const wasFollowing = following;
    toggleFollowTicker(ticker);
    if (!wasFollowing) {
      recordActivityEvent("stock_watchlisted", ticker, { ticker });
    }
    setFollowToast(
      wasFollowing
        ? `Unfollowed ${ticker.toUpperCase()}`
        : `Following ${ticker.toUpperCase()} — more stories like this in your feed`
    );
    window.setTimeout(() => setFollowToast(null), 2200);
  };

  // Drives "Market Watcher" / "Ticker Hunter" progression achievements —
  // this Explore ticker page is the current equivalent of the old
  // stock-detail panel those were originally written against.
  useEffect(() => {
    if (!ticker) return;
    recordActivityEvent("stock_panel_opened", ticker, { ticker });
  }, [ticker]);

  useEffect(() => {
    let cancelled = false;
    setLoadingChart(true);
    fetch(`/api/marketaux/entity-stats?symbol=${encodeURIComponent(ticker)}&days=30`)
      .then((res) => (res.ok ? res.json() : { points: [] }))
      .then((data: { points?: MarketauxSentimentPoint[] }) => {
        if (!cancelled) setPoints(data.points ?? []);
      })
      .catch(() => {
        if (!cancelled) setPoints([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingChart(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ticker]);

  const latestSentiment =
    [...points].reverse().find((p) => p.sentimentAvg !== null)?.sentimentAvg ??
    null;
  const chartablePoints = points.filter((p) => p.sentimentAvg !== null);

  const openArticle = (article: NewsArticle) => {
    requestFeedJump(article.id);
    navigate("home");
  };

  const viewAllStories = () => {
    clearFilters();
    setSearchQuery(ticker);
    navigate("home");
  };

  return (
    <div
      className="absolute inset-0 z-20 flex h-full min-h-0 flex-col pf-page bg-pocket-bg"
      style={panelEnterStyle(entered && !exiting)}
    >
      <header
        className="flex shrink-0 items-center gap-3 border-b border-[var(--pocket-border)] px-4 pb-3"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <button
          type="button"
          data-no-drag
          onClick={handleBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full active:bg-[var(--pocket-surface-hover)]"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5 text-pocket-text" />
        </button>
        <CompanyLogo ticker={ticker} color={meta.logoColor} size={36} shape="circle" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-pocket-text">
            {meta.companyName}
          </p>
          <p className="text-[12px] text-pocket-muted">{ticker.toUpperCase()}</p>
        </div>
        <button
          type="button"
          data-no-drag
          onClick={handleFollow}
          className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-bold transition-colors active:opacity-70 ${
            following
              ? "border-[#00C6C6]/35 bg-[#00C6C6]/14 text-[#00C6C6]"
              : "border-[var(--pocket-border)] text-pocket-text"
          }`}
        >
          {following ? (
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          ) : (
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          )}
          {following ? "Following" : "Follow"}
        </button>
      </header>

      {followToast && (
        <p
          className="mx-4 mt-3 rounded-xl border border-[#00C6C6]/25 bg-[#00C6C6]/10 px-3 py-2 text-center text-[12px] font-medium text-[#00C6C6]"
          data-no-drag
        >
          {followToast}
        </p>
      )}

      <div
        className="min-h-0 flex-1 overflow-y-auto px-5 pt-5"
        style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}
      >
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-bold uppercase tracking-widest text-pocket-muted">
              News sentiment · 30 days
            </h2>
            {latestSentiment !== null && (
              <SentimentBadge score={latestSentiment} size="xs" />
            )}
          </div>
          <div className="mt-3 rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)] p-4">
            {loadingChart ? (
              <div className="flex h-[120px] items-center justify-center text-[12px] text-pocket-muted">
                Loading…
              </div>
            ) : chartablePoints.length >= 2 ? (
              <SentimentSparkline points={points} />
            ) : (
              <div className="flex h-[120px] items-center justify-center px-4 text-center text-[12px] text-pocket-muted">
                Not enough recent coverage to chart sentiment yet.
              </div>
            )}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-pocket-muted">
            Based on recent news coverage for{" "}
            {meta.companyName} — a read on news tone, never a price chart.
          </p>
        </section>

        <section className="mt-7">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-bold uppercase tracking-widest text-pocket-muted">
              Latest stories
            </h2>
            <button
              type="button"
              data-no-drag
              onClick={viewAllStories}
              className="text-[12px] font-semibold text-[#00C6C6] active:opacity-60"
            >
              View all
            </button>
          </div>
          {articles.length === 0 ? (
            <p className="mt-3 text-[13px] text-pocket-muted">
              No stories in your feed right now.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--pocket-border)] overflow-hidden rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)]">
              {articles.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    data-no-drag
                    onClick={() => openArticle(a)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left active:bg-[var(--pocket-surface-hover)]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-pocket-text">
                        {a.headline}
                      </p>
                      <p className="mt-1 text-[11px] text-pocket-muted">
                        {a.sourceName} · {timeAgo(a.publishedAt)}
                      </p>
                    </div>
                    <SentimentBadge
                      score={a.sentimentScore}
                      size="xs"
                      explainOnTap={false}
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
