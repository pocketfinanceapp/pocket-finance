"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpenText,
  Building2,
  Flame,
  Hand,
  Sparkles,
} from "lucide-react";
import {
  isFeedOnboardingComplete,
  markFeedOnboardingComplete,
} from "@/lib/feedOnboarding";

const TIPS = [
  {
    icon: Hand,
    title: "Navigate the feed",
    body: "Swipe up for the next story. Left to read. Right for company details.",
  },
  {
    icon: Sparkles,
    title: "Pocket Briefing",
    body: "Open any article for a short AI summary — what happened, why it matters.",
  },
  {
    icon: Building2,
    title: "Browse & Markets",
    body: "Explore companies, markets, and crypto. Follow tickers into your watchlist.",
  },
  {
    icon: Flame,
    title: "Streak & achievements",
    body: "Read daily to keep your streak. Level up and unlock achievements on Profile.",
  },
] as const;

const EXIT_MS = 420;

export function FeedOnboardingOverlay() {
  const [open, setOpen] = useState(false);
  const [exiting, setExiting] = useState(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isFeedOnboardingComplete()) {
      setOpen(true);
    }
    return () => {
      if (exitTimer.current) clearTimeout(exitTimer.current);
    };
  }, []);

  const dismiss = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    exitTimer.current = setTimeout(() => {
      markFeedOnboardingComplete();
      setOpen(false);
      setExiting(false);
      exitTimer.current = null;
    }, EXIT_MS);
  }, [exiting]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-end justify-center bg-black/55 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-10 sm:items-center sm:pb-10 ${
        exiting ? "onboarding-backdrop-exit" : "onboarding-backdrop-enter"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="feed-tour-title"
    >
      <div
        className={`w-full max-w-[380px] overflow-hidden rounded-[28px] border border-[var(--pocket-border)] bg-pocket-bg shadow-[0_24px_80px_rgba(0,0,0,0.35)] ${
          exiting ? "onboarding-sheet-exit" : "onboarding-sheet-enter"
        }`}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div className="onboarding-enter onboarding-enter-d1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-pocket-teal">
              Quick tour
            </p>
            <h2
              id="feed-tour-title"
              className="mt-1 text-[22px] font-bold tracking-tight text-pocket-text"
            >
              How Pocket Finance works
            </h2>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="onboarding-enter onboarding-enter-d1 flex h-11 min-w-11 shrink-0 items-center justify-center rounded-full px-3 text-[13px] font-semibold text-pocket-muted active:opacity-70"
          >
            Skip
          </button>
        </div>

        <p className="onboarding-enter onboarding-enter-d2 mt-1.5 px-5 text-[13px] leading-relaxed text-pocket-muted">
          A few seconds so you get the best bits.
        </p>

        <ul className="mt-5 space-y-1 px-3 pb-2">
          {TIPS.map((tip, index) => {
            const Icon = tip.icon;
            return (
              <li
                key={tip.title}
                className="onboarding-stagger flex gap-3 rounded-2xl px-2.5 py-2.5"
                style={{ ["--ob-i" as string]: index }}
              >
                <span className="onboarding-soft-pulse mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#3B6EF5]/15 to-[#00C6C6]/15 text-pocket-teal">
                  <Icon className="h-4 w-4" strokeWidth={2.25} />
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-pocket-text">
                    {tip.title}
                  </p>
                  <p className="mt-0.5 text-[12.5px] leading-snug text-pocket-muted">
                    {tip.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="onboarding-enter onboarding-enter-d5 border-t border-[var(--pocket-border)] px-5 py-4">
          <button
            type="button"
            onClick={dismiss}
            className="onboarding-cta-glow w-full rounded-2xl bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] py-3.5 text-[15px] font-bold text-white active:scale-[0.98]"
          >
            Got it
          </button>
          <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-[11px] text-pocket-muted">
            <BookOpenText className="h-3 w-3" strokeWidth={2.25} />
            Shown once — you can explore anytime
          </p>
        </div>
      </div>
    </div>
  );
}
