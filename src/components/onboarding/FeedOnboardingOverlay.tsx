"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  isFeedOnboardingComplete,
  markFeedOnboardingComplete,
} from "@/lib/feedOnboarding";

const SLIDES = [
  {
    icon: "👆",
    headline: "Swipe up & down",
    description: "Browse through the latest market headlines",
  },
  {
    icon: "👈",
    headline: "Swipe left to read",
    description: "Open the full article from any headline",
  },
  {
    icon: "👉",
    headline: "Swipe right for stocks",
    description: "See live prices, charts and stock intelligence",
  },
] as const;

const SWIPE_THRESHOLD_PX = 48;

export function FeedOnboardingOverlay() {
  const [open, setOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const touchStartX = useRef(0);

  useEffect(() => {
    if (!isFeedOnboardingComplete()) {
      setOpen(true);
    }
  }, []);

  const dismiss = useCallback(() => {
    markFeedOnboardingComplete();
    setOpen(false);
  }, []);

  const goNext = useCallback(() => {
    if (slide < SLIDES.length - 1) {
      setSlide((s) => s + 1);
      return;
    }
    dismiss();
  }, [dismiss, slide]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? 0;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0]?.clientX ?? 0;
    const delta = endX - touchStartX.current;
    if (delta < -SWIPE_THRESHOLD_PX && slide < SLIDES.length - 1) {
      setSlide((s) => s + 1);
    } else if (delta > SWIPE_THRESHOLD_PX && slide > 0) {
      setSlide((s) => s - 1);
    }
  };

  if (!open) return null;

  const isLastSlide = slide === SLIDES.length - 1;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-black/90 text-white"
      role="dialog"
      aria-modal="true"
      aria-label="How to use Pocket Finance"
    >
      <div className="flex shrink-0 justify-end px-5 pt-[max(1rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
        >
          Skip
        </button>
      </div>

      <div
        className="relative min-h-0 flex-1 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${slide * 100}%)` }}
        >
          {SLIDES.map((item) => (
            <div
              key={item.headline}
              className="flex h-full w-full shrink-0 flex-col items-center justify-center px-8 text-center"
            >
              <span className="text-7xl leading-none" aria-hidden>
                {item.icon}
              </span>
              <h2 className="mt-8 text-2xl font-bold tracking-tight">
                {item.headline}
              </h2>
              <p className="mt-3 max-w-xs text-base leading-relaxed text-[#9ca3af]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-center gap-6 px-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2">
          {SLIDES.map((item, index) => (
            <span
              key={item.headline}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === slide
                  ? "w-6 bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6]"
                  : "w-2 bg-white/25"
              }`}
              aria-hidden
            />
          ))}
        </div>

        <button
          type="button"
          onClick={goNext}
          className="w-full max-w-sm rounded-xl bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] px-8 py-4 text-[15px] font-bold text-white shadow-[0_8px_32px_rgba(59,110,245,0.35)] transition-transform active:scale-[0.98]"
        >
          {isLastSlide ? "Get Started" : "Next"}
        </button>
      </div>
    </div>
  );
}
