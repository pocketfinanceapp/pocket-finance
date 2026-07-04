"use client";

import { useEffect, useId, useState } from "react";
import { StreakHeroIcon } from "@/components/icons/StreakHeroIcon";
import { getLoginStreakState } from "@/lib/profileStorage";
import { tabEnterStyle } from "@/lib/tabEnterAnimation";
import type { LevelState } from "@/lib/progression";

interface ProfileProgressTabsProps {
  progression: LevelState;
  totalXP: number;
  animateIn?: boolean;
}

const CARD = "pf-card-surface overflow-hidden rounded-2xl";

export function ProfileProgressTabs({
  progression,
  totalXP,
  animateIn = true,
}: ProfileProgressTabsProps) {
  const uid = useId();
  const [loginStreak, setLoginStreak] = useState(() => getLoginStreakState());

  useEffect(() => {
    const sync = () => setLoginStreak(getLoginStreakState());
    sync();
    window.addEventListener("pf-progression-updated", sync);
    return () => window.removeEventListener("pf-progression-updated", sync);
  }, []);

  const isMaxLevel = progression.level === 7;
  const xpToNext = progression.nextLevelXP - progression.currentLevelXP;
  const streakActive = loginStreak.currentStreak > 0;

  return (
    <section className={CARD} style={tabEnterStyle(animateIn, 80)}>
      <div className="px-5 py-5">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-pocket-muted">
          Streak
        </p>
        <div className="flex items-start gap-4">
          <div className="relative shrink-0 pf-streak-hero-enter">
            <StreakHeroIcon
              uid={uid}
              active={streakActive || loginStreak.visitedToday}
              size={60}
              className="drop-shadow-[0_6px_20px_rgba(251,146,60,0.22)]"
            />
            {streakActive && (
              <span
                className="absolute -bottom-0.5 -right-1 flex h-7 min-w-7 items-center justify-center rounded-xl px-1.5 text-[14px] font-black tabular-nums text-white streak-badge-pop"
                style={{
                  background: "linear-gradient(135deg, #FB923C, #EA580C)",
                  boxShadow: "0 3px 12px rgba(234,88,12,0.4)",
                }}
              >
                {loginStreak.currentStreak}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 pt-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <p className="text-[34px] font-black leading-none tabular-nums tracking-tight text-pocket-text pf-streak-number-enter">
                {streakActive ? loginStreak.currentStreak : 0}
              </p>
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#FB923C]">
                day streak
              </p>
            </div>
            <p className="mt-2 text-[13px] font-medium leading-relaxed text-pocket-muted">
              {loginStreak.visitedToday
                ? streakActive
                  ? "You're on fire — come back tomorrow to keep it going."
                  : "Welcome back. You're building a new streak."
                : "Open Pocket Finance today to start your streak."}
            </p>
            {loginStreak.bestStreak > loginStreak.currentStreak && (
              <p className="mt-1.5 text-[11px] font-semibold text-pocket-muted">
                Personal best: {loginStreak.bestStreak} days
              </p>
            )}
          </div>
        </div>

        <div className="my-5 border-t border-[var(--pocket-border)]" />

        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-pocket-muted">
          Level
        </p>
        <div className="flex items-center gap-4">
          <div className="pf-level-badge-enter relative flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br from-[#7C6CF8] via-[#5B8EF0] to-[#00C6C6] shadow-[0_6px_22px_rgba(91,142,240,0.28)]">
            <span className="text-[26px] font-black tabular-nums text-white">
              {progression.level}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold leading-tight text-pocket-text">
              {progression.title}
            </p>
            <p className="mt-1 text-[12px] font-medium text-pocket-muted">
              {isMaxLevel
                ? `${totalXP.toLocaleString()} lifetime XP · Max level`
                : `Level ${progression.level} of 7`}
            </p>
          </div>
        </div>

        {!isMaxLevel && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between gap-3 text-[11px] font-semibold">
              <span className="text-pocket-muted">
                Progress to Level {progression.level + 1}
              </span>
              <span className="shrink-0 tabular-nums text-pocket-text">
                {progression.progressXP.toLocaleString()} /{" "}
                {xpToNext.toLocaleString()} XP
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[var(--pocket-surface-hover)]">
              <div
                className="pf-level-bar-fill h-full rounded-full bg-gradient-to-r from-[#7C6CF8] via-[#5B8EF0] to-[#00C6C6] transition-all duration-700"
                style={{ width: `${progression.progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
