"use client";

import { useMemo } from "react";
import { Check, ChevronRight, Lock } from "lucide-react";
import { AchievementIcon } from "@/components/icons/AchievementIcon";
import { getAchievements, type Achievement } from "@/lib/progression";

interface ProfileAchievementsProps {
  likedArticlesCount?: number;
  maxItems?: number;
  onViewAll?: () => void;
}

function sortAchievements(list: Achievement[]): Achievement[] {
  return [...list].sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
    return a.required - b.required;
  });
}

export function ProfileAchievements({
  likedArticlesCount = 0,
  maxItems,
  onViewAll,
}: ProfileAchievementsProps) {
  const allAchievements = useMemo(
    () => getAchievements({ likedArticlesCount }),
    [likedArticlesCount]
  );

  const unlockedCount = allAchievements.filter((a) => a.unlocked).length;
  const displayAchievements = useMemo(() => {
    const sorted = sortAchievements(allAchievements);
    if (maxItems) {
      const unlocked = sorted.filter((a) => a.unlocked).slice(0, maxItems);
      if (unlocked.length >= maxItems) return unlocked;
      const locked = sorted.filter((a) => !a.unlocked);
      return [...unlocked, ...locked].slice(0, maxItems);
    }
    return sorted;
  }, [allAchievements, maxItems]);

  const isPreview = Boolean(maxItems);

  return (
    <section
      className={
        isPreview
          ? "pf-card-surface overflow-hidden rounded-2xl px-4 py-4"
          : "space-y-3"
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-[17px] font-bold tracking-tight text-pocket-text">
            Achievements
          </h3>
          <p className="mt-0.5 text-[12px] text-pocket-muted">
            {unlockedCount} unlocked
          </p>
        </div>
        {onViewAll && (
          <button
            type="button"
            data-no-drag
            onClick={onViewAll}
            className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-pocket-teal active:opacity-60"
          >
            View all
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        )}
      </div>

      <div className={`${isPreview ? "mt-3" : "mt-1"} space-y-1.5`}>
        {displayAchievements.map((achievement) => (
          <AchievementRow key={achievement.id} achievement={achievement} compact={isPreview} />
        ))}
      </div>
    </section>
  );
}

function AchievementRow({
  achievement,
  compact = false,
}: {
  achievement: Achievement;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border border-[var(--pocket-border)] bg-[var(--pocket-card)] ${
        compact ? "px-3 py-2.5" : "px-3.5 py-3"
      }`}
    >
      <div
        className={`flex shrink-0 items-center justify-center rounded-lg border ${
          achievement.unlocked
            ? "h-9 w-9 border-pocket-teal/20 text-pocket-teal"
            : "h-9 w-9 border-[var(--pocket-border)] text-pocket-muted"
        }`}
      >
        <AchievementIcon
          id={achievement.id}
          size={16}
          unlocked={achievement.unlocked}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-[13px] font-semibold ${
            achievement.unlocked ? "text-pocket-text" : "text-pocket-muted"
          }`}
        >
          {achievement.title}
        </p>
        {!compact && (
          <p className="mt-0.5 line-clamp-1 text-[11px] text-pocket-muted">
            {achievement.howToUnlock}
          </p>
        )}
      </div>

      {achievement.unlocked ? (
        <Check className="h-4 w-4 shrink-0 text-pocket-teal" strokeWidth={2.5} />
      ) : (
        <Lock className="h-3.5 w-3.5 shrink-0 text-pocket-muted/50" strokeWidth={2} />
      )}
    </div>
  );
}
