"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BarChart2,
  Bookmark,
  Building2,
  Heart,
  MessageCircle,
  Share2,
} from "lucide-react";
import type { NewsArticle } from "@/lib/types";
import type { PocketBriefing } from "@/lib/briefing";
import { FeedCardFallbackBackground } from "@/components/FeedCardFallbackBackground";
import { CompanyLogo } from "@/components/CompanyLogo";
import { ProfileNavIcon } from "@/components/icons/ProfileNavIcon";
import { LANDING_STOCK } from "@/lib/landingDemoData";

export function LandingDemoFeedHeader({
  activeTab = "forYou",
  compact = false,
}: {
  activeTab?: "forYou" | "trending";
  compact?: boolean;
}) {
  const text = compact ? "text-[6px] sm:text-[7px]" : "text-[6.5px] sm:text-[8px] md:text-[9px]";
  return (
    <div
      className={`shrink-0 border-b border-[var(--pocket-border)] bg-pocket-bg/95 px-1 pb-1 pt-2 sm:px-2.5 ${
        compact ? "pt-1.5" : ""
      }`}
    >
      <div
        className={`grid w-full grid-cols-3 text-center font-semibold leading-none tracking-tight ${text}`}
      >
        {(["For You", "Trending"] as const).map((tab, i) => {
          const active =
            (tab === "For You" && activeTab === "forYou") ||
            (tab === "Trending" && activeTab === "trending");
          return (
            <span
              key={tab}
              className={`relative inline-block whitespace-nowrap pb-1.5 ${
                active ? "text-pocket-text" : "text-pocket-muted/50"
              }`}
            >
              {tab}
              {active && (
                <span className="absolute bottom-0 left-1/2 h-px w-[85%] -translate-x-1/2 rounded-full bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] landing-tab-indicator" />
              )}
            </span>
          );
        })}
        <span className="pb-1.5" aria-hidden />
      </div>
    </div>
  );
}

export function LandingDemoFeedCard({
  article,
  compact = false,
  showRailPulse = false,
}: {
  article: NewsArticle;
  compact?: boolean;
  showRailPulse?: boolean;
}) {
  const iconClass = compact ? "h-3 w-3" : "h-4 w-4";
  return (
    <div className="relative h-full w-full overflow-hidden bg-pocket-feed-bg">
      <FeedCardFallbackBackground article={article} category="Tech" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/80" />

      <div
        className={`absolute left-2 right-2 top-2 z-10 flex items-center justify-between ${
          compact ? "top-1.5" : ""
        }`}
      >
        <span className="rounded-full border border-white/10 bg-black/50 px-1.5 py-0.5 text-[7px] font-bold text-white backdrop-blur-sm sm:text-[8px]">
          {article.ticker}
        </span>
        <span className="text-[8px] font-bold text-pocket-green sm:text-[9px]">
          +2.8%
        </span>
      </div>

      <aside
        className={`absolute bottom-12 right-1.5 z-10 flex flex-col items-center gap-2 sm:bottom-16 sm:right-2.5 sm:gap-3 ${
          showRailPulse ? "landing-rail-pulse" : ""
        }`}
      >
        <Heart className={`${iconClass} text-white/90`} strokeWidth={2} />
        <MessageCircle className={`${iconClass} text-white/90`} strokeWidth={2} />
        <Share2 className={`${iconClass} text-white/90`} strokeWidth={2} />
        <Bookmark className={`${iconClass} text-white/90`} strokeWidth={2} />
      </aside>

      <div
        className={`absolute bottom-3 left-2 right-8 z-10 sm:bottom-4 sm:left-3 sm:right-10 ${
          compact ? "bottom-2 left-1.5 right-6" : ""
        }`}
      >
        <h3
          className={`line-clamp-2 font-bold leading-[1.35] text-white ${
            compact ? "text-[8px]" : "text-[11px] sm:text-[12px]"
          }`}
        >
          {article.headline}
        </h3>
        <p
          className={`mt-1 text-white/60 ${compact ? "text-[6px]" : "text-[8px] sm:text-[9px]"}`}
        >
          {article.sourceName} · 1m ago
        </p>
      </div>
    </div>
  );
}

