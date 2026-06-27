"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Info, Lock, X } from "lucide-react";
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
    { id: "discovery", label: "Discovery" },
    { id: "engagement", label: "Engagement" },
  ];

function sortAchievements(list: Achievement[]): Achievement[] {
  return [...list].sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
    const ra = a.required > 0 ? a.progress / a.required : 0;
    const rb = b.required > 0 ? b.progress / b.required : 0;
    return rb - ra;
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
    (a, b) => b.progress / b.required - a.progress / a.required
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
  const nextLocked = useMemo(() => {
    return [...allAchievements]
      .filter((a) => !a.unlocked)
      .sort(
        (a, b) =>
          b.progress / Math.max(b.required, 1) -
          a.progress / Math.max(a.required, 1)
      )[0];
  }, [allAchievements]);

  return (
    <>
      <section>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-bold text-white">Achievements</h3>
            <p className="mt-0.5 text-[12px] text-zinc-500">
              {unlockedCount} of {allAchievements.length} unlocked
              {nextLocked && maxItems
                ? ` · Next up: ${nextLocked.title}`
                : nextLocked && !maxItems
                  ? ` · Next up: ${nextLocked.title}`
                  : ""}
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

        {showCategoryFilter && (
          <div className="-mx-5 mt-3 overflow-x-auto px-5 pf-scroll">
            <div className="flex gap-2 pb-1">
              {CATEGORY_FILTERS.map((f) => {
                const active = activeCategory === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    data-no-drag
                    onClick={() => setActiveCategory(f.id)}
                    className="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors active:opacity-70"
                    style={{
                      backgroundColor: active
                        ? "rgba(0,198,198,0.15)"
                        : "rgba(255,255,255,0.05)",
                      color: active ? "#00C6C6" : "rgba(255,255,255,0.42)",
                      border: active
                        ? "1px solid rgba(0,198,198,0.25)"
                        : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {showCategoryFilter && activeCategory === "all" ? (
          <div className="mt-3 space-y-5">
            {SECTION_ORDER.map((cat) => {
              const group = sortAchievements(
                allAchievements.filter((a) => a.category === cat)
              );
              if (group.length === 0) return null;
              const catLabel =
                CATEGORY_FILTERS.find((f) => f.id === cat)?.label ?? cat;
              return (
                <div key={cat}>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-zinc-600">
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
          <div className="mt-3 grid grid-cols-2 gap-2">
            {displayAchievements.map((a) => (
              <AchievementCard
                key={a.id}
                achievement={a}
                onInfo={() => setInfoAchievement(a)}
              />
            ))}
          </div>
        )}
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
  const inProgress = !a.unlocked && a.progress > 0;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-3 ${
        a.unlocked ? "badge-unlock-animate" : ""
      }`}
      style={{
        minHeight: 96,
        backgroundColor: a.unlocked
          ? "rgba(0,198,198,0.025)"
          : "rgba(10,11,16,0.72)",
        border: a.unlocked
          ? "1px solid rgba(255,255,255,0.08)"
          : "1px solid rgba(255,255,255,0.05)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.03)",
      }}
    >
      {a.unlocked && (
        <div
          className="absolute bottom-2 left-0 top-2 w-[2px] rounded-full"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,198,198,0.60), rgba(0,198,198,0.12))",
          }}
        />
      )}

      <div className="flex items-start justify-between gap-1">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: a.unlocked
              ? "linear-gradient(135deg, rgba(59,110,245,0.22), rgba(0,198,198,0.16))"
              : "rgba(255,255,255,0.05)",
            border: a.unlocked
              ? "1px solid rgba(0,198,198,0.22)"
              : "1px solid rgba(255,255,255,0.08)",
            color: a.unlocked ? "#00C6C6" : "rgba(255,255,255,0.35)",
            opacity: a.unlocked ? 1 : 0.85,
          }}
        >
          <AchievementIcon id={a.id} size={17} unlocked={a.unlocked} />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            data-no-drag
            onClick={onInfo}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] text-zinc-400 active:bg-white/[0.12] active:text-white"
            aria-label={`How to unlock ${a.title}`}
          >
            <Info className="h-3 w-3" strokeWidth={2.5} />
          </button>
          {a.unlocked ? (
            <div
              className="flex h-5 w-5 items-center justify-center rounded-full"
              style={{
                background: "linear-gradient(135deg, #009faa 0%, #007080 100%)",
              }}
            >
              <Check className="h-[10px] w-[10px] text-white" strokeWidth={3} />
            </div>
          ) : (
            <div
              className="flex h-5 w-5 items-center justify-center rounded-full"
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.09)",
              }}
            >
              <Lock className="h-[9px] w-[9px] text-zinc-600" />
            </div>
          )}
        </div>
      </div>

      <p
        className="mt-2 text-[12px] font-semibold leading-snug"
        style={{
          color: a.unlocked
            ? "rgba(255,255,255,0.92)"
            : "rgba(255,255,255,0.52)",
        }}
      >
        {a.title}
      </p>

      {a.unlocked ? (
        <p className="mt-0.5 text-[10px] leading-snug text-zinc-600">
          {a.description}
        </p>
      ) : (
        <p className="mt-0.5 text-[10px] leading-snug text-zinc-600">
          {a.progress}&thinsp;/&thinsp;{a.required}
        </p>
      )}

      {inProgress && (
        <div
          className="mt-2 overflow-hidden rounded-full"
          style={{ height: 2, backgroundColor: "rgba(255,255,255,0.07)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              backgroundColor: "rgba(0,198,198,0.60)",
            }}
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
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center"
      style={{ background: "rgba(3,3,5,0.72)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-labelledby="achievement-info-title"
        className="w-full max-w-sm animate-[feed-search-result-in_320ms_cubic-bezier(0.22,1,0.36,1)_both] rounded-t-3xl border border-white/[0.10] px-5 pb-8 pt-5 sm:rounded-3xl"
        style={{
          background:
            "linear-gradient(165deg, rgba(14,16,36,0.98) 0%, rgba(6,7,12,0.99) 100%)",
          paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(59,110,245,0.22), rgba(0,198,198,0.16))",
                border: "1px solid rgba(0,198,198,0.22)",
                color: "#00C6C6",
              }}
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
                className="text-[16px] font-bold text-white"
              >
                {achievement.title}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                {achievement.unlocked ? "Unlocked" : `${pct}% complete`}
              </p>
            </div>
          </div>
          <button
            type="button"
            data-no-drag
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-zinc-400 active:bg-white/[0.10]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#00C6C6]">
            How to unlock
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-zinc-300">
            {achievement.howToUnlock}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/[0.06] bg-black/30 px-4 py-3">
          <span className="text-[12px] text-zinc-500">Progress</span>
          <span className="text-[13px] font-semibold tabular-nums text-white">
            {achievement.progress} / {achievement.required}
          </span>
        </div>

        {!achievement.unlocked && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7C6CF8] to-[#00C6C6] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
