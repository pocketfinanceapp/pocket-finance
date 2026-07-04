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
        <div className="flex items-start gap-4">
          <div className="relative shrink-0 pf-streak-hero-enter">
            <StreakHeroIcon
              uid={uid}
              active={streakActive || loginStreak.visitedToday}
              size={64}
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

          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <p className="text-[36px] font-black leading-none tabular-nums tracking-tight text-pocket-text pf-streak-number-enter">
                {streakActive ? loginStreak.currentStreak : 0}
              </p>
              <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-[#FB923C]">
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

        <div className="mt-5 flex w-full justify-between gap-1.5">
          {loginStreak.weeklyStrip.map(({ day, completed, isToday }, index) => (
            <div key={day} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold transition-all ${
                  completed
                    ? "bg-gradient-to-b from-amber-400 to-orange-500 text-black shadow-[0_0_10px_rgba(251,146,60,0.3)]"
                    : isToday
                      ? "border-2 border-amber-500/60 bg-[var(--pocket-surface-hover)] text-amber-500"
                      : "border border-[var(--pocket-border)] bg-[var(--pocket-card)] text-pocket-muted"
                }`}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                {completed ? "✓" : isToday ? "•" : ""}
              </div>
              <span
                className={`text-[9px] font-semibold ${
                  isToday ? "text-amber-500" : "text-pocket-muted"
                }`}
              >
                {day}
              </span>
            </div>
          ))}
        </div>

        <div className="my-5 border-t border-[var(--pocket-border)]" />

        <div className="flex items-start gap-4">
          <div className="pf-level-badge-enter relative flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#7C6CF8] via-[#5B8EF0] to-[#00C6C6] shadow-[0_6px_22px_rgba(91,142,240,0.3)]">
            <span className="text-[28px] font-black tabular-nums text-white">
              {progression.level}
            </span>
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8BA8FF]">
              {progression.title}
            </p>
            <p className="mt-0.5 text-[26px] font-black leading-none tracking-tight text-pocket-text">
              Level {progression.level}
            </p>

            {!isMaxLevel ? (
              <div className="mt-3">
                <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-semibold text-pocket-muted">
                  <span>Progress to Level {progression.level + 1}</span>
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
            ) : (
              <p className="mt-2 text-[12px] font-semibold tabular-nums text-pocket-muted">
                {totalXP.toLocaleString()} lifetime XP · Max level
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
