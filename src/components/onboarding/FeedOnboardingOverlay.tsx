"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, BookOpen, TrendingUp, type LucideIcon } from "lucide-react";
import {
  isFeedOnboardingComplete,
  markFeedOnboardingComplete,
} from "@/lib/feedOnboarding";

const SLIDES: {
  icon: LucideIcon;
  headline: string;
  description: string;
}[] = [
  {
    icon: ArrowUp,
    headline: "Swipe up & down",
    description: "Browse through the latest market headlines",
  },
  {
    icon: BookOpen,
    headline: "Swipe left to read",
    description: "Open the full article from any headline",
  },
  {
    icon: TrendingUp,
    headline: "Swipe right for stocks",
    description: "See live prices, charts and stock intelligence",
  },
];

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

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 px-5 text-white"
      role="dialog"
      aria-modal="true"
      aria-label="How to use Pocket Finance"
    >
      <div
        className="w-full max-w-[340px] overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${slide * 100}%)` }}
        >
          {SLIDES.map((item, index) => {
            const Icon = item.icon;
            const isLastSlide = index === SLIDES.length - 1;
            const isActive = index === slide;

            return (
              <div key={item.headline} className="w-full shrink-0 px-0.5">
                <div
                  className={`relative rounded-2xl border border-[#1f2937] bg-[#111] px-6 pb-6 pt-5 ${
                    isActive ? "feed-onboard-card-active" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={dismiss}
                    className="absolute right-4 top-4 text-xs font-medium text-[#9ca3af] transition-colors hover:text-white"
                  >
                    Skip
                  </button>

                  <div className="flex flex-col items-center px-2 pt-6 text-center">
                    <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] shadow-[0_8px_24px_rgba(59,110,245,0.35)]">
                      <Icon className="h-7 w-7 text-white" strokeWidth={2.25} />
                    </div>

                    <h2 className="mt-6 text-[24px] font-bold leading-tight text-white">
                      {item.headline}
                    </h2>
                    <p className="mt-3 max-w-[280px] text-[15px] leading-relaxed text-[#9ca3af]">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-8 flex items-center justify-center gap-2">
                    {SLIDES.map((dot, dotIndex) => (
                      <span
                        key={dot.headline}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          dotIndex === slide
                            ? "w-6 bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6]"
                            : "w-2 bg-[#4b5563]"
                        }`}
                        aria-hidden
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={isActive ? goNext : undefined}
                    tabIndex={isActive ? 0 : -1}
                    className="mt-6 w-full rounded-full bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] py-4 text-[15px] font-bold text-white shadow-[0_8px_32px_rgba(59,110,245,0.35)] transition-transform active:scale-[0.98]"
                  >
                    {isLastSlide ? "Get Started" : "Next"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
