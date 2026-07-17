"use client";

import { useEffect, useState } from "react";
import {
  LANDING_BRIEFING,
  LANDING_EXPLORE,
  LANDING_FEED_ARTICLES,
} from "@/lib/landingDemoData";
import { CompanyLogo } from "@/components/CompanyLogo";
import { SentimentBadge } from "@/components/SentimentBadge";
import {
  LandingDemoArticlePanel,
  LandingDemoBusinessInfoPanel,
  LandingDemoFeedCard,
  LandingDemoFeedHeader,
  useLandingMotion,
} from "./LandingDemoUI";

const SENTIMENT_SCORES = { bullish: 0.42, neutral: 0, bearish: -0.42 } as const;

function useLoop(length: number, intervalMs: number) {
  const reduced = useLandingMotion();
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const ms = reduced ? intervalMs * 2 : intervalMs;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % length);
    }, ms);
    return () => window.clearInterval(t);
  }, [length, intervalMs, reduced]);
  return index;
}

export function FeedFeatureDemo() {
  const step = useLoop(4, 2800);
  const activeTab = step >= 2 ? "trending" : "forYou";
  const cardIndex = step % 2;

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-pocket-bg">
      <LandingDemoFeedHeader activeTab={activeTab} compact />
      <div className="relative h-[140px] overflow-hidden sm:h-[160px]">
        <div
          className="h-[200%] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateY(-${cardIndex * 50}%)` }}
        >
          {LANDING_FEED_ARTICLES.slice(0, 2).map((a) => (
            <div key={a.id} className="h-1/2">
              <LandingDemoFeedCard article={a} compact />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ArticleFeatureDemo() {
  const step = useLoop(3, 3200);
  const scrollOffset = step >= 1 ? 28 : 0;
  const briefingVisible = step >= 2;

  return (
    <div className="h-[160px] overflow-hidden rounded-xl border border-white/[0.06] bg-pocket-bg sm:h-[180px]">
      <LandingDemoArticlePanel
        article={LANDING_FEED_ARTICLES[0]}
        briefing={LANDING_BRIEFING}
        briefingVisible={briefingVisible}
        scrollOffset={scrollOffset}
        compact
      />
    </div>
  );
}

export function CompanyFeatureDemo() {
  const step = useLoop(3, 3000);
  const following = step >= 2;

  return (
    <div className="relative h-[160px] overflow-hidden rounded-xl border border-white/[0.06] bg-pocket-bg sm:h-[180px]">
      <LandingDemoBusinessInfoPanel following={following} compact />
    </div>
  );
}

export function ExploreFeatureDemo() {
  const step = useLoop(4, 2800);
  const tabIndex = step % 2;
  const tab = LANDING_EXPLORE.tabs[tabIndex];

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-pocket-bg">
      <div className="flex gap-2 border-b border-[var(--pocket-border)] px-2 py-1.5 text-[8px] font-semibold">
        {LANDING_EXPLORE.tabs.map((t, i) => (
          <span
            key={t}
            className={`transition-colors duration-500 ${
              i === tabIndex ? "text-pocket-text" : "text-pocket-muted/45"
            }`}
          >
            {t}
            {i === tabIndex && (
              <span className="mt-0.5 block h-px w-full rounded-full bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6]" />
            )}
          </span>
        ))}
      </div>
      <div className="relative h-[120px] overflow-hidden sm:h-[130px]">
        {tab === "Trending" ? (
          <ul className="space-y-1 p-1.5">
            {LANDING_EXPLORE.trending.map((row) => (
              <li
                key={row.ticker}
                className="flex items-center gap-2 rounded-lg border border-[var(--pocket-border)] bg-[var(--pocket-card)] px-2 py-1.5"
              >
                <CompanyLogo ticker={row.ticker} color={row.color} size={22} />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-semibold text-pocket-text">
                    {row.ticker}
                  </p>
                  <p className="truncate text-[7px] text-pocket-muted">
                    {row.name}
                  </p>
                </div>
                <SentimentBadge
                  score={SENTIMENT_SCORES[row.sentiment]}
                  size="xs"
                  className="!px-1.5 !py-0.5 !text-[6px]"
                />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="space-y-1 p-1.5">
            {LANDING_EXPLORE.regions.map((region) => (
              <li
                key={region.code}
                className="flex items-center gap-2 rounded-lg border border-[var(--pocket-border)] bg-[var(--pocket-card)] px-2 py-1.5"
              >
                <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[#00C6C6]/12 text-[9px] font-bold text-[#00C6C6]">
                  {region.code.toUpperCase().slice(0, 2)}
                </span>
                <p className="truncate text-[9px] font-semibold text-pocket-text">
                  {region.name}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function ProgressFeatureDemo() {
  const step = useLoop(4, 2600);
  const progress = [0, 20, 40, 40][step];
  const streakPulse = step === 3;

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-pocket-bg p-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-bold text-pocket-text">News Regular</p>
        <span className="rounded-md bg-[#3B6EF5]/15 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wide text-[#7BA3FF]">
          Reading
        </span>
      </div>
      <p className="mt-1.5 text-[9px] font-semibold tabular-nums text-[#00C6C6]">
        {Math.round(progress / 10)}/10 articles read
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--pocket-surface-hover)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div
        className={`mt-2.5 flex items-center gap-2 rounded-lg border border-[var(--pocket-border)] bg-[var(--pocket-card)] px-2 py-1.5 ${
          streakPulse ? "landing-streak-pulse" : ""
        }`}
      >
        <span className="text-[12px]" aria-hidden>
          🔥
        </span>
        <div>
          <p className="text-[8px] font-semibold text-pocket-text">5-day streak</p>
          <p className="text-[7px] text-pocket-muted">Keep reading today</p>
        </div>
      </div>
    </div>
  );
}

/** @deprecated use named exports — kept for LandingPage map */
export const FeedCardPreview = FeedFeatureDemo;
export const ArticleCardPreview = ArticleFeatureDemo;
export const CompanyCardPreview = CompanyFeatureDemo;
export const ExploreCardPreview = ExploreFeatureDemo;
export const ProgressCardPreview = ProgressFeatureDemo;
