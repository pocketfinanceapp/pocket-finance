"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, Info, Lock, X } from "lucide-react";
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
    { id: "discovery", label: "Explore" },
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

  const nextLocked = useMemo(() => {
    return [...allAchievements]
      .filter((a) => !a.unlocked)
      .sort(
        (a, b) =>
          b.progress / Math.max(b.required, 1) -
          a.progress / Math.max(a.required, 1)
      )[0];
  }, [allAchievements]);

  const switchCategory = (id: AchievementCategory | "all") => {
    if (id === activeCategory) return;
    setActiveCategory(id);
  };

  const isFullPage = showCategoryFilter && !maxItems;

  return (
    <>
      <section
        className={
          isFullPage
            ? "space-y-4"
            : "pf-card-surface overflow-hidden rounded-2xl px-4 py-4"
        }
      >
        {isFullPage && (
          <div className="pf-card-surface overflow-hidden rounded-2xl px-4 py-4 pf-achievement-enter">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-pocket-muted">
                  Collection
                </p>
                <p className="mt-1 text-[28px] font-black tabular-nums leading-none text-pocket-text">
                  {unlockedCount}
                  <span className="text-[16px] font-bold text-pocket-muted">
                    {" "}
                    / {allAchievements.length}
                  </span>
                </p>
              </div>
              <p className="text-[13px] font-bold text-pocket-teal">
                {unlockPercent}% complete
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--pocket-surface-hover)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#3B6EF5] via-[#5B8EF0] to-[#00C6C6] transition-all duration-700"
                style={{ width: `${unlockPercent}%` }}
              />
            </div>
            {nextLocked && (
              <p className="mt-3 text-[12px] font-semibold text-pocket-muted">
                Next up:{" "}
                <span className="font-bold text-pocket-text">
                  {nextLocked.title}
                </span>
              </p>
            )}
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[17px] font-black tracking-tight text-pocket-text">
              Achievements
            </h3>
            {!isFullPage && (
              <p className="mt-1 text-[12px] font-semibold text-pocket-muted">
                {unlockedCount} of {allAchievements.length} unlocked
                {nextLocked ? ` · Next: ${nextLocked.title}` : ""}
              </p>
            )}
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

        {!isFullPage && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--pocket-surface-hover)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] transition-all duration-700"
              style={{ width: `${unlockPercent}%` }}
            />
          </div>
        )}

        {showCategoryFilter && (
          <div className="-mx-1 mt-4 overflow-x-auto px-1 pf-scroll">
            <div className="flex gap-2 pb-1">
              {CATEGORY_FILTERS.map((f, index) => {
                const active = activeCategory === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    data-no-drag
                    onClick={() => switchCategory(f.id)}
                    className={`shrink-0 rounded-full border px-3.5 py-2 text-[12px] font-bold transition-all duration-200 active:scale-[0.97] pf-achievement-enter ${
                      active
                        ? "border-pocket-teal/30 bg-pocket-teal/12 text-pocket-teal shadow-[0_0_0_1px_rgba(0,198,198,0.08)]"
                        : "border-[var(--pocket-border)] bg-[var(--pocket-card)] text-pocket-muted"
                    }`}
                    style={{ animationDelay: `${index * 35}ms` }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-4 pf-achievement-grid-enter" key={activeCategory}>
          {showCategoryFilter && activeCategory === "all" ? (
            <div className="space-y-4">
              {SECTION_ORDER.map((cat, sectionIndex) => {
                const group = sortAchievements(
                  allAchievements.filter((a) => a.category === cat)
                );
                if (group.length === 0) return null;
                const catLabel =
                  CATEGORY_FILTERS.find((f) => f.id === cat)?.label ?? cat;
                const sectionUnlocked = group.filter((a) => a.unlocked).length;
                return (
                  <div
                    key={cat}
                    className="pf-card-surface overflow-hidden rounded-2xl p-3 pf-achievement-enter"
                    style={{ animationDelay: `${sectionIndex * 60}ms` }}
                  >
                    <div className="mb-3 flex items-center justify-between gap-2 border-b border-[var(--pocket-border)] pb-2.5">
                      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-pocket-muted">
                        {catLabel}
                      </p>
                      <p className="text-[11px] font-bold tabular-nums text-pocket-muted">
                        {sectionUnlocked}/{group.length}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {group.map((a, i) => (
                        <AchievementCard
                          key={a.id}
                          achievement={a}
                          index={i}
                          onInfo={() => setInfoAchievement(a)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {displayAchievements.map((a, i) => (
                <AchievementCard
                  key={a.id}
                  achievement={a}
                  index={i}
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
  index,
  onInfo,
}: {
  achievement: Achievement;
  index: number;
  onInfo: () => void;
}) {
  const pct = Math.min(100, Math.round((a.progress / a.required) * 100));
  const inProgress = !a.unlocked && a.progress > 0;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-3 pf-achievement-enter ${
        a.unlocked
          ? "border-[var(--pocket-border-strong)] bg-[var(--pocket-surface-hover)] pf-achievement-unlocked"
          : "border-[var(--pocket-border)] bg-[var(--pocket-card-solid)]"
      }`}
      style={{
        minHeight: 108,
        animationDelay: `${Math.min(index, 8) * 45}ms`,
        boxShadow: "var(--pocket-card-inset)",
      }}
    >
      {a.unlocked && (
        <div
          className="absolute bottom-2.5 left-0 top-2.5 w-[3px] rounded-full"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,198,198,0.85), rgba(59,110,245,0.35))",
          }}
        />
      )}

      <div className="flex items-start justify-between gap-1.5">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
            a.unlocked
              ? "border-pocket-teal/25 bg-gradient-to-br from-[#3B6EF5]/20 to-[#00C6C6]/16 text-pocket-teal"
              : "border-[var(--pocket-border)] bg-[var(--pocket-surface-hover)] text-pocket-muted"
          }`}
        >
          <AchievementIcon id={a.id} size={18} unlocked={a.unlocked} />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            data-no-drag
            onClick={onInfo}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--pocket-border)] bg-[var(--pocket-card)] text-pocket-muted active:scale-95 active:text-pocket-text"
            aria-label={`How to unlock ${a.title}`}
          >
            <Info className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
          {a.unlocked ? (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#00C6C6] to-[#009faa]">
              <Check className="h-[10px] w-[10px] text-white" strokeWidth={3} />
            </div>
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--pocket-border)] bg-[var(--pocket-card)]">
              <Lock className="h-[9px] w-[9px] text-pocket-muted" strokeWidth={2.5} />
            </div>
          )}
        </div>
      </div>

      <p
        className={`mt-2.5 text-[13px] font-bold leading-snug ${
          a.unlocked ? "text-pocket-text" : "text-pocket-muted"
        }`}
      >
        {a.title}
      </p>

      <p
        className={`mt-1 text-[11px] font-bold ${
          a.unlocked ? "text-pocket-teal" : "text-pocket-muted"
        }`}
      >
        {a.unlocked ? `+${a.xpReward} XP earned` : `+${a.xpReward} XP`}
      </p>

      {a.unlocked ? (
        <p className="mt-1 line-clamp-2 text-[10px] font-medium leading-snug text-pocket-muted">
          {a.description}
        </p>
      ) : (
        <p className="mt-1 text-[10px] font-bold tabular-nums text-pocket-muted">
          {a.progress} / {a.required}
        </p>
      )}

      {inProgress && (
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[var(--pocket-surface-hover)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#5B8EF0] to-[#00C6C6] transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
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
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-pocket-teal/25 bg-gradient-to-br from-[#3B6EF5]/22 to-[#00C6C6]/16 text-pocket-teal">
              <AchievementIcon
                id={achievement.id}
                size={22}
                unlocked={achievement.unlocked}
              />
            </div>
            <div>
              <p
                id="achievement-info-title"
                className="text-[18px] font-black leading-tight text-pocket-text"
              >
                {achievement.title}
              </p>
              <p className="mt-1 text-[12px] font-bold text-pocket-muted">
                {achievement.unlocked ? (
                  <span className="text-pocket-teal">Unlocked</span>
                ) : (
                  `${pct}% complete`
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            data-no-drag
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--pocket-border)] bg-[var(--pocket-card)] text-pocket-muted active:scale-95 active:text-pocket-text"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)] px-4 py-3.5">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-pocket-teal">
            How to unlock
          </p>
          <p className="mt-2 text-[14px] font-semibold leading-relaxed text-pocket-text">
            {achievement.howToUnlock}
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)] px-3.5 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-pocket-muted">
              XP reward
            </p>
            <p className="mt-1 text-[15px] font-black tabular-nums text-pocket-teal">
              +{achievement.xpReward}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)] px-3.5 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-pocket-muted">
              Progress
            </p>
            <p className="mt-1 text-[15px] font-black tabular-nums text-pocket-text">
              {achievement.progress}/{achievement.required}
            </p>
          </div>
        </div>

        {!achievement.unlocked && (
          <div className="mt-3">
            <div className="mb-2 flex items-center justify-between text-[11px] font-bold">
              <span className="text-pocket-muted">Completion</span>
              <span className="tabular-nums text-pocket-text">{pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--pocket-surface-hover)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#7C6CF8] via-[#5B8EF0] to-[#00C6C6] transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
