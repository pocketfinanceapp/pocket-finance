"use client";

import { Calendar, Check } from "lucide-react";
import { ProfileAvatarWithRing } from "@/components/ProfileAvatarWithRing";
import { StreakFlameIcon } from "@/components/icons/StreakFlameIcon";
import { tabEnterStyle } from "@/lib/tabEnterAnimation";
import type {
  DailyGoalState,
  LevelState,
  StreakState,
  WeeklyActivity,
} from "@/lib/progression";

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
  const hasWeeklyActivity = weekly.articlesRead > 0 || weekly.briefingsCompleted > 0;
  const goalPct = Math.round(
    (dailyGoal.completedTasks / dailyGoal.totalTasks) * 100
  );

  return (
    <div
      className="relative mt-3 overflow-hidden rounded-[22px]"
      style={{
        ...tabEnterStyle(animateIn, 0),
        background:
          "linear-gradient(165deg, rgba(14,16,36,0.98) 0%, rgba(6,7,12,0.99) 52%, rgba(10,8,6,0.98) 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.05), 0 18px 40px rgba(0,0,0,0.35)",
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full opacity-80"
        style={{
          background:
            "radial-gradient(circle, rgba(124,108,248,0.16) 0%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-10 -left-6 h-32 w-32 rounded-full opacity-70"
        style={{
          background:
            "radial-gradient(circle, rgba(245,158,11,0.10) 0%, transparent 70%)",
        }}
      />

      {/* Identity + XP ring */}
      <div className="relative flex items-center gap-4 px-5 pb-4 pt-5">
        <ProfileAvatarWithRing
          initials={initials}
          progression={progression}
          animateIn={animateIn}
        />

        <div className="min-w-0 flex-1" style={tabEnterStyle(animateIn, 120)}>
          <p className="text-[18px] font-bold leading-tight text-white">{displayName}</p>
          {email && (
            <p className="mt-0.5 truncate text-[12px] text-zinc-500">{email}</p>
          )}
          <p className="mt-1 text-[12px] font-semibold text-[#9DA8FF]">
            {progression.title}
          </p>
          {!isMaxLevel && (
            <p className="mt-0.5 text-[11px] tabular-nums text-zinc-600">
              {progression.progressXP.toLocaleString()} /{" "}
              {(progression.nextLevelXP - progression.currentLevelXP).toLocaleString()} XP
            </p>
          )}
        </div>
      </div>

      {/* Daily goal — integrated */}
      <div
        className="mx-4 rounded-2xl px-4 py-3"
        style={{
          ...tabEnterStyle(animateIn, 200),
          background: dailyGoal.isComplete
            ? "rgba(0,198,198,0.08)"
            : "rgba(255,255,255,0.03)",
          border: dailyGoal.isComplete
            ? "1px solid rgba(0,198,198,0.22)"
            : "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">
              Daily market goal
            </p>
            <p className="mt-0.5 text-[13px] font-semibold text-white">
              {dailyGoal.isComplete
                ? "Goal complete — nice work"
                : `${dailyGoal.completedTasks}/${dailyGoal.totalTasks} tasks done`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="relative flex h-11 w-11 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#00C6C6 ${goalPct}%, rgba(255,255,255,0.08) 0)`,
              }}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold tabular-nums text-white"
                style={{ background: "rgba(8,9,14,0.92)" }}
              >
                {goalPct}%
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#00C6C6]">+15 XP</span>
          </div>
        </div>

        {!dailyGoal.isComplete && (
          <div className="mt-2.5 space-y-1.5">
            {dailyGoal.tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-2.5">
                {task.completed >= task.required ? (
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
            ))}
          </div>
        )}
      </div>

      {/* Streak strip */}
      <div className="mt-3 px-5 pb-4" style={tabEnterStyle(animateIn, 280)}>
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(251,146,60,0.28), rgba(234,88,12,0.12))",
              border: "1px solid rgba(251,146,60,0.22)",
            }}
          >
            <StreakFlameIcon size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-white">
              {streak.currentStreak === 0
                ? "Start your streak"
                : `${streak.currentStreak} day streak`}
            </p>
            <p className="text-[11px] text-zinc-500">
              {streak.currentStreak === 0
                ? "Complete today's goal to begin"
                : streak.goalCompletedToday
                  ? "Goal complete — back tomorrow"
                  : `Keep it alive · best ${streak.bestStreak} days`}
            </p>
          </div>
        </div>
        <div className="mt-2.5 flex justify-between">
          {streak.weeklyStrip.map(({ day, completed, isToday }) => (
            <div key={day} className="flex flex-col items-center gap-1">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{
                  backgroundColor: completed ? "rgba(245,158,11,0.85)" : "transparent",
                  border: isToday
                    ? `2px solid ${completed ? "rgba(245,158,11,1)" : "rgba(245,158,11,0.4)"}`
                    : completed
                      ? "none"
                      : "1.5px solid rgba(255,255,255,0.12)",
                }}
              >
                {completed && (
                  <Check className="h-3 w-3 text-black/80" strokeWidth={3} />
                )}
              </div>
              <span className="text-[9px] text-zinc-600">{day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly pulse */}
      <div
        className="border-t border-white/[0.06] px-5 py-3"
        style={{
          ...tabEnterStyle(animateIn, 360),
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">
          This week
        </p>
        {hasWeeklyActivity ? (
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
            <WeekStat value={weekly.articlesRead} label="Articles" />
            <WeekStat value={weekly.briefingsCompleted} label="Briefings" />
            <WeekStat value={weekly.xpEarned} label="XP earned" />
          </div>
        ) : (
          <p className="mt-1.5 text-[12px] text-zinc-500">
            Read your first story to start tracking the week.
          </p>
        )}
      </div>

      {/* Stats + joined */}
      <div className="border-t border-white/[0.06]" style={tabEnterStyle(animateIn, 440)}>
        <div className="grid grid-cols-3 divide-x divide-white/[0.06]">
          <HubStat label="Opened" value={String(articlesOpened)} />
          <HubStat label="Liked" value={String(likedCount)} />
          <HubStat label="Watchlist" value={String(watchlistCount)} />
        </div>
        {joined && (
          <div className="flex items-center gap-1.5 border-t border-white/[0.06] px-5 py-2.5">
            <Calendar className="h-3 w-3 shrink-0 text-zinc-700" />
            <p className="text-[11px] text-zinc-600">Joined {joined}</p>
            {isMaxLevel && (
              <span className="ml-auto text-[11px] tabular-nums text-zinc-600">
                {totalXP.toLocaleString()} lifetime XP
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function WeekStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[18px] font-bold tabular-nums text-white">{value}</span>
      <span className="text-[11px] text-zinc-500">{label}</span>
    </div>
  );
}

function HubStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center px-2 py-3.5">
      <p className="text-[20px] font-bold tabular-nums leading-none text-white">{value}</p>
      <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-zinc-600">
        {label}
      </p>
    </div>
  );
}
