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
  /** Limit visible achievements (for preview mode). Default: show all */
  maxItems?: number;
  /** When provided, renders "View all" as a tappable button */
  onViewAll?: () => void;
}

export function ProfileAchievements({
  articlesRead,
  likedCount,
  streak,
  maxItems,
  onViewAll,
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

  const displayBadges = maxItems
    ? ACHIEVEMENT_BADGES.slice(0, maxItems)
    : ACHIEVEMENT_BADGES;

  const hasMore = maxItems !== undefined && ACHIEVEMENT_BADGES.length > maxItems;

  return (
    <section>
      {/* Section header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-white">Achievements</h3>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            {unlockedCount} of {ACHIEVEMENT_BADGES.length} unlocked
          </p>
        </div>
        {onViewAll && (
          <button
            type="button"
            data-no-drag
            onClick={onViewAll}
            className="text-[12px] font-semibold text-[#00C6C6] active:opacity-60"
          >
            View all
          </button>
        )}
      </div>

      {/* 2-column grid */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {displayBadges.map((badge) => {
          const unlocked = unlockedIds.has(badge.id);
          const animate = animatingIds.has(badge.id);

          return (
            <div
              key={badge.id}
              className={`relative overflow-hidden rounded-2xl p-3 ${
                animate ? "badge-unlock-animate" : ""
              }`}
              style={{
                minHeight: 96,
                backgroundColor: unlocked
                  ? "rgba(0,198,198,0.025)"
                  : "rgba(10,11,16,0.72)",
                border: unlocked
                  ? "1px solid rgba(255,255,255,0.08)"
                  : "1px solid rgba(255,255,255,0.05)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,.03)",
              }}
            >
              {/* Left accent line — unlocked only */}
              {unlocked && (
                <div
                  className="absolute bottom-2 left-0 top-2 w-[2px] rounded-full"
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(0,198,198,0.60), rgba(0,198,198,0.12))",
                  }}
                />
              )}

              {/* Top row: icon tile + status badge */}
              <div className="flex items-start justify-between">
                {/* Neutral dark tile — no cyan tint for unlocked */}
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-lg leading-none"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    opacity: unlocked ? 1 : 0.28,
                    filter: unlocked ? undefined : "grayscale(100%)",
                  }}
                >
                  {badge.emoji}
                </div>

                {unlocked ? (
                  <div
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background:
                        "linear-gradient(135deg, #009faa 0%, #007080 100%)",
                    }}
                  >
                    <Check
                      className="h-[10px] w-[10px] text-white"
                      strokeWidth={3}
                    />
                  </div>
                ) : (
                  <div
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.09)",
                    }}
                  >
                    <Lock className="h-[9px] w-[9px] text-zinc-600" />
                  </div>
                )}
              </div>

              {/* Title + requirement */}
              <p
                className="mt-2 text-[12px] font-semibold leading-snug"
                style={{
                  color: unlocked
                    ? "rgba(255,255,255,0.92)"
                    : "rgba(255,255,255,0.33)",
                }}
              >
                {badge.name}
              </p>
              <p className="mt-0.5 text-[10px] leading-snug text-zinc-600">
                {badge.progressHint}
              </p>
            </div>
          );
        })}
      </div>

      {/* No pagination dots — "View all" opens a separate page */}
    </section>
  );
}
