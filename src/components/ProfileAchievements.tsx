"use client";

import { useMemo, useState } from "react";
import { Check, Lock } from "lucide-react";
import {
  getAchievements,
  type Achievement,
  type AchievementCategory,
} from "@/lib/progression";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

const CATEGORY_FILTERS: { id: AchievementCategory | "all"; label: string }[] =
  [
    { id: "all", label: "All" },
    { id: "reading", label: "Reading" },
    { id: "markets", label: "Markets" },
    { id: "consistency", label: "Consistency" },
    { id: "discovery", label: "Discovery" },
    { id: "engagement", label: "Engagement" },
  ];

/**
 * Sort order: unlocked first, then in-progress sorted by ratio desc, then not-started.
 */
function sortAchievements(list: Achievement[]): Achievement[] {
  return [...list].sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
    const ra = a.required > 0 ? a.progress / a.required : 0;
    const rb = b.required > 0 ? b.progress / b.required : 0;
    return rb - ra;
  });
}

/** Order that sections appear in the "All" grouped view. */
const SECTION_ORDER: AchievementCategory[] = [
  "reading",
  "markets",
  "consistency",
  "discovery",
  "engagement",
];

interface ProfileAchievementsProps {
  likedArticlesCount?: number;
  /**
   * When set, renders exactly 4 prioritised achievements (2 unlocked +
   * 2 closest to completion). Omit for the full list.
   */
  maxItems?: number;
  /** Renders a "View all" button when provided. */
  onViewAll?: () => void;
  /** Full-screen mode: shows category filter tabs. */
  showCategoryFilter?: boolean;
}

// ---------------------------------------------------------------------------
// Prioritisation for preview (4 cards)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ProfileAchievements({
  likedArticlesCount = 0,
  maxItems,
  onViewAll,
  showCategoryFilter = false,
}: ProfileAchievementsProps) {
  const [activeCategory, setActiveCategory] = useState<
    AchievementCategory | "all"
  >("all");

  const allAchievements = useMemo(
    () => getAchievements({ likedArticlesCount }),
    [likedArticlesCount]
  );

  const displayAchievements = useMemo(() => {
    if (maxItems) return buildPreview4(allAchievements);
    if (activeCategory === "all") return allAchievements;
    return sortAchievements(allAchievements.filter((a) => a.category === activeCategory));
  }, [allAchievements, maxItems, activeCategory]);

  const unlockedCount = allAchievements.filter((a) => a.unlocked).length;

  return (
    <section>
      {/* Section header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-white">Achievements</h3>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            {unlockedCount} of {allAchievements.length} unlocked
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

      {/* Category filter tabs (full-screen mode only) */}
      {showCategoryFilter && (
        <div className="-mx-5 mt-3 overflow-x-auto px-5">
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

      {/* Full-screen "All" view: render grouped sections with headers */}
      {showCategoryFilter && activeCategory === "all" ? (
        <div className="mt-3 space-y-5">
          {SECTION_ORDER.map((cat) => {
            const group = sortAchievements(allAchievements.filter((a) => a.category === cat));
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
                    <AchievementCard key={a.id} achievement={a} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Flat grid: preview mode OR filtered-by-category view */
        <div className="mt-3 grid grid-cols-2 gap-2">
          {displayAchievements.map((a) => (
            <AchievementCard key={a.id} achievement={a} />
          ))}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Achievement card
// ---------------------------------------------------------------------------

function AchievementCard({ achievement: a }: { achievement: Achievement }) {
  const pct = Math.min(100, Math.round((a.progress / a.required) * 100));
  const inProgress = !a.unlocked && a.progress > 0;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-3"
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
      {/* Left accent line — unlocked only */}
      {a.unlocked && (
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
        <div
          className="flex h-8 w-8 items-center justify-center rounded-xl text-lg leading-none"
          style={{
            backgroundColor: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.08)",
            opacity: a.unlocked ? 1 : 0.28,
            filter: a.unlocked ? undefined : "grayscale(100%)",
          }}
        >
          {a.icon}
        </div>

        {a.unlocked ? (
          <div
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
            style={{
              background: "linear-gradient(135deg, #009faa 0%, #007080 100%)",
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

      {/* Title */}
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

      {/* Progress text or description */}
      {a.unlocked ? (
        <p className="mt-0.5 text-[10px] leading-snug text-zinc-600">
          {a.description}
        </p>
      ) : (
        <p className="mt-0.5 text-[10px] leading-snug text-zinc-600">
          {a.progress}&thinsp;/&thinsp;{a.required}
        </p>
      )}

      {/* Progress bar — shown for in-progress locked achievements */}
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
