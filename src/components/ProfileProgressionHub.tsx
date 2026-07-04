"use client";

import { Check } from "lucide-react";
import { tabEnterStyle } from "@/lib/tabEnterAnimation";
import {
  DAILY_GOAL_XP_REWARD,
  MAX_LEVEL,
  XP_REWARDS,
  type DailyGoalState,
  type DailyGoalTask,
  type LevelState,
  type WeeklyActivity,
} from "@/lib/progression";

const CARD = "pf-card-surface overflow-hidden rounded-2xl";

interface ProfileProgressionHubProps {
  progression: LevelState;
  totalXP: number;
  dailyGoal: DailyGoalState;
  weekly: WeeklyActivity;
  articlesOpened: number;
  likedCount: number;
  watchlistCount: number;
  animateIn?: boolean;
  showActivity?: boolean;
  showDailyGoal?: boolean;
}

export function ProfileActivitySection({
  progression,
  totalXP,
  weekly,
  articlesOpened,
  likedCount,
  watchlistCount,
  animateIn = true,
  enterDelay = 120,
}: {
  progression: LevelState;
  totalXP: number;
  weekly: WeeklyActivity;
  articlesOpened: number;
  likedCount: number;
  watchlistCount: number;
  animateIn?: boolean;
  enterDelay?: number;
}) {
  const isMaxLevel = progression.level >= MAX_LEVEL;
  const hasWeeklyActivity =
    weekly.articlesRead > 0 || weekly.briefingsCompleted > 0;

  return (
    <section className={CARD} style={tabEnterStyle(animateIn, enterDelay)}>
      <div className="border-b border-[var(--pocket-border)] px-4 py-3.5">
        <h3 className="text-[16px] font-bold text-pocket-text">Your activity</h3>
      </div>
      <div className="grid grid-cols-3 divide-x divide-[var(--pocket-border)]">
        <StatTile label="Articles read" value={String(articlesOpened)} />
        <StatTile label="Liked" value={String(likedCount)} />
        <StatTile label="Watchlist" value={String(watchlistCount)} />
      </div>
      <div className="border-t border-[var(--pocket-border)] px-4 py-3.5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-pocket-muted">
          This week
        </p>
        {hasWeeklyActivity ? (
          <p className="mt-1.5 text-[14px] font-medium leading-relaxed text-pocket-muted">
            {weekly.articlesRead} articles · {weekly.briefingsCompleted}{" "}
            briefings · {weekly.xpEarned} XP earned
          </p>
        ) : (
          <p className="mt-1.5 text-[13px] text-zinc-500">
            Read a story to start tracking your week.
          </p>
        )}
        {isMaxLevel && (
          <p className="mt-2 text-[11px] tabular-nums text-zinc-600">
            {totalXP.toLocaleString()} lifetime XP
          </p>
        )}
      </div>
    </section>
  );
}

export function ProfileDailyGoalSection({
  dailyGoal,
  animateIn = true,
  enterDelay = 0,
}: {
  dailyGoal: DailyGoalState;
  animateIn?: boolean;
  enterDelay?: number;
}) {
  const goalPct = Math.round(
    (dailyGoal.completedTasks / dailyGoal.totalTasks) * 100
  );

  return (
    <section className={CARD} style={tabEnterStyle(animateIn, enterDelay)}>
      <div className="border-b border-white/[0.06] px-4 py-3">
        <h3 className="text-[14px] font-semibold text-white">Today&apos;s goal</h3>
        <p className="mt-0.5 text-[12px] text-zinc-500">
          {dailyGoal.isComplete
            ? `Nice work — +${DAILY_GOAL_XP_REWARD} XP earned`
            : `Complete all ${dailyGoal.totalTasks} tasks for +${DAILY_GOAL_XP_REWARD} XP`}
        </p>
      </div>

      <div className="px-4 py-4">
        <div className="flex items-start gap-3">
          <div
            className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(#00C6C6 ${goalPct}%, rgba(255,255,255,0.08) 0)`,
            }}
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold tabular-nums text-white"
              style={{ background: "var(--pocket-card-solid)" }}
            >
              {goalPct}%
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-white">
              {dailyGoal.isComplete
                ? "All done for today"
                : `${dailyGoal.completedTasks} of ${dailyGoal.totalTasks} complete`}
            </p>
            {!dailyGoal.isComplete && (
              <div className="mt-3 space-y-2.5">
                {dailyGoal.tasks.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProfileProgressionHub({
  progression,
  totalXP,
  dailyGoal,
  weekly,
  articlesOpened,
  likedCount,
  watchlistCount,
  animateIn = true,
  showActivity = true,
  showDailyGoal = true,
}: ProfileProgressionHubProps) {
  return (
    <div className="space-y-4">
      {showActivity && (
        <ProfileActivitySection
          progression={progression}
          totalXP={totalXP}
          weekly={weekly}
          articlesOpened={articlesOpened}
          likedCount={likedCount}
          watchlistCount={watchlistCount}
          animateIn={animateIn}
        />
      )}
      {showDailyGoal && (
        <ProfileDailyGoalSection dailyGoal={dailyGoal} animateIn={animateIn} />
      )}
    </div>
  );
}

function TaskRow({ task }: { task: DailyGoalTask }) {
  const done = task.completed >= task.required;
  const xpLabel =
    task.id === "read_articles"
      ? `+${XP_REWARDS.article_opened} each`
      : task.id === "complete_briefing"
        ? `+${XP_REWARDS.briefing_completed}`
        : task.id === "like_article"
          ? `+${XP_REWARDS.article_liked}`
          : task.id === "save_article"
            ? `+${XP_REWARDS.article_saved}`
            : `+${XP_REWARDS.stock_panel_opened}`;

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
      <span className="text-[10px] font-medium text-[#00C6C6]/80">{xpLabel}</span>
      <span className="text-[11px] tabular-nums text-zinc-600">
        {task.completed}/{task.required}
      </span>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center px-2 py-4">
      <p className="text-[26px] font-black tabular-nums leading-none text-pocket-text">
        {value}
      </p>
      <p className="mt-1.5 text-center text-[11px] font-semibold leading-tight text-pocket-muted">
        {label}
      </p>
    </div>
  );
}
