"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownUp,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LANDING_BRIEFING, LANDING_FEED_ARTICLES } from "@/lib/landingDemoData";
import { LandingPhoneFrame } from "./LandingPhoneFrame";
import {
  LandingDemoArticlePanel,
  LandingDemoBusinessInfoPanel,
  LandingDemoFeedCard,
  LandingDemoFeedHeader,
  LandingGestureFinger,
  useLandingMotion,
} from "./LandingDemoUI";

const GESTURES: {
  icon: LucideIcon;
  gesture: string;
  label: string;
  hint: string;
  scene: "feed" | "article" | "company";
  finger: "up" | "left" | "right";
}[] = [
  {
    icon: ArrowDownUp,
    gesture: "Swipe up/down",
    label: "Headlines",
    hint: "Browse the feed",
    scene: "feed",
    finger: "up",
  },
  {
    icon: ArrowLeft,
    gesture: "Swipe left",
    label: "Full article",
    hint: "Read the story",
    scene: "article",
    finger: "left",
  },
  {
    icon: ArrowRight,
    gesture: "Swipe right",
    label: "Company info",
    hint: "Who owns it, HQ & industry",
    scene: "company",
    finger: "right",
  },
];

export function SwipeGestureSection() {
  const reduced = useLandingMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const active = GESTURES[activeIndex];

  useEffect(() => {
    const ms = reduced ? 5000 : 3200;
    const t = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % GESTURES.length);
    }, ms);
    return () => window.clearInterval(t);
  }, [reduced]);

  return (
    <section className="relative px-5 py-8 sm:px-8 sm:py-14">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(0,198,198,0.06) 0%, transparent 65%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[#00C6C6]/80">
          How Pocket Finance works
        </p>
        <h2 className="mt-2 text-center text-xl font-bold tracking-tight text-white sm:text-2xl">
          Three gestures. The whole market.
        </h2>

        <div className="mt-6 flex flex-col items-center gap-6 md:mt-10 md:flex-row md:items-center md:justify-center md:gap-10">
          <div
            className="relative shrink-0"
            style={{
              filter:
                "drop-shadow(0 0 40px rgba(0,198,198,0.15)) drop-shadow(0 20px 40px rgba(0,0,0,0.45))",
            }}
          >
            <LandingPhoneFrame compact className="!h-[300px] !w-[150px] sm:!h-[360px] sm:!w-[180px]">
              <LandingDemoFeedHeader activeTab="forYou" compact />
              <div className="relative min-h-0 flex-1 overflow-hidden">
                <div
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    active.scene === "feed" ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <LandingDemoFeedCard
                    article={LANDING_FEED_ARTICLES[0]}
                    compact
                  />
                </div>
                <div
                  className={`absolute inset-0 transition-all duration-500 ${
                    active.scene === "article"
                      ? "translate-x-0 opacity-100"
                      : "-translate-x-full opacity-0"
                  }`}
                >
                  <LandingDemoArticlePanel
                    article={LANDING_FEED_ARTICLES[0]}
                    briefing={LANDING_BRIEFING}
                    briefingVisible={active.scene === "article"}
                    compact
                  />
                </div>
                <div
                  className={`absolute inset-0 transition-all duration-500 ${
                    active.scene === "company"
                      ? "translate-x-0 opacity-100"
                      : "-translate-x-full opacity-0"
                  }`}
                >
                  <LandingDemoBusinessInfoPanel compact />
                </div>
                <LandingGestureFinger
                  gesture={active.finger}
                  visible={!reduced}
                />
              </div>
            </LandingPhoneFrame>
          </div>

          <div className="flex w-full max-w-md flex-col gap-2.5 md:max-w-sm">
            {GESTURES.map((g, i) => {
              const Icon = g.icon;
              const isActive = i === activeIndex;
              return (
                <div
                  key={g.label}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 backdrop-blur-sm transition-all duration-500 ${
                    isActive
                      ? "border-[#00C6C6]/40 bg-white/[0.07] shadow-[0_0_24px_rgba(0,198,198,0.12)]"
                      : "border-[#00C6C6]/15 bg-white/[0.03]"
                  }`}
                  style={{
                    boxShadow: isActive
                      ? "inset 0 1px 0 rgba(255,255,255,0.08), 0 0 24px rgba(0,198,198,0.12)"
                      : "inset 0 1px 0 rgba(255,255,255,0.04)",
                  }}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors duration-500 ${
                      isActive
                        ? "border-[#00C6C6]/40 bg-[#00C6C6]/15"
                        : "border-[#00C6C6]/25 bg-[#00C6C6]/10"
                    }`}
                  >
                    <Icon className="h-4 w-4 text-[#00C6C6]" strokeWidth={2.25} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-[#00C6C6]/90">
                      {g.gesture}
                    </p>
                    <p className="text-sm font-semibold text-white">{g.label}</p>
                    <p className="text-[10px] text-[#9ca3af]">{g.hint}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
