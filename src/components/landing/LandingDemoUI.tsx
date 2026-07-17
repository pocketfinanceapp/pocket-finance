"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  Building2,
  Calendar,
  Check,
  Compass,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  Plus,
  Share2,
} from "lucide-react";
import type { NewsArticle } from "@/lib/types";
import type { PocketBriefing } from "@/lib/briefing";
import { FeedCardFallbackBackground } from "@/components/FeedCardFallbackBackground";
import { CompanyLogo } from "@/components/CompanyLogo";
import { ProfileNavIcon } from "@/components/icons/ProfileNavIcon";
import { SentimentBadge } from "@/components/SentimentBadge";
import { LANDING_COMPANY } from "@/lib/landingDemoData";

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
        <SentimentBadge score={0.42} size="xs" className="!px-1.5 !py-0.5 !text-[6px] sm:!text-[7px]" />
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

/**
 * Demo of the swipe-right "About this company" panel — editorial facts
 * (founded, headquarters, industry) sourced from Wikidata/Wikipedia, not a
 * stock or price panel. `following` animates the Follow button for the
 * looping demo.
 */
export function LandingDemoBusinessInfoPanel({
  following = false,
  compact = false,
}: {
  following?: boolean;
  compact?: boolean;
}) {
  const company = LANDING_COMPANY;
  const text = compact ? "text-[6px]" : "text-[7px] sm:text-[8px]";
  const facts = [
    { icon: Calendar, label: "Founded", value: company.founded },
    { icon: MapPin, label: "Headquarters", value: company.headquarters },
    { icon: Building2, label: "Industry", value: company.industry },
  ];

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-pocket-bg">
      <header className="flex shrink-0 items-center gap-2 border-b border-[var(--pocket-border)] px-2 py-1.5">
        <ArrowLeft className={compact ? "h-3 w-3" : "h-4 w-4"} />
        <p className={`font-semibold uppercase tracking-wide text-pocket-muted ${text}`}>
          About this company
        </p>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden px-2 py-2">
        <div className="flex items-center gap-1.5">
          <CompanyLogo ticker={company.ticker} color={company.color} size={compact ? 20 : 24} />
          <div className="min-w-0 flex-1">
            <p className={`font-bold text-pocket-text ${compact ? "text-[8px]" : "text-[10px]"}`}>
              {company.companyName}
            </p>
            <p className={`truncate text-pocket-muted ${text}`}>{company.ticker}</p>
          </div>
          <span
            className={`flex shrink-0 items-center gap-0.5 rounded-full border px-1.5 py-0.5 font-bold ${text} ${
              following
                ? "border-[#00C6C6]/35 bg-[#00C6C6]/14 text-[#00C6C6] landing-info-pulse"
                : "border-[var(--pocket-border)] text-pocket-text"
            }`}
          >
            {following ? (
              <Check className="h-2 w-2" strokeWidth={2.5} />
            ) : (
              <Plus className="h-2 w-2" strokeWidth={2.5} />
            )}
            {following ? "Following" : "Follow"}
          </span>
        </div>
        <p className={`mt-1.5 leading-relaxed text-pocket-text ${text}`}>
          {company.description}
        </p>
        <div className="mt-1.5 divide-y divide-[var(--pocket-border)] overflow-hidden rounded-lg border border-[var(--pocket-border)] bg-[var(--pocket-card)]">
          {facts.map((fact) => (
            <div key={fact.label} className="flex items-center gap-1.5 px-1.5 py-1">
              <fact.icon className="h-2.5 w-2.5 shrink-0 text-pocket-muted" />
              <div className="min-w-0 flex-1">
                <p className={`uppercase tracking-wide text-pocket-muted ${text}`}>
                  {fact.label}
                </p>
                <p className={`truncate font-semibold text-pocket-text ${compact ? "text-[7px]" : "text-[8px]"}`}>
                  {fact.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LandingDemoBottomNav({
  active = "home",
  compact = false,
}: {
  active?: "home" | "explore" | "saved" | "profile";
  compact?: boolean;
}) {
  const icon = compact ? "h-3 w-3" : "h-3.5 w-3.5";
  const label = compact ? "text-[5px]" : "text-[6px] sm:text-[7px]";
  const tabs = [
    { id: "home" as const, label: "Home", Icon: Home },
    { id: "explore" as const, label: "Explore", Icon: Compass },
    { id: "saved" as const, label: "Saved", Icon: Bookmark },
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
