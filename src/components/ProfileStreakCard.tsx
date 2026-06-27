"use client";

import { useId } from "react";
import { Check } from "lucide-react";
import { StreakHeroIcon } from "@/components/icons/StreakHeroIcon";
import { tabEnterStyle } from "@/lib/tabEnterAnimation";
import type { StreakState } from "@/lib/progression";

interface ProfileStreakCardProps {
  streak: StreakState;
  animateIn?: boolean;
}

export function ProfileStreakCard({
  streak,
  animateIn = true,
}: ProfileStreakCardProps) {
  const uid = useId();
  const { currentStreak, bestStreak, weeklyStrip, nextMilestone, goalCompletedToday } =
    streak;
  const isActive = currentStreak > 0;
  const milestoneProgress = isActive
    ? Math.min(100, Math.round((currentStreak / nextMilestone) * 100))
    : 0;
  const daysToMilestone = Math.max(0, nextMilestone - currentStreak);

  const statusLine = !isActive
    ? "Finish today's goal to light your first flame"
    : goalCompletedToday
      ? "You're set for today — come back tomorrow"
      : `Complete today's goal to keep your ${currentStreak}-day streak`;

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#14100a] via-[#0c0a08] to-[#080808]"
      style={tabEnterStyle(animateIn, 0)}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(circle, rgba(251,146,60,0.18) 0%, transparent 70%)",
        }}
      />

      <div className="relative px-4 pb-4 pt-4">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <StreakHeroIcon uid={uid} active={isActive || goalCompletedToday} size={52} />
            {isActive && (
              <span
                className="absolute -bottom-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[11px] font-bold tabular-nums text-white streak-badge-pop"
                style={{
                  background: "linear-gradient(135deg, #FB923C, #EA580C)",
                  boxShadow: "0 2px 8px rgba(234,88,12,0.45)",
                }}
              >
                {currentStreak}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-400/80">
              Daily streak
            </p>
            <p className="mt-0.5 text-[22px] font-bold leading-none text-white">
              {isActive ? (
                <>
                  {currentStreak}
                  <span className="ml-1.5 text-[15px] font-semibold text-zinc-400">
                    {currentStreak === 1 ? "day" : "days"}
                  </span>
                </>
              ) : (
                <span className="text-[18px] text-zinc-300">Start today</span>
              )}
            </p>
            <p className="mt-1.5 text-[12px] leading-snug text-zinc-500">{statusLine}</p>
          </div>
        </div>

        {isActive && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-[10px] text-zinc-500">
              <span>
                Next milestone: {nextMilestone} days
              </span>
              <span className="tabular-nums">
                {daysToMilestone === 0 ? "Reached!" : `${daysToMilestone} to go`}
              </span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700 ease-out"
                style={{ width: `${milestoneProgress}%` }}
              />
            </div>
            {bestStreak > currentStreak && (
              <p className="mt-1.5 text-[10px] text-zinc-600">
                Personal best: {bestStreak} days
              </p>
            )}
          </div>
        )}

        <div className="mt-4 flex justify-between gap-1">
          {weeklyStrip.map(({ day, completed, isToday }, index) => (
            <div
              key={day}
              className="flex flex-1 flex-col items-center gap-1.5"
              style={{
                animationDelay: animateIn ? `${180 + index * 50}ms` : undefined,
              }}
            >
              <div
                className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-500 ${
                  completed
                    ? "streak-day-complete bg-gradient-to-b from-amber-400 to-orange-500 text-black shadow-[0_0_12px_rgba(251,146,60,0.35)]"
                    : isToday
                      ? "border-2 border-amber-500/50 bg-white/[0.04]"
                      : "border border-white/[0.10] bg-white/[0.03]"
                }`}
              >
                {completed ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                ) : isToday ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400/80 streak-today-pulse" />
                ) : null}
              </div>
              <span
                className={`text-[9px] font-medium ${
                  isToday ? "text-amber-400/90" : "text-zinc-600"
                }`}
              >
                {day}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
