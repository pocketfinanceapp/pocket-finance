"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, Lock, X } from "lucide-react";
import { AchievementIcon } from "@/components/icons/AchievementIcon";
import {
  getAchievements,
  type Achievement,
  type AchievementCategory,
} from "@/lib/progression";

const CATEGORY_FILTERS: { id: AchievementCategory | "all"; label: string }[] =
  [
    { id: "all", label: "All" },
    { id: "reading", label: "Reading" },
    { id: "markets", label: "Markets" },
    { id: "consistency", label: "Consistency" },
    { id: "discovery", label: "Companies" },
    { id: "engagement", label: "Engagement" },
  ];

function sortAchievements(list: Achievement[]): Achievement[] {
  return [...list].sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
    if (a.required !== b.required) return a.required - b.required;
    return a.xpReward - b.xpReward;
  });
}

const SECTION_ORDER: AchievementCategory[] = [
  "reading",
  "markets",
  "consistency",
  "discovery",
  "engagement",
];

interface ProfileAchievementsProps {
  likedArticlesCount?: number;
  maxItems?: number;
  onViewAll?: () => void;
  showCategoryFilter?: boolean;
}

function buildPreview4(achievements: Achievement[]): Achievement[] {
  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = [...achievements.filter((a) => !a.unlocked)].sort(
    (a, b) => a.required - b.required
  );
  const result: Achievement[] = [
    ...unlocked.slice(0, 2),
    ...locked.slice(0, Math.max(0, 4 - Math.min(unlocked.length, 2))),
  ];
  return result.slice(0, 4);
}

