"use client";

import { Check } from "lucide-react";
import { ProfileAvatarWithRing } from "@/components/ProfileAvatarWithRing";
import { StreakFlameIcon } from "@/components/icons/StreakFlameIcon";
import { tabEnterStyle } from "@/lib/tabEnterAnimation";
import type {
  DailyGoalState,
  LevelState,
  StreakState,
  WeeklyActivity,
} from "@/lib/progression";

const CARD =
  "overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]";

interface ProfileProgressionHubProps {
  displayName: string;
  initials: string;
  email?: string | null;
  joined: string | null;
  progression: LevelState;
  totalXP: number;
  dailyGoal: DailyGoalState;
  streak: StreakState;
  weekly: WeeklyActivity;
  articlesOpened: number;
  likedCount: number;
  watchlistCount: number;
  animateIn?: boolean;
}

export function ProfileProgressionHub({
  displayName,
  initials,
  email,
  joined,
  progression,
  totalXP,
  dailyGoal,
  streak,
  weekly,
  articlesOpened,
  likedCount,
  watchlistCount,
  animateIn = true,
}: ProfileProgressionHubProps) {
  const isMaxLevel = progression.level === 7;
  const hasWeeklyActivity =
    weekly.articlesRead > 0 || weekly.briefingsCompleted > 0;
  const goalPct = Math.round(
    (dailyGoal.completedTasks / dailyGoal.totalTasks) * 100
  );
  const xpToNext = progression.nextLevelXP - progression.currentLevelXP;

  return (
    <div className="mt-2 space-y-4">
      {/* ── Who you are ─────────────────────────────────────────────────── */}
      <section className={`${CARD} px-5 py-5`} style={tabEnterStyle(animateIn, 0)}>
        <div className="flex flex-col items-center text-center">
          <ProfileAvatarWithRing
            initials={initials}
            progression={progression}
            animateIn={animateIn}
          />
          <h2 className="mt-4 text-[20px] font-bold leading-tight text-white">
            {displayName}
          </h2>
          {email && (
            <p className="mt-1 max-w-full truncate text-[13px] text-zinc-500">
              {email}
            </p>
          )}
          <p className="mt-1.5 text-[13px] font-medium text-[#9DA8FF]">
            {progression.title}
          </p>

          {!isMaxLevel ? (
            <div className="mt-4 w-full">
              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <span>Level {progression.level}</span>
                <span className="tabular-nums">
                  {progression.progressXP.toLocaleString()} /{" "}
                  {xpToNext.toLocaleString()} XP
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#7C6CF8] via-[#5B8EF0] to-[#00C6C6]"
                  style={{ width: `${progression.progressPercent}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="mt-3 text-[12px] tabular-nums text-zinc-500">
              {totalXP.toLocaleString()} lifetime XP
            </p>
          )}

          {joined && (
            <p className="mt-3 text-[11px] text-zinc-600">Member since {joined}</p>
          )}
        </div>
      </section>

      {/* ── Today ───────────────────────────────────────────────────────── */}
      <section className={CARD} style={tabEnterStyle(animateIn, 120)}>
        <div className="border-b border-white/[0.06] px-4 py-3">
          <h3 className="text-[14px] font-semibold text-white">Today</h3>
          <p className="mt-0.5 text-[12px] text-zinc-500">
            {dailyGoal.isComplete
              ? "You finished your daily goal"
              : "Complete these to earn +15 XP"}
          </p>
        </div>

        <div className="px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div
              className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#00C6C6 ${goalPct}%, rgba(255,255,255,0.08) 0)`,
              }}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold tabular-nums text-white"
                style={{ background: "rgba(8,9,14,0.94)" }}
              >
                {goalPct}%
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-white">
                {dailyGoal.isComplete
                  ? "Goal complete"
                  : `${dailyGoal.completedTasks} of ${dailyGoal.totalTasks} tasks`}
              </p>
              {!dailyGoal.isComplete && (
                <div className="mt-2 space-y-2">
                  {dailyGoal.tasks.map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.06] px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: "rgba(245,158,11,0.14)",
                border: "1px solid rgba(245,158,11,0.22)",
              }}
            >
              <StreakFlameIcon size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-white">
                {streak.currentStreak === 0
                  ? "No streak yet"
                  : `${streak.currentStreak}-day streak`}
              </p>
              <p className="text-[12px] text-zinc-500">
                {streak.currentStreak === 0
                  ? "Finish today's goal to start one"
                  : streak.goalCompletedToday
                    ? "Come back tomorrow to keep it going"
                    : `Best streak: ${streak.bestStreak} days`}
              </p>
            </div>
          </div>
          <div className="mt-3 flex justify-between px-0.5">
            {streak.weeklyStrip.map(({ day, completed, isToday }) => (
              <div key={day} className="flex flex-col items-center gap-1">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: completed
                      ? "rgba(245,158,11,0.85)"
                      : "transparent",
                    border: isToday
                      ? `2px solid ${completed ? "rgba(245,158,11,1)" : "rgba(245,158,11,0.4)"}`
                      : completed
                        ? "none"
                        : "1.5px solid rgba(255,255,255,0.12)",
                  }}
                >
                  {completed && (
                    <Check className="h-2.5 w-2.5 text-black/80" strokeWidth={3} />
                  )}
                </div>
                <span className="text-[9px] text-zinc-600">{day}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Activity ────────────────────────────────────────────────────── */}
      <section className={CARD} style={tabEnterStyle(animateIn, 240)}>
        <div className="border-b border-white/[0.06] px-4 py-3">
          <h3 className="text-[14px] font-semibold text-white">Your activity</h3>
        </div>
        <div className="grid grid-cols-3 divide-x divide-white/[0.06]">
          <StatTile label="Articles read" value={String(articlesOpened)} />
          <StatTile label="Liked" value={String(likedCount)} />
          <StatTile label="Watchlist" value={String(watchlistCount)} />
        </div>
        <div className="border-t border-white/[0.06] px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-600">
            This week
          </p>
          {hasWeeklyActivity ? (
            <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-400">
              {weekly.articlesRead} articles · {weekly.briefingsCompleted} briefings
              · {weekly.xpEarned} XP earned
            </p>
          ) : (
            <p className="mt-1.5 text-[13px] text-zinc-500">
              Read a story to start tracking your week.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function TaskRow({
  task,
}: {
  task: DailyGoalState["tasks"][number];
}) {
  const done = task.completed >= task.required;

  return (
    <div className="flex items-center gap-2.5">
      {done ? (
        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#00C6C6]">
          <Check className="h-2.5 w-2.5 text-black" strokeWidth={3} />
        </div>
      ) : (
        <div
          className="h-4 w-4 shrink-0 rounded-full"
          style={{ border: "1.5px solid rgba(255,255,255,0.16)" }}
        />
      )}
      <span className="flex-1 text-[12px] text-zinc-400">{task.label}</span>
      <span className="text-[11px] tabular-nums text-zinc-600">
        {task.completed}/{task.required}
      </span>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center px-2 py-4">
      <p className="text-[22px] font-bold tabular-nums leading-none text-white">
        {value}
      </p>
      <p className="mt-1.5 text-center text-[10px] leading-tight text-zinc-500">
        {label}
      </p>
    </div>
  );
}
