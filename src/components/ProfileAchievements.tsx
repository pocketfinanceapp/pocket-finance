"use client";

import { useMemo } from "react";
import { Check, ChevronRight, Lock } from "lucide-react";
import { AchievementIcon } from "@/components/icons/AchievementIcon";
import {
  getAchievements,
  type Achievement,
  type AchievementCategory,
} from "@/lib/progression";
import { tabStaggerStyle, useTabEntered } from "@/lib/tabEnterAnimation";

interface ProfileAchievementsProps {
  likedArticlesCount?: number;
  maxItems?: number;
  onViewAll?: () => void;
}

const CATEGORY_THEME: Record<
  AchievementCategory,
  { label: string; accent: string; tint: string; bar: string }
> = {
  reading: {
    label: "Reading",
    accent: "#3B6EF5",
    tint: "rgba(59,110,245,0.12)",
    bar: "linear-gradient(90deg, #3B6EF5, #6B93F8)",
  },
  markets: {
    label: "Markets",
    accent: "#00C6C6",
    tint: "rgba(0,198,198,0.12)",
    bar: "linear-gradient(90deg, #00A8A8, #00C6C6)",
  },
  consistency: {
    label: "Consistency",
    accent: "#F59E0B",
    tint: "rgba(245,158,11,0.12)",
    bar: "linear-gradient(90deg, #D97706, #F59E0B)",
  },
  discovery: {
    label: "Discovery",
    accent: "#A78BFA",
    tint: "rgba(167,139,250,0.14)",
    bar: "linear-gradient(90deg, #8B5CF6, #A78BFA)",
  },
  engagement: {
    label: "Engagement",
    accent: "#F472B6",
    tint: "rgba(244,114,182,0.14)",
    bar: "linear-gradient(90deg, #EC4899, #F472B6)",
  },
};

function achievementProgressRatio(a: Achievement): number {
  if (a.required <= 0) return a.unlocked ? 1 : 0;
  return Math.min(1, Math.max(0, a.progress / a.required));
}

function formatProgressLabel(a: Achievement): string {
  const progress = a.progress.toLocaleString();
  const required = a.required.toLocaleString();
  return `${progress}/${required} ${a.progressUnit}`;
}

function sortAchievements(list: Achievement[]): Achievement[] {
  return [...list].sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.required - b.required;
  });
}

/** Locked achievements nearest completion, then unlocked if needed to fill. */
function closestAchievements(
  list: Achievement[],
  count: number
): Achievement[] {
  const locked = list
    .filter((a) => !a.unlocked)
    .sort((a, b) => {
      const ratioDiff =
        achievementProgressRatio(b) - achievementProgressRatio(a);
      if (ratioDiff !== 0) return ratioDiff;
      const remainDiff =
        a.required - a.progress - (b.required - b.progress);
      if (remainDiff !== 0) return remainDiff;
      return a.required - b.required;
    });

  if (locked.length >= count) return locked.slice(0, count);

  const unlocked = list
    .filter((a) => a.unlocked)
    .sort((a, b) => b.required - a.required);

  return [...locked, ...unlocked].slice(0, count);
}

export function ProfileAchievements({
  likedArticlesCount = 0,
  maxItems,
  onViewAll,
}: ProfileAchievementsProps) {
  const entered = useTabEntered(true);
  const allAchievements = useMemo(
    () => getAchievements({ likedArticlesCount }),
    [likedArticlesCount]
  );

  const unlockedCount = allAchievements.filter((a) => a.unlocked).length;
  const displayAchievements = useMemo(() => {
    if (maxItems) return closestAchievements(allAchievements, maxItems);
    return sortAchievements(allAchievements);
  }, [allAchievements, maxItems]);

  const isPreview = Boolean(maxItems);

  return (
    <section
      className={
        isPreview
          ? "overflow-hidden rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)] px-4 py-4"
          : "space-y-3"
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-[17px] font-bold tracking-tight text-pocket-text">
            Achievements
          </h3>
          <p className="mt-0.5 text-[12px] text-pocket-muted">
            {isPreview
              ? "Closest to unlocking"
              : `${unlockedCount} unlocked`}
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

      <div className={`${isPreview ? "mt-3" : "mt-1"} space-y-2.5`}>
        {displayAchievements.map((achievement, index) => (
          <AchievementRow
            key={achievement.id}
            achievement={achievement}
            showProgress
            compact={isPreview}
            entered={entered}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}

function AchievementRow({
  achievement,
  showProgress = false,
  compact = false,
  entered,
  index,
}: {
  achievement: Achievement;
  showProgress?: boolean;
  compact?: boolean;
  entered: boolean;
  index: number;
}) {
  const theme = CATEGORY_THEME[achievement.category];
  const ratio = achievementProgressRatio(achievement);
  const percent = Math.round(ratio * 100);
  const showBar = showProgress && !achievement.unlocked;
  const progressLabel = formatProgressLabel(achievement);

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)] ${
        compact ? "px-3 py-3" : "px-3.5 py-3.5"
      }`}
      style={tabStaggerStyle(entered, index, 40)}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--pocket-border)]"
          style={{
            color: achievement.unlocked ? theme.accent : "var(--pocket-muted)",
            background: theme.tint,
          }}
        >
          <AchievementIcon
            id={achievement.id}
            size={17}
            unlocked={achievement.unlocked}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className={`truncate text-[13px] font-semibold ${
                achievement.unlocked ? "text-pocket-text" : "text-pocket-text/80"
              }`}
            >
              {achievement.title}
            </p>
            <span
              className="shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
              style={{
                color: theme.accent,
                background: theme.tint,
              }}
            >
              {theme.label}
            </span>
          </div>
          {!compact && (
            <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-pocket-muted">
              {achievement.howToUnlock}
            </p>
          )}
          {showBar && (
            <p
              className="mt-1.5 text-[11px] font-semibold tabular-nums"
              style={{ color: theme.accent }}
            >
              {progressLabel}
            </p>
          )}
        </div>

        {achievement.unlocked ? (
          <span
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
            style={{ background: theme.tint, color: theme.accent }}
          >
            <Check className="h-3.5 w-3.5" strokeWidth={2.75} />
          </span>
        ) : showBar ? (
          <span
            className="mt-0.5 shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold tabular-nums"
            style={{ background: theme.tint, color: theme.accent }}
          >
            {percent}%
          </span>
        ) : (
          <Lock
            className="mt-1 h-3.5 w-3.5 shrink-0 text-pocket-muted/50"
            strokeWidth={2}
          />
        )}
      </div>

      {showBar && (
        <div className="mt-2.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--pocket-surface-hover)]">
            <div
              className="h-full rounded-full transition-[width] duration-500 ease-out"
              style={{ width: `${percent}%`, background: theme.bar }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
