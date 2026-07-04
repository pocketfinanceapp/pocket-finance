"use client";

import { useEffect, useId, useState } from "react";
import { Flame, Sparkles } from "lucide-react";
import { StreakHeroIcon } from "@/components/icons/StreakHeroIcon";
import { getLoginStreakState } from "@/lib/profileStorage";
import { tabEnterStyle } from "@/lib/tabEnterAnimation";
import type { LevelState } from "@/lib/progression";

type ProgressTab = "streak" | "level";

interface ProfileProgressTabsProps {
  progression: LevelState;
  totalXP: number;
  animateIn?: boolean;
}

const CARD =
  "pf-card-surface overflow-hidden rounded-2xl";

export function ProfileProgressTabs({
  progression,
  totalXP,
  animateIn = true,
}: ProfileProgressTabsProps) {
  const uid = useId();
  const [tab, setTab] = useState<ProgressTab>("streak");
  const [panelPhase, setPanelPhase] = useState<"idle" | "exit" | "enter">("idle");
  const [loginStreak, setLoginStreak] = useState(() => getLoginStreakState());

  useEffect(() => {
    const sync = () => setLoginStreak(getLoginStreakState());
    sync();
    window.addEventListener("pf-progression-updated", sync);
    return () => window.removeEventListener("pf-progression-updated", sync);
  }, []);

  const switchTab = (next: ProgressTab) => {
    if (next === tab || panelPhase !== "idle") return;
    setPanelPhase("exit");
    window.setTimeout(() => {
      setTab(next);
      setPanelPhase("enter");
      window.setTimeout(() => setPanelPhase("idle"), 280);
    }, 220);
  };

  const panelClass =
    panelPhase === "exit"
      ? "pf-tab-panel-exit"
      : panelPhase === "enter"
        ? "pf-tab-panel-enter"
        : "";

  const isMaxLevel = progression.level === 7;
  const xpToNext = progression.nextLevelXP - progression.currentLevelXP;

  return (
    <section className={CARD} style={tabEnterStyle(animateIn, 80)}>
      <div className="flex border-b border-[var(--pocket-border)] p-1.5">
        <TabButton
          active={tab === "streak"}
          onClick={() => switchTab("streak")}
          icon={<Flame className="h-4 w-4" />}
          label="Streak"
        />
        <TabButton
          active={tab === "level"}
          onClick={() => switchTab("level")}
          icon={<Sparkles className="h-4 w-4" />}
          label="Level"
        />
      </div>

      <div className={`relative px-5 py-6 ${panelClass}`}>
        {tab === "streak" ? (
          <StreakPanel streak={loginStreak} uid={uid} />
        ) : (
          <LevelPanel
            progression={progression}
            totalXP={totalXP}
            isMaxLevel={isMaxLevel}
            xpToNext={xpToNext}
          />
        )}
      </div>
    </section>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      data-no-drag
      onClick={onClick}
      className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-bold transition-all duration-200 ${
        active
          ? "bg-[var(--pocket-surface-hover)] text-pocket-text shadow-sm"
          : "text-pocket-muted active:bg-[var(--pocket-surface-hover)]"
      }`}
    >
      <span className={active ? "text-[#FB923C]" : "text-pocket-muted"}>{icon}</span>
      {label}
    </button>
  );
}

function StreakPanel({
  streak,
  uid,
}: {
  streak: ReturnType<typeof getLoginStreakState>;
  uid: string;
}) {
  const active = streak.currentStreak > 0;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative pf-streak-hero-enter">
        <StreakHeroIcon
          uid={uid}
          active={active || streak.visitedToday}
          size={88}
          className="drop-shadow-[0_8px_24px_rgba(251,146,60,0.25)]"
        />
        {active && (
          <span
            className="absolute -bottom-1 -right-2 flex h-9 min-w-9 items-center justify-center rounded-2xl px-2 text-[18px] font-black tabular-nums text-white streak-badge-pop"
            style={{
              background: "linear-gradient(135deg, #FB923C, #EA580C)",
              boxShadow: "0 4px 14px rgba(234,88,12,0.45)",
            }}
          >
            {streak.currentStreak}
          </span>
        )}
      </div>

      <p className="mt-5 text-[56px] font-black leading-none tracking-tight text-pocket-text pf-streak-number-enter">
        {active ? streak.currentStreak : 0}
      </p>
      <p className="mt-1 text-[15px] font-bold uppercase tracking-[0.12em] text-[#FB923C]">
        day streak
      </p>
      <p className="mt-3 max-w-[260px] text-[14px] font-medium leading-relaxed text-pocket-muted">
        {streak.visitedToday
          ? active
            ? "You're on fire — come back tomorrow to keep it going."
            : "Welcome back. You're building a new streak."
          : "Open Pocket Finance today to start your streak."}
      </p>

      {streak.bestStreak > streak.currentStreak && (
        <p className="mt-3 text-[12px] font-semibold text-pocket-muted">
          Personal best: {streak.bestStreak} days
        </p>
      )}

      <div className="mt-6 flex w-full justify-between gap-1.5">
        {streak.weeklyStrip.map(({ day, completed, isToday }, index) => (
          <div key={day} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold transition-all ${
                completed
                  ? "bg-gradient-to-b from-amber-400 to-orange-500 text-black shadow-[0_0_12px_rgba(251,146,60,0.35)]"
                  : isToday
                    ? "border-2 border-amber-500/60 bg-[var(--pocket-surface-hover)] text-amber-500"
                    : "border border-[var(--pocket-border)] bg-[var(--pocket-card)] text-pocket-muted"
              }`}
              style={{ animationDelay: `${index * 40}ms` }}
            >
              {completed ? "✓" : isToday ? "•" : ""}
            </div>
            <span
              className={`text-[10px] font-semibold ${
                isToday ? "text-amber-500" : "text-pocket-muted"
              }`}
            >
              {day}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LevelPanel({
  progression,
  totalXP,
  isMaxLevel,
  xpToNext,
}: {
  progression: LevelState;
  totalXP: number;
  isMaxLevel: boolean;
  xpToNext: number;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="pf-level-badge-enter relative flex h-20 w-20 items-center justify-center rounded-[22px] bg-gradient-to-br from-[#7C6CF8] via-[#5B8EF0] to-[#00C6C6] shadow-[0_8px_28px_rgba(91,142,240,0.35)]">
        <span className="text-[34px] font-black tabular-nums text-white">
          {progression.level}
        </span>
      </div>

      <p className="mt-4 text-[13px] font-bold uppercase tracking-[0.14em] text-[#8BA8FF]">
        {progression.title}
      </p>
      <p className="mt-1 text-[42px] font-black leading-none tracking-tight text-pocket-text">
        Level {progression.level}
      </p>

      {!isMaxLevel ? (
        <div className="mt-5 w-full">
          <div className="mb-2 flex items-center justify-between text-[12px] font-semibold text-pocket-muted">
            <span>Progress to Level {progression.level + 1}</span>
            <span className="tabular-nums text-pocket-text">
              {progression.progressXP.toLocaleString()} / {xpToNext.toLocaleString()} XP
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[var(--pocket-surface-hover)]">
            <div
              className="pf-level-bar-fill h-full rounded-full bg-gradient-to-r from-[#7C6CF8] via-[#5B8EF0] to-[#00C6C6] transition-all duration-700"
              style={{ width: `${progression.progressPercent}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="mt-4 text-[14px] font-semibold tabular-nums text-pocket-muted">
          {totalXP.toLocaleString()} lifetime XP · Max level
        </p>
      )}
    </div>
  );
}