export function LandingDemoArticlePanel({
  article,
  briefing,
  briefingVisible = false,
  scrollOffset = 0,
  compact = false,
}: {
  article: NewsArticle;
  briefing: PocketBriefing;
  briefingVisible?: boolean;
  scrollOffset?: number;
  compact?: boolean;
}) {
  const text = compact ? "text-[7px]" : "text-[8px] sm:text-[9px]";
  const title = compact ? "text-[9px]" : "text-[11px] sm:text-[12px]";
  return (
    <div className="flex h-full min-h-0 flex-col bg-pocket-bg">
      <header className="flex shrink-0 items-center justify-between border-b border-[var(--pocket-border)] px-2 py-1.5">
        <ArrowLeft className={compact ? "h-3 w-3" : "h-4 w-4"} />
        <Bookmark className={compact ? "h-3 w-3" : "h-4 w-4"} />
      </header>
      <div
        className="min-h-0 flex-1 overflow-hidden transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `translateY(-${scrollOffset}px)` }}
      >
        <div className="px-2.5 pb-3 pt-2">
          <span
            className={`rounded-full border border-[var(--pocket-border)] bg-[var(--pocket-card)] px-1.5 py-0.5 font-bold text-[#00C6C6] ${text}`}
          >
            {article.ticker}
          </span>
          <h3 className={`mt-1.5 font-bold leading-snug text-pocket-text ${title}`}>
            {article.headline}
          </h3>
          <p className={`mt-1 leading-snug text-pocket-muted ${text}`}>
            {article.subheading}
          </p>
          <div
            className={`mt-2 rounded-lg border border-[#00C6C6]/20 bg-[#00C6C6]/5 p-2 ${
              briefingVisible ? "landing-briefing-in" : "opacity-40"
            }`}
          >
            <p className={`font-semibold uppercase tracking-wide text-[#00C6C6] ${text}`}>
              Pocket Briefing
            </p>
            {briefingVisible ? (
              <div className="mt-1 space-y-1">
                <p className={`leading-relaxed text-pocket-text ${text}`}>
                  {briefing.lede}
                </p>
                <p className={`leading-relaxed text-pocket-muted ${text}`}>
                  {briefing.takeaway}
                </p>
              </div>
            ) : (
              <div className="mt-1 space-y-1" aria-hidden>
                <div className="h-1.5 w-full animate-pulse rounded bg-white/10" />
                <div className="h-1.5 w-[80%] animate-pulse rounded bg-white/10" />
              </div>
            )}
          </div>
          <p className={`mt-2 leading-relaxed text-pocket-muted ${text}`}>
            {article.body} Markets are watching whether AI infrastructure spending
            can keep supporting the semiconductor complex through the next
            earnings cycle.
          </p>
        </div>
      </div>
    </div>
  );
}