export function ProfileAchievements({
  likedArticlesCount = 0,
  maxItems,
  onViewAll,
  showCategoryFilter = false,
}: ProfileAchievementsProps) {
  const [activeCategory, setActiveCategory] = useState<
    AchievementCategory | "all"
  >("all");
  const [infoAchievement, setInfoAchievement] = useState<Achievement | null>(
    null
  );

  const allAchievements = useMemo(
    () => getAchievements({ likedArticlesCount }),
    [likedArticlesCount]
  );

  const displayAchievements = useMemo(() => {
    if (maxItems) return buildPreview4(allAchievements);
    if (activeCategory === "all") return allAchievements;
    return sortAchievements(
      allAchievements.filter((a) => a.category === activeCategory)
    );
  }, [allAchievements, maxItems, activeCategory]);

  const unlockedCount = allAchievements.filter((a) => a.unlocked).length;
  const unlockPercent = Math.round(
    (unlockedCount / Math.max(allAchievements.length, 1)) * 100
  );

  const isFullPage = showCategoryFilter && !maxItems;

  return (
    <>
      <section
        className={
          isFullPage
            ? "space-y-5"
            : "pf-card-surface overflow-hidden rounded-2xl px-4 py-4"
        }
      >
        {isFullPage && (
          <div className="space-y-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[15px] font-bold text-pocket-text">
                {unlockedCount} of {allAchievements.length} unlocked
              </p>
              <p className="text-[12px] font-semibold tabular-nums text-pocket-muted">
                {unlockPercent}%
              </p>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-[var(--pocket-surface-hover)]">
              <div
                className="h-full rounded-full bg-pocket-teal transition-all duration-500"
                style={{ width: `${unlockPercent}%` }}
              />
            </div>
          </div>
        )}

        {!isFullPage && (
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-[17px] font-black tracking-tight text-pocket-text">
                Achievements
              </h3>
              <p className="mt-1 text-[12px] font-semibold text-pocket-muted">
                {unlockedCount} of {allAchievements.length} unlocked
              </p>
            </div>
            {onViewAll && (
              <button
                type="button"
                data-no-drag
                onClick={onViewAll}
                className="inline-flex items-center gap-0.5 text-[12px] font-bold text-pocket-teal active:opacity-60"
              >
                View all
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            )}
          </div>
        )}

        {!isFullPage && (
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-[var(--pocket-surface-hover)]">
            <div
              className="h-full rounded-full bg-pocket-teal transition-all duration-500"
              style={{ width: `${unlockPercent}%` }}
            />
          </div>
        )}

        {showCategoryFilter && (
          <div className="-mx-1 overflow-x-auto px-1 pf-scroll">
            <div className="flex gap-1.5 pb-1">
              {CATEGORY_FILTERS.map((f) => {
                const active = activeCategory === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    data-no-drag
                    onClick={() => setActiveCategory(f.id)}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors active:opacity-70 ${
                      active
                        ? "bg-[var(--pocket-surface-hover)] text-pocket-text"
                        : "text-pocket-muted"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="pf-achievement-grid-enter" key={activeCategory}>
          {showCategoryFilter && activeCategory === "all" ? (
            <div className="space-y-5">
              {SECTION_ORDER.map((cat) => {
                const group = sortAchievements(
                  allAchievements.filter((a) => a.category === cat)
                );
                if (group.length === 0) return null;
                const catLabel =
                  CATEGORY_FILTERS.find((f) => f.id === cat)?.label ?? cat;
                return (
                  <div key={cat}>
                    <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-pocket-muted">
                      {catLabel}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {group.map((a) => (
                        <AchievementCard
                          key={a.id}
                          achievement={a}
                          onInfo={() => setInfoAchievement(a)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {displayAchievements.map((a) => (
                <AchievementCard
                  key={a.id}
                  achievement={a}
                  onInfo={() => setInfoAchievement(a)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {infoAchievement && (
        <AchievementInfoSheet
          achievement={infoAchievement}
          onClose={() => setInfoAchievement(null)}
        />
      )}
    </>
  );
}

function AchievementCard({
  achievement: a,
  onInfo,
}: {
  achievement: Achievement;
  onInfo: () => void;
}) {
  const pct = Math.min(100, Math.round((a.progress / a.required) * 100));

  return (
    <button
      type="button"
      data-no-drag
      onClick={onInfo}
      className={`flex h-[92px] flex-col rounded-xl border px-3 py-2.5 text-left transition-colors active:opacity-80 ${
        a.unlocked
          ? "border-pocket-teal/25 bg-[var(--pocket-card)]"
          : "border-[var(--pocket-border)] bg-[var(--pocket-card)]"
      }`}
    >
      <div className="flex items-start gap-2">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
            a.unlocked
              ? "border-pocket-teal/20 text-pocket-teal"
              : "border-[var(--pocket-border)] text-pocket-muted"
          }`}
        >
          <AchievementIcon id={a.id} size={15} unlocked={a.unlocked} />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`line-clamp-2 text-[11px] font-semibold leading-snug ${
              a.unlocked ? "text-pocket-text" : "text-pocket-muted"
            }`}
          >
            {a.title}
          </p>
          <p className="mt-0.5 text-[10px] font-medium text-pocket-muted">
            +{a.xpReward} XP
          </p>
        </div>

        {a.unlocked ? (
          <Check
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pocket-teal"
            strokeWidth={2.5}
          />
        ) : (
          <Lock
            className="mt-0.5 h-3 w-3 shrink-0 text-pocket-muted/60"
            strokeWidth={2}
          />
        )}
      </div>

      <div className="mt-auto pt-2">
        {a.unlocked ? (
          <div className="h-1 rounded-full bg-pocket-teal/30" />
        ) : (
          <>
            <div className="mb-1 flex justify-between text-[9px] font-medium tabular-nums text-pocket-muted">
              <span>{a.progress}/{a.required}</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-[var(--pocket-surface-hover)]">
              <div
                className="h-full rounded-full bg-pocket-muted/40 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </>
        )}
      </div>
    </button>
  );
}

function AchievementInfoSheet({
  achievement,
  onClose,
}: {
  achievement: Achievement;
  onClose: () => void;
}) {
  const pct = Math.min(
    100,
    Math.round((achievement.progress / achievement.required) * 100)
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="pf-theme-scope fixed inset-0 z-[80] flex items-end justify-center sm:items-center"
      style={{ background: "var(--pocket-backdrop)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-labelledby="achievement-info-title"
        className="w-full max-w-sm border border-[var(--pocket-border)] px-5 pb-8 pt-4 sm:rounded-3xl pf-achievement-sheet-enter"
        style={{
          background: "var(--pocket-sheet)",
          borderRadius: "1.5rem 1.5rem 0 0",
          paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex justify-center">
          <div className="h-1 w-10 rounded-full bg-[var(--pocket-border)]" />
        </div>

        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                achievement.unlocked
                  ? "border-pocket-teal/25 text-pocket-teal"
                  : "border-[var(--pocket-border)] text-pocket-muted"
              }`}
            >
              <AchievementIcon
                id={achievement.id}
                size={20}
                unlocked={achievement.unlocked}
              />
            </div>
            <div>
              <p
                id="achievement-info-title"
                className="text-[16px] font-bold leading-tight text-pocket-text"
              >
                {achievement.title}
              </p>
              <p className="mt-0.5 text-[12px] font-medium text-pocket-muted">
                {achievement.unlocked ? "Unlocked" : `${pct}% complete`}
              </p>
            </div>
          </div>
          <button
            type="button"
            data-no-drag
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-pocket-muted active:opacity-60"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-[13px] leading-relaxed text-pocket-muted">
          {achievement.howToUnlock}
        </p>

        <div className="mt-4 flex gap-4 border-t border-[var(--pocket-border)] pt-4 text-[12px]">
          <div>
            <p className="text-pocket-muted">Reward</p>
            <p className="mt-0.5 font-bold tabular-nums text-pocket-teal">
              +{achievement.xpReward} XP
            </p>
          </div>
          <div>
            <p className="text-pocket-muted">Progress</p>
            <p className="mt-0.5 font-bold tabular-nums text-pocket-text">
              {achievement.progress}/{achievement.required}
            </p>
          </div>
        </div>

        {!achievement.unlocked && (
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-[var(--pocket-surface-hover)]">
            <div
              className="h-full rounded-full bg-pocket-muted/50 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
