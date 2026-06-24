"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Lock } from "lucide-react";
import {
  ACHIEVEMENT_BADGES,
  getUnlockedBadgeIds,
  hasViewedStockPanel,
  loadSeenBadgeIds,
  markBadgeSeen,
  type AchievementStats,
} from "@/lib/achievements";

interface ProfileAchievementsProps {
  articlesRead: number;
  likedCount: number;
  streak: number;
}

export function ProfileAchievements({
  articlesRead,
  likedCount,
  streak,
}: ProfileAchievementsProps) {
  const [firstStockViewed, setFirstStockViewed] = useState(false);
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setFirstStockViewed(hasViewedStockPanel());
  }, []);

  const stats: AchievementStats = useMemo(
    () => ({ articlesRead, likedCount, streak, firstStockViewed }),
    [articlesRead, likedCount, streak, firstStockViewed]
  );

  const unlockedIds = useMemo(
    () => new Set(getUnlockedBadgeIds(stats)),
    [stats]
  );
  const unlockedCount = unlockedIds.size;

  useEffect(() => {
    const seen = loadSeenBadgeIds();
    const toAnimate = [...unlockedIds].filter((id) => !seen.has(id));
    if (toAnimate.length === 0) return;

    setAnimatingIds(new Set(toAnimate));

    const timer = window.setTimeout(() => {
      for (const id of toAnimate) markBadgeSeen(id);
      setAnimatingIds(new Set());
    }, 650);

    return () => window.clearTimeout(timer);
  }, [unlockedIds]);

  return (
    <section className="mt-5">
      {/* Section header with View all */}
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-white">Achievements</h3>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            {unlockedCount} of {ACHIEVEMENT_BADGES.length} unlocked
          </p>
        </div>
        <span className="text-[12px] font-semibold text-[#00C6C6]">
          View all
        </span>
      </div>

      {/* 2-column grid */}
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {ACHIEVEMENT_BADGES.map((badge) => {
          const unlocked = unlockedIds.has(badge.id);
          const animate = animatingIds.has(badge.id);

          return (
            <div
              key={badge.id}
              className={`relative overflow-hidden rounded-2xl p-4 ${
                animate ? "badge-unlock-animate" : ""
              }`}
              style={{
                minHeight: 120,
                backgroundColor: unlocked
                  ? "rgba(0,198,198,0.04)"
                  : "rgba(10,11,16,0.72)",
                border: unlocked
                  ? "1px solid rgba(255,255,255,0.08)"
                  : "1px solid rgba(255,255,255,0.05)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,.03)",
              }}
            >
              {/* Left accent line for unlocked */}
              {unlocked && (
                <div
                  className="absolute bottom-3 left-0 top-3 w-[2px] rounded-full"
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(0,198,198,0.7), rgba(0,198,198,0.2))",
                  }}
                />
              )}

              {/* Top row: icon tile + status badge */}
              <div className="flex items-start justify-between">
                {/* Icon tile */}
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-xl leading-none"
                  style={{
                    backgroundColor: unlocked
                      ? "rgba(0,198,198,0.10)"
                      : "rgba(255,255,255,0.05)",
                    border: unlocked
                      ? "1px solid rgba(0,198,198,0.15)"
                      : "1px solid rgba(255,255,255,0.06)",
                    opacity: unlocked ? 1 : 0.32,
                    filter: unlocked ? undefined : "grayscale(100%)",
                  }}
                >
                  {badge.emoji}
                </div>

                {/* Status badge */}
                {unlocked ? (
                  <div
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background:
                        "linear-gradient(135deg, #00c6c6 0%, #00919f 100%)",
                    }}
                  >
                    <Check className="h-[10px] w-[10px] text-white" strokeWidth={3} />
                  </div>
                ) : (
                  <div
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.10)",
                    }}
                  >
                    <Lock className="h-[9px] w-[9px] text-zinc-600" />
                  </div>
                )}
              </div>

              {/* Title + requirement */}
              <p
                className="mt-3 text-[13px] font-semibold leading-snug"
                style={{
                  color: unlocked
                    ? "rgba(255,255,255,0.95)"
                    : "rgba(255,255,255,0.38)",
                }}
              >
                {badge.name}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-zinc-600">
                {badge.progressHint}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