export function LandingDemoStockPanel({
  chartRange = "1M",
  infoOpen = false,
  compact = false,
}: {
  chartRange?: string;
  infoOpen?: boolean;
  compact?: boolean;
}) {
  const stock = LANDING_STOCK;
  const text = compact ? "text-[6px]" : "text-[7px] sm:text-[8px]";
  const price = compact ? "text-[10px]" : "text-[12px] sm:text-[14px]";
  const ranges = ["1D", "1W", "1M", "3M", "1Y"] as const;
  const min = Math.min(...stock.chartPoints);
  const max = Math.max(...stock.chartPoints);
  const w = 200;
  const h = 48;
  const pts = stock.chartPoints
    .map((p, i) => {
      const x = (i / (stock.chartPoints.length - 1)) * w;
      const y = h - ((p - min) / (max - min)) * (h - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-pocket-bg">
      <header className="flex shrink-0 items-center gap-2 border-b border-[var(--pocket-border)] px-2 py-1.5">
        <ArrowLeft className={compact ? "h-3 w-3" : "h-4 w-4"} />
        <CompanyLogo ticker={stock.ticker} color={stock.color} size={compact ? 20 : 24} />
        <div className="min-w-0 flex-1">
          <p className={`font-bold text-pocket-text ${compact ? "text-[8px]" : "text-[10px]"}`}>
            {stock.ticker}
          </p>
          <p className={`truncate text-pocket-muted ${text}`}>{stock.companyName}</p>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden px-2 py-2">
        <p className={`font-bold text-pocket-text ${price}`}>
          ${stock.price.toFixed(2)}
        </p>
        <p className={`font-semibold text-pocket-green ${text}`}>
          +{stock.changePercent.toFixed(2)}% Today
        </p>
        <div className="mt-1.5 flex gap-1 overflow-hidden">
          {ranges.map((r) => (
            <span
              key={r}
              className={`shrink-0 rounded-full px-1.5 py-0.5 font-medium ${text} ${
                r === chartRange
                  ? "bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] text-white landing-range-active"
                  : "bg-[var(--pocket-surface-hover)] text-pocket-muted"
              }`}
            >
              {r}
            </span>
          ))}
        </div>
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className={`mt-1.5 w-full ${compact ? "h-8" : "h-10"}`}
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id="landing-demo-chart" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3B6EF5" />
              <stop offset="100%" stopColor="#00C6C6" />
            </linearGradient>
          </defs>
          <polyline
            points={pts}
            fill="none"
            stroke="url(#landing-demo-chart)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="landing-chart-draw"
          />
        </svg>
        <div className={`mt-1.5 grid grid-cols-2 gap-1 ${compact ? "gap-0.5" : ""}`}>
          {[
            { label: "Market Cap", value: stock.marketCap },
            { label: "P/E Ratio", value: stock.peRatio },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-md border border-[var(--pocket-border)] bg-[var(--pocket-card)] px-1.5 py-1"
            >
              <div className="flex items-center gap-0.5">
                <p className={`uppercase tracking-wide text-pocket-muted ${text}`}>
                  {m.label}
                </p>
                <span
                  className={`inline-flex h-2.5 w-2.5 items-center justify-center rounded-full border border-[#00C6C6]/35 bg-[#00C6C6]/12 text-[5px] font-semibold text-[#7EEAEA] ${
                    infoOpen && m.label === "P/E Ratio" ? "landing-info-pulse" : ""
                  }`}
                >
                  i
                </span>
              </div>
              <p className={`font-bold text-pocket-text ${compact ? "text-[7px]" : "text-[8px]"}`}>
                {m.value}
              </p>
            </div>
          ))}
        </div>
      </div>
      {infoOpen && (
        <div className="landing-info-sheet absolute inset-x-1 bottom-1 z-20 rounded-xl border border-[var(--pocket-border)] bg-pocket-bg p-2 shadow-xl">
          <p className={`font-bold text-pocket-text ${compact ? "text-[7px]" : "text-[8px]"}`}>
            P/E Ratio
          </p>
          <p className={`mt-0.5 leading-snug text-pocket-muted ${text}`}>
            Price-to-earnings — how many years of profit you&apos;re paying for at
            today&apos;s price.
          </p>
        </div>
      )}
    </div>
  );
}

export function LandingDemoBottomNav({
  active = "home",
  compact = false,
}: {
  active?: "home" | "markets" | "discover" | "watchlist" | "profile";
  compact?: boolean;
}) {
  const icon = compact ? "h-3 w-3" : "h-3.5 w-3.5";
  const label = compact ? "text-[5px]" : "text-[6px] sm:text-[7px]";
  const tabs = [
    { id: "home" as const, label: "Home", Icon: BarChart2 },
    { id: "markets" as const, label: "Markets", Icon: BarChart2 },
    { id: "watchlist" as const, label: "Saved", Icon: Bookmark },
    { id: "discover" as const, label: "Browse", Icon: Building2 },
    { id: "profile" as const, label: "Profile", Icon: null },
  ];

  return (
    <nav className="flex shrink-0 items-center justify-around border-t border-[var(--pocket-border)] bg-pocket-bg px-1 py-1.5">
      {tabs.map(({ id, label: tabLabel, Icon }) => {
        const isActive = active === id;
        return (
          <div
            key={id}
            className={`flex flex-col items-center gap-0.5 ${label} ${
              isActive ? "text-[#00C6C6] landing-nav-active" : "text-pocket-muted"
            }`}
          >
            {id === "profile" ? (
              <span className={compact ? "scale-75" : "scale-90"}>
                <ProfileNavIcon active={isActive} />
              </span>
            ) : Icon ? (
              <Icon className={icon} strokeWidth={2.25} />
            ) : null}
            <span className="font-medium">{tabLabel}</span>
          </div>
        );
      })}
    </nav>
  );
}

export function LandingGestureFinger({
  gesture,
  visible,
}: {
  gesture: "up" | "left" | "right" | "tap" | "scroll" | null;
  visible: boolean;
}) {
  if (!visible || !gesture) return null;

  const posClass =
    gesture === "up"
      ? "landing-finger-up"
      : gesture === "left"
        ? "landing-finger-left"
        : gesture === "right"
          ? "landing-finger-right"
          : gesture === "tap"
            ? "landing-finger-tap"
            : "landing-finger-scroll";

  return (
    <div
      className={`pointer-events-none absolute z-30 ${posClass}`}
      aria-hidden
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 shadow-lg ring-2 ring-[#00C6C6]/50 backdrop-blur-sm sm:h-8 sm:w-8">
        <div className="h-2.5 w-2.5 rounded-full bg-white shadow-inner" />
      </div>
    </div>
  );
}

/** Hook: respects reduced motion — returns slower/static mode */
export function useLandingMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}
