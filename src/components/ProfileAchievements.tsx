"use client";

import { useEffect, useMemo, useState } from "react";
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
    () => ({
      articlesRead,
      likedCount,
      streak,
      firstStockViewed,
    }),
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
      for (const id of toAnimate) {
        markBadgeSeen(id);
      }
      setAnimatingIds(new Set());
    }, 650);

    return () => window.clearTimeout(timer);
  }, [unlockedIds]);

  return (
    <section className="mt-6">
      <h3 className="text-sm font-semibold text-white">Achievements</h3>
      <p className="mt-1 text-xs text-[#9ca3af]">
        {unlockedCount} of {ACHIEVEMENT_BADGES.length} unlocked
      </p>

      <div className="mt-3 grid grid-cols-2 items-start gap-2.5">
        {ACHIEVEMENT_BADGES.map((badge) => {
          const unlocked = unlockedIds.has(badge.id);
          const animate = animatingIds.has(badge.id);

          return (
            <div
              key={badge.id}
              className={`relative rounded-2xl px-4 py-5 ${
                animate ? "badge-unlock-animate" : ""
              }`}
              style={{
                backgroundColor: unlocked
                  ? "rgba(0,198,198,0.06)"
                  : "rgba(255,255,255,0.04)",
                border: unlocked
                  ? "1px solid rgba(0,198,198,0.35)"
                  : "1px solid rgba(255,255,255,0.07)",
                boxShadow: unlocked
                  ? "0 0 16px rgba(0,198,198,0.10)"
                  : undefined,
              }}
            >
              {unlocked && (
                <span
                  className="absolute right-3 top-3 text-[11px] font-bold text-[#00C6C6]"
                  aria-hidden
                >
                  ✓
                </span>
              )}

              <div className="relative mb-3 flex items-center">
                <span
                  className="text-[34px] leading-none"
                  style={
                    unlocked
                      ? undefined
                      : { opacity: 0.22, filter: "grayscale(100%)" }
                  }
                >
                  {badge.emoji}
                </span>
                {!unlocked && (
                  <span
                    className="absolute -bottom-0.5 left-5 text-[11px] leading-none"
                    style={{ opacity: 0.35 }}
                    aria-hidden
                  >
                    🔒
                  </span>
                )}
              </div>

              <p
                className="text-[13px] font-semibold leading-snug text-white"
                style={{ opacity: unlocked ? 1 : 0.45 }}
              >
                {badge.name}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-zinc-500">
                {badge.progressHint}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
