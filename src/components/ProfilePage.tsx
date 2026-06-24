"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronRight,
  Settings,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import {
  loadFavouriteTopics,
  loadRecentlyRead,
  toggleFavouriteTopic,
  type ProfileTopic,
  type RecentlyReadEntry,
} from "@/lib/profileStorage";
import {
  getAchievements,
  getDailyGoalState,
  getProgressionState,
  getSessionSnapshot,
  getStreakState,
  getTotalXP,
  getUniqueArticlesOpened,
  getWeeklyActivity,
  type Achievement,
  type DailyGoalState,
  type LevelState,
  type StreakState,
  type WeeklyActivity,
} from "@/lib/progression";
import type { LikedArticleEntry, SavedArticleEntry } from "@/lib/types";
import { fetchLikedArticles, fetchSavedArticles } from "@/lib/userInteractions";
import { timeAgo } from "@/lib/utils";
import { MyTopicsSelector } from "./MyTopicsSelector";
import { ProfileAchievements } from "./ProfileAchievements";
import { ProfileArticlePreview } from "./ProfileArticlePreview";
import { ScreenHeader } from "./ScreenHeader";
import { SettingsPage } from "./SettingsPage";

// ---------------------------------------------------------------------------
// Session-level flags (module-level → survive ProfilePage mount/unmount)
// ---------------------------------------------------------------------------

let _levelUpModalShownThisSession = false;
const _achievementToastsShownThisSession = new Set<string>();

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

const CARD_STYLE = {
  backgroundColor: "rgba(10,11,16,0.97)" as const,
  border: "1px solid rgba(255,255,255,0.07)" as const,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,.04)" as const,
};

// ---------------------------------------------------------------------------
// Level-up description copy
// ---------------------------------------------------------------------------

const LEVEL_DESCRIPTIONS: Record<number, string> = {
  2: "You're building a solid reading habit — keep at it.",
  3: "You're exploring the markets with real depth.",
  4: "You're making serious progress as a market explorer.",
  5: "Elite-level insight. The markets are starting to talk.",
  6: "You think in portfolios. Truly impressive discipline.",
  7: "You've reached the pinnacle of market mastery.",
};

// ---------------------------------------------------------------------------
// ProfilePage
// ---------------------------------------------------------------------------

interface ProfilePageProps {
  onClose: () => void;
  /** Called when a sub-screen opens/closes so parent can hide/show bottom nav */
  onSubPageChange?: (isSubPage: boolean) => void;
}

type SettingsScreen = "main" | "liked" | "saved" | "topics";

export function ProfilePage({ onClose, onSubPageChange }: ProfilePageProps) {
  const { storiesRead, likedArticlesCount, savedArticles, reloadProfileStats } =
    useApp();
  const { user, isGuest, requestSignIn } = useAuth();

  /* ── Sub-screen state ───────────────────────────────────────────────── */
  const [showSettings, setShowSettings] = useState(false);
  const [settingsScreen, setSettingsScreen] = useState<SettingsScreen>("main");
  const [showTopics, setShowTopics] = useState(false);
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [showAllRecentlyRead, setShowAllRecentlyRead] = useState(false);

  const isSubPage =
    showSettings || showTopics || showAllAchievements || showAllRecentlyRead;
  useEffect(() => {
    onSubPageChange?.(isSubPage);
  }, [isSubPage, onSubPageChange]);

  /* ── Progression tick — incremented when pf-progression-updated fires ── */
  const [progressionTick, setProgressionTick] = useState(0);

  useEffect(() => {
    const handler = () => setProgressionTick((t) => t + 1);
    window.addEventListener("pf-progression-updated", handler);
    return () => window.removeEventListener("pf-progression-updated", handler);
  }, []);

  /* ── Data state ─────────────────────────────────────────────────────── */
  const [recentlyRead, setRecentlyRead] = useState<RecentlyReadEntry[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [likedPreview, setLikedPreview] = useState<LikedArticleEntry[]>([]);
  const [savedPreview, setSavedPreview] = useState<SavedArticleEntry[]>([]);

  const refreshLocalProfile = useCallback(() => {
    setRecentlyRead(loadRecentlyRead());
    setSelectedTopics(loadFavouriteTopics());
  }, []);

  useEffect(() => {
    void reloadProfileStats();
    refreshLocalProfile();
  }, [reloadProfileStats, refreshLocalProfile]);

  useEffect(() => {
    if (!user?.id) return;
    fetchLikedArticles(user.id)
      .then((items) => setLikedPreview(items.slice(0, 2)))
      .catch(() => {});
    fetchSavedArticles(user.id)
      .then((items) => setSavedPreview(items.slice(0, 2)))
      .catch(() => {});
  }, [user?.id]);

  /* ── Progression data (re-derived when Supabase data or activity changes) */
  const progressionState: LevelState = useMemo(
    () => getProgressionState(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [likedArticlesCount, storiesRead, progressionTick]
  );
  const totalXP = useMemo(
    () => getTotalXP(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [likedArticlesCount, storiesRead, progressionTick]
  );
  const dailyGoal: DailyGoalState = useMemo(
    () => getDailyGoalState(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [likedArticlesCount, progressionTick]
  );
  const streakState: StreakState = useMemo(
    () => getStreakState(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [likedArticlesCount, progressionTick]
  );
  const weeklyActivity: WeeklyActivity = useMemo(
    () => getWeeklyActivity(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [likedArticlesCount, progressionTick]
  );
  const allAchievements = useMemo(
    () => getAchievements({ likedArticlesCount }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [likedArticlesCount, progressionTick]
  );
  const uniqueArticlesOpened = useMemo(
    () => getUniqueArticlesOpened(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [progressionTick]
  );

  /* ── Level-up modal ─────────────────────────────────────────────────── */
  const [levelUpData, setLevelUpData] = useState<{
    level: number;
    title: string;
  } | null>(null);

  useEffect(() => {
    if (_levelUpModalShownThisSession) return;
    const snapshot = getSessionSnapshot();
    if (!snapshot) return;
    if (progressionState.level > snapshot.initialLevel) {
      setLevelUpData({ level: progressionState.level, title: progressionState.title });
      _levelUpModalShownThisSession = true;
    }
  }, [progressionState.level, progressionState.title]);

  /* ── Achievement unlock toasts ──────────────────────────────────────── */
  const [toastQueue, setToastQueue] = useState<Achievement[]>([]);
  const [currentToast, setCurrentToast] = useState<Achievement | null>(null);

  useEffect(() => {
    const snapshot = getSessionSnapshot();
    if (!snapshot) return;
    const initialIds = new Set(snapshot.initialUnlockedAchievementIds);
    const newlyUnlocked = allAchievements.filter(
      (a) =>
        a.unlocked &&
        !initialIds.has(a.id) &&
        !_achievementToastsShownThisSession.has(a.id)
    );
    if (newlyUnlocked.length === 0) return;
    setToastQueue((prev) => [...prev, ...newlyUnlocked]);
    for (const a of newlyUnlocked) _achievementToastsShownThisSession.add(a.id);
  }, [allAchievements]);

  // Process toast queue: 500ms gap between toasts
  useEffect(() => {
    if (currentToast !== null || toastQueue.length === 0) return;
    const timer = setTimeout(() => {
      setCurrentToast(toastQueue[0]);
      setToastQueue((prev) => prev.slice(1));
    }, 500);
    return () => clearTimeout(timer);
  }, [currentToast, toastQueue]);

  const handleToastDone = useCallback(() => {
    setCurrentToast(null);
  }, []);

  /* ── Settings helper ────────────────────────────────────────────────── */
  const openSettings = useCallback((screen: SettingsScreen = "main") => {
    setSettingsScreen(screen);
    setShowSettings(true);
  }, []);

  /* ── Sub-screens ──────────────────────────────────────────────────────── */

  if (showSettings) {
    return (
      <SettingsPage
        onBack={() => {
          setShowSettings(false);
          setSettingsScreen("main");
        }}
        initialScreen={settingsScreen}
      />
    );
  }

  if (showTopics) {
    const handleTopicsBack = () => {
      refreshLocalProfile();
      setShowTopics(false);
    };
    return (
      <TopicsSubPage
        initialTopics={selectedTopics as ProfileTopic[]}
        onBack={handleTopicsBack}
      />
    );
  }

  if (showAllAchievements) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-black">
        <ScreenHeader
          title="Achievements"
          onBack={() => setShowAllAchievements(false)}
        />
        <div
          className="min-h-0 flex-1 overflow-y-auto px-5 pt-4"
          style={{ paddingBottom: "calc(9rem + env(safe-area-inset-bottom))" }}
        >
          <ProfileAchievements
            likedArticlesCount={likedArticlesCount}
            showCategoryFilter
          />
        </div>
      </div>
    );
  }

  if (showAllRecentlyRead) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-black">
        <ScreenHeader
          title="Recently Read"
          onBack={() => setShowAllRecentlyRead(false)}
        />
        <div
          className="min-h-0 flex-1 overflow-y-auto px-5 pt-4"
          style={{ paddingBottom: "calc(9rem + env(safe-area-inset-bottom))" }}
        >
          <ArticleGroupCard>
            {recentlyRead.map((item) => (
              <ProfileArticlePreview
                key={item.id}
                title={item.headline}
                source={item.sourceName}
                timestamp={timeAgo(item.readAt)}
                href={item.sourceUrl}
                endIcon="link"
              />
            ))}
          </ArticleGroupCard>
        </div>
      </div>
    );
  }

  /* ── Guest state ──────────────────────────────────────────────────────── */

  if (isGuest && !user) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-black">
        <ProfileRootHeader onSettings={() => openSettings()} />
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <p className="text-lg font-semibold text-white">
            Sign in to your account
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Save articles, like stories, and sync your profile across devices.
          </p>
          <button
            type="button"
            onClick={requestSignIn}
            className="mt-8 rounded-2xl bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] px-8 py-3.5 text-sm font-bold text-white"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  /* ── Derived display values ───────────────────────────────────────────── */

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Investor";

  const initials = displayName.charAt(0).toUpperCase();

  const joined = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  const recentlyReadPreview = recentlyRead.slice(0, 3);

  const isMaxLevel = progressionState.level === 7;

  /* ── Main profile dashboard ───────────────────────────────────────────── */

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-black">
      {/* Sticky root header */}
      <ProfileRootHeader onSettings={() => openSettings()} />

      {/* Achievement toast (fixed at top) */}
      {currentToast && (
        <AchievementToast achievement={currentToast} onDone={handleToastDone} />
      )}

      {/* Scrollable content */}
      <div
        className="min-h-0 flex-1 overflow-y-auto px-5"
        style={{ paddingBottom: "calc(9rem + env(safe-area-inset-bottom))" }}
      >
        {/* ── 1. Identity card ──────────────────────────────────────────── */}
        <div
          className="relative mt-3 overflow-hidden rounded-2xl"
          style={{
            background:
              "linear-gradient(155deg, rgba(9,12,30,0.97) 0%, rgba(4,5,10,0.99) 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.04)",
          }}
        >
          {/* Ambient corner glow */}
          <div
            className="pointer-events-none absolute right-0 top-0 h-28 w-28"
            style={{
              background:
                "radial-gradient(circle at 85% 15%, rgba(124,108,248,0.10) 0%, transparent 70%)",
            }}
          />

          {/* Avatar + identity */}
          <div className="flex items-center gap-4 px-5 pb-4 pt-5">
            <div
              className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[14px] text-2xl font-bold text-white"
              style={{
                background:
                  "linear-gradient(135deg, rgba(59,110,245,0.70), rgba(0,198,198,0.50))",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.14), 0 2px 12px rgba(0,0,0,0.4)",
              }}
            >
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[18px] font-bold leading-tight text-white">
                {displayName}
              </p>
              <p className="mt-0.5 truncate text-[13px] text-zinc-400">
                {user?.email}
              </p>
              {/* Level title + badge */}
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-[12px] font-semibold text-zinc-400">
                  {progressionState.title}
                </span>
                <span
                  className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                  style={{
                    background: "linear-gradient(90deg, #7C6CF8, #5B8EF0)",
                  }}
                >
                  Lvl {progressionState.level}
                </span>
              </div>
            </div>
          </div>

          {/* XP progress section */}
          <div className="px-5 pb-4">
            {isMaxLevel ? (
              /* Max level: no bar, just lifetime XP + title */
              <p className="text-[12px] tabular-nums text-zinc-500">
                {totalXP.toLocaleString()} lifetime XP · {progressionState.title}
              </p>
            ) : (
              <>
                {/* Bar */}
                <div
                  className="overflow-hidden rounded-full"
                  style={{ height: 4, backgroundColor: "rgba(255,255,255,0.07)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${progressionState.progressPercent}%`,
                      background: "linear-gradient(90deg, #7C6CF8, #5B8EF0)",
                    }}
                  />
                </div>
                {/* XP label */}
                <div className="mt-1.5 flex items-baseline justify-between">
                  <p className="text-[11px] tabular-nums text-zinc-600">
                    {totalXP.toLocaleString()}&thinsp;/&thinsp;
                    {progressionState.nextLevelXP.toLocaleString()} XP
                  </p>
                  <p className="text-[11px] text-zinc-600">
                    {progressionState.nextLevelXP - totalXP} XP to{" "}
                    {LEVELS[progressionState.level + 1]?.title ?? "max"}
                  </p>
                </div>
              </>
            )}

            {/* Joined date */}
            {joined && (
              <div className="mt-2 flex items-center gap-1.5">
                <Calendar className="h-3 w-3 shrink-0 text-zinc-700" />
                <p className="text-[11px] text-zinc-600">Joined {joined}</p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-white/[0.06]" />

          {/* Stats row */}
          <div className="grid grid-cols-3 divide-x divide-white/[0.06]">
            <StatCell label="Articles Opened" value={String(uniqueArticlesOpened)} />
            <StatCell label="Liked" value={String(likedArticlesCount)} />
            <StatCell label="Watchlist" value={String(savedArticles.length)} />
          </div>
        </div>

        {/* ── 2. Today's Market Goal ────────────────────────────────────── */}
        <TodayGoalCard goal={dailyGoal} />

        {/* ── 3. Streak card ────────────────────────────────────────────── */}
        <StreakCard streakState={streakState} />

        {/* ── 4. Achievements preview (4 prioritised cards) ─────────────── */}
        <section className="mt-5">
          <ProfileAchievements
            likedArticlesCount={likedArticlesCount}
            maxItems={4}
            onViewAll={() => setShowAllAchievements(true)}
          />
        </section>

        {/* ── 5. Your Week ──────────────────────────────────────────────── */}
        <YourWeekCard weekly={weeklyActivity} />

        {/* ── 6. Saved articles preview ────────────────────────────────── */}
        {savedPreview.length > 0 && (
          <section className="mt-5">
            <SectionHeader
              title="Saved articles"
              action="View all"
              onAction={() => openSettings("saved")}
            />
            <ArticleGroupCard className="mt-3">
              {savedPreview.map((item) => (
                <ProfileArticlePreview
                  key={item.id}
                  title={item.articleTitle}
                  source={item.ticker}
                  ticker={item.ticker}
                  timestamp={timeAgo(item.savedAt)}
                  endIcon="chevron"
                  onClick={() => openSettings("saved")}
                />
              ))}
            </ArticleGroupCard>
          </section>
        )}

        {/* ── 7. Liked articles preview ────────────────────────────────── */}
        {likedPreview.length > 0 && (
          <section className="mt-5">
            <SectionHeader
              title="Liked articles"
              action="View all"
              onAction={() => openSettings("liked")}
            />
            <ArticleGroupCard className="mt-3">
              {likedPreview.map((item) => (
                <ProfileArticlePreview
                  key={item.id}
                  title={item.articleTitle}
                  source={item.ticker}
                  ticker={item.ticker}
                  timestamp={timeAgo(item.likedAt)}
                  endIcon="chevron"
                  onClick={() => openSettings("liked")}
                />
              ))}
            </ArticleGroupCard>
          </section>
        )}

        {/* ── 8. Recently Read ─────────────────────────────────────────── */}
        {recentlyReadPreview.length > 0 && (
          <section className="mt-5">
            <SectionHeader
              title="Recently read"
              action="View history"
              onAction={() => setShowAllRecentlyRead(true)}
            />
            <ArticleGroupCard className="mt-3">
              {recentlyReadPreview.map((item) => (
                <ProfileArticlePreview
                  key={item.id}
                  title={item.headline}
                  source={item.sourceName}
                  timestamp={timeAgo(item.readAt)}
                  href={item.sourceUrl}
                  endIcon="link"
                />
              ))}
            </ArticleGroupCard>
          </section>
        )}

        {/* ── 9. My Topics compact row ─────────────────────────────────── */}
        <section className="mt-5">
          <button
            type="button"
            data-no-drag
            onClick={() => setShowTopics(true)}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left active:bg-white/[0.05]"
            style={CARD_STYLE}
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{
                background: "rgba(59,110,245,0.15)",
                border: "1px solid rgba(59,110,245,0.20)",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(99,143,255,0.9)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-white">My Topics</p>
              {selectedTopics.length === 0 ? (
                <p className="mt-0.5 text-[12px] text-zinc-500">
                  Choose topics to personalise your Following feed.
                </p>
              ) : (
                <p className="mt-0.5 text-[12px] text-zinc-500">
                  {`Following ${selectedTopics.length} topic${selectedTopics.length === 1 ? "" : "s"}`}
                  {" · "}
                  {selectedTopics.slice(0, 3).join(", ")}
                  {selectedTopics.length > 3 ? "…" : ""}
                </p>
              )}
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600" />
          </button>
        </section>

        {/* ── 10. Footer ───────────────────────────────────────────────── */}
        <p className="mt-10 text-center text-[11px] text-zinc-700">
          Pocket Finance · Bold news. Smarter moves.
        </p>
      </div>

      {/* ── Level-up modal ─────────────────────────────────────────────── */}
      {levelUpData && (
        <LevelUpModal
          level={levelUpData.level}
          title={levelUpData.title}
          onDismiss={() => setLevelUpData(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Level titles lookup (same as LEVELS in progression.ts, kept here for display)
// ---------------------------------------------------------------------------

const LEVELS: Record<number, { title: string }> = {
  1: { title: "Market Starter" },
  2: { title: "News Reader" },
  3: { title: "Market Explorer" },
  4: { title: "Informed Investor" },
  5: { title: "Market Analyst" },
  6: { title: "Portfolio Thinker" },
  7: { title: "Market Strategist" },
};

// ---------------------------------------------------------------------------
// Today's Market Goal card
// ---------------------------------------------------------------------------

function TodayGoalCard({ goal }: { goal: DailyGoalState }) {
  return (
    <div
      className="mt-3 overflow-hidden rounded-2xl"
      style={{
        ...CARD_STYLE,
        border: goal.isComplete
          ? "1px solid rgba(0,198,198,0.25)"
          : "1px solid rgba(255,255,255,0.07)",
        boxShadow: goal.isComplete
          ? "inset 0 1px 0 rgba(0,198,198,0.08), 0 0 18px rgba(0,198,198,0.06)"
          : "inset 0 1px 0 rgba(255,255,255,.04)",
      }}
    >
      {goal.isComplete ? (
        /* Completed state */
        <div className="flex items-center gap-3 px-4 py-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: "rgba(0,198,198,0.12)",
              border: "1px solid rgba(0,198,198,0.22)",
            }}
          >
            <Check
              className="h-4 w-4"
              style={{ color: "#00C6C6" }}
              strokeWidth={2.5}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-white">
              Today&apos;s Market Goal
            </p>
            <p className="mt-0.5 text-[12px] text-zinc-500">
              You&apos;re caught up on today&apos;s markets.
            </p>
          </div>
          <span
            className="shrink-0 text-[12px] font-bold tabular-nums"
            style={{ color: "#00C6C6" }}
          >
            +15 XP
          </span>
        </div>
      ) : (
        /* Incomplete state */
        <div className="px-4 py-3">
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-[13px] font-bold text-white">
              Today&apos;s Market Goal
            </p>
            <span className="text-[11px] font-semibold text-zinc-500">
              +15 XP
            </span>
          </div>

          {goal.tasks.map((task, idx) => (
            <div
              key={task.id}
              className={`flex items-center gap-3 ${idx > 0 ? "mt-1.5" : ""}`}
            >
              {task.completed >= task.required ? (
                <div
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: "rgba(0,198,198,0.85)" }}
                >
                  <Check
                    className="h-3 w-3"
                    style={{ color: "rgba(0,0,0,0.85)" }}
                    strokeWidth={3}
                  />
                </div>
              ) : (
                <div
                  className="h-5 w-5 shrink-0 rounded-full"
                  style={{ border: "1.5px solid rgba(255,255,255,0.16)" }}
                />
              )}
              <p className="min-w-0 flex-1 text-[13px] text-zinc-300">
                {task.label}
              </p>
              <p className="shrink-0 text-[12px] tabular-nums text-zinc-500">
                {task.completed}&thinsp;/&thinsp;{task.required}
              </p>
            </div>
          ))}

          {/* 4 compact progress segments (3 for articles + 1 for briefing) */}
          <div className="mt-2 flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full"
                style={{
                  backgroundColor:
                    i < goal.tasks[0].completed
                      ? "#00C6C6"
                      : "rgba(255,255,255,0.08)",
                }}
              />
            ))}
            <div className="w-2" />
            <div
              className="h-1 flex-1 rounded-full"
              style={{
                backgroundColor:
                  goal.tasks[1].completed >= 1
                    ? "#00C6C6"
                    : "rgba(255,255,255,0.08)",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Streak card with weekly strip
// ---------------------------------------------------------------------------

function StreakCard({ streakState }: { streakState: StreakState }) {
  const {
    currentStreak,
    bestStreak,
    goalCompletedToday,
    weeklyStrip,
    nextMilestone,
  } = streakState;

  const subtitle =
    currentStreak === 0
      ? "Complete today's goal to begin."
      : goalCompletedToday
        ? "Goal complete — come back tomorrow!"
        : `Complete today's goal to keep your ${currentStreak}-day streak alive`;

  return (
    <div
      className="mt-3 overflow-hidden rounded-2xl"
      style={{
        background:
          "linear-gradient(135deg, rgba(22,13,5,0.97) 0%, rgba(8,7,6,0.99) 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "inset 0 1px 0 rgba(255,180,0,0.06)",
      }}
    >
      <div className="px-4 pb-3 pt-3">
        {/* Header row */}
        <div className="flex items-center gap-3">
          {/* Amber flame tile */}
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl leading-none"
            style={{
              background:
                "linear-gradient(135deg, rgba(251,146,60,0.30), rgba(234,88,12,0.16))",
              border: "1px solid rgba(251,146,60,0.22)",
            }}
          >
            🔥
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-bold leading-tight text-white">
              {currentStreak === 0 ? "Start your streak" : `${currentStreak} day streak`}
            </p>
            <p className="mt-0.5 text-[12px] leading-snug text-zinc-500">
              {subtitle}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-0.5">
            <p className="text-[10px] text-zinc-600">
              Best: {bestStreak} days
            </p>
            <p className="text-[10px] text-zinc-600">
              Next: {nextMilestone} days
            </p>
          </div>
        </div>

        {/* Mon–Sun weekly strip */}
        <div className="mt-2 flex justify-between">
          {weeklyStrip.map(({ day, completed, isToday }) => (
            <div key={day} className="flex flex-col items-center gap-1">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{
                  backgroundColor: completed
                    ? "rgba(245,158,11,0.85)"
                    : "transparent",
                  border: isToday
                    ? `2px solid ${completed ? "rgba(245,158,11,1.0)" : "rgba(245,158,11,0.40)"}`
                    : completed
                      ? "none"
                      : "1.5px solid rgba(255,255,255,0.12)",
                }}
              >
                {completed && (
                  <Check
                    className="h-3 w-3"
                    style={{ color: "rgba(0,0,0,0.80)" }}
                    strokeWidth={3}
                  />
                )}
              </div>
              <span className="text-[9px] text-zinc-600">{day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Your Week card
// ---------------------------------------------------------------------------

function YourWeekCard({ weekly }: { weekly: WeeklyActivity }) {
  // Only consider articles opened and briefings completed as qualifying activity;
  // XP from baseline/migration events should not falsely show an active week.
  const hasActivity = weekly.articlesRead > 0 || weekly.briefingsCompleted > 0;
  const displayXP = hasActivity ? weekly.xpEarned : 0;

  return (
    <div className="mt-5 overflow-hidden rounded-2xl" style={CARD_STYLE}>
      {hasActivity ? (
        /* Active: 3 headline metrics + topic insight */
        <div className="px-4 py-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-zinc-600">
            Your Week
          </p>
          <div className="flex items-baseline gap-6">
            <WeekMetric value={weekly.articlesRead} label="Articles" />
            <WeekMetric value={weekly.briefingsCompleted} label="Briefings" />
            <WeekMetric value={displayXP} label="XP" />
          </div>
          <p className="mt-2.5 text-[12px] leading-snug text-zinc-500">
            {weekly.mostReadTopic
              ? `${weekly.mostReadTopic} was your most-read topic.`
              : "Keep reading to discover your top topic."}
          </p>
        </div>
      ) : (
        /* Empty state */
        <div className="px-4 py-4">
          <p className="text-[13px] font-bold text-white">
            Your week is just getting started
          </p>
          <p className="mt-1 text-[12px] text-zinc-600">
            Read your first story to begin tracking this week.
          </p>
        </div>
      )}
    </div>
  );
}

function WeekMetric({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-[22px] font-bold tabular-nums text-white">
        {value}
      </span>
      <span className="text-[12px] text-zinc-500">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// My Topics subpage (extracted to manage its own live-topics state)
// ---------------------------------------------------------------------------

const SUGGESTED_TOPICS: ProfileTopic[] = ["Markets", "Tech", "Economy"];

function TopicsSubPage({
  initialTopics,
  onBack,
}: {
  initialTopics: ProfileTopic[];
  onBack: () => void;
}) {
  const [liveTopics, setLiveTopics] = useState<ProfileTopic[]>(initialTopics);
  const [reloadKey, setReloadKey] = useState(0);

  const handleSuggestion = (topic: ProfileTopic) => {
    toggleFavouriteTopic(topic);
    const updated = loadFavouriteTopics();
    setLiveTopics(updated);
    // Force MyTopicsSelector to re-read from localStorage so the new pill shows selected
    setReloadKey((k) => k + 1);
  };

  const showSuggestions = liveTopics.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col bg-black">
      <header
        className="flex shrink-0 flex-col border-b border-white/[0.06] px-4"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-600">
          Pocket Finance
        </p>
        <div className="flex items-center justify-between pb-3 pt-1.5">
          <button
            type="button"
            data-no-drag
            onClick={onBack}
            className="flex items-center gap-1.5 active:opacity-60"
          >
            <ArrowLeft className="h-5 w-5 text-zinc-400" />
            <span className="text-[15px] font-semibold text-white">
              My Topics
            </span>
          </button>
          <button
            type="button"
            data-no-drag
            onClick={onBack}
            className="text-[15px] font-semibold text-[#00C6C6] active:opacity-60"
          >
            Done
          </button>
        </div>
      </header>
      <div
        className="min-h-0 flex-1 overflow-y-auto px-5 pt-5"
        style={{ paddingBottom: "calc(9rem + env(safe-area-inset-bottom))" }}
      >
        <p className="text-sm text-zinc-400">
          Choose topics to personalise your Following feed.
        </p>
        <MyTopicsSelector
          showCount
          reloadKey={reloadKey}
          onTopicsChange={setLiveTopics}
        />

        {/* "Your feed" info card */}
        <div
          className="mt-5 rounded-2xl p-4"
          style={{
            background:
              "linear-gradient(135deg, rgba(10,18,50,0.85), rgba(6,10,28,0.90))",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#3B6EF5]/70" />
            <div>
              <p className="text-[13px] font-semibold text-white">Your feed</p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-zinc-500">
                Selected topics shape the Following tab and help personalise
                your Discover recommendations.
              </p>
            </div>
          </div>
        </div>

        {/* Suggested topics prompt — only when nothing selected */}
        {showSuggestions && (
          <div className="mt-5">
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
              Suggested for you
            </p>
            <div className="flex gap-2">
              {SUGGESTED_TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  data-no-drag
                  onClick={() => handleSuggestion(topic)}
                  className="rounded-full px-3.5 py-2 text-[13px] font-medium active:opacity-60"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.045)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    color: "rgba(161,161,170,1)",
                  }}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Level-up modal
// ---------------------------------------------------------------------------

function LevelUpModal({
  level,
  title,
  onDismiss,
}: {
  level: number;
  title: string;
  onDismiss: () => void;
}) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setEntered(true))
    );
    return () => cancelAnimationFrame(raf);
  }, []);

  const desc =
    LEVEL_DESCRIPTIONS[level] ??
    "You're making serious progress as a market explorer.";

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center px-5"
      style={{
        backgroundColor: "rgba(3,3,5,0.80)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-7 text-center"
        style={{
          background:
            "linear-gradient(155deg, rgba(12,14,30,0.99), rgba(4,5,10,0.99))",
          border: "1px solid rgba(124,108,248,0.28)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.06), 0 28px 56px rgba(0,0,0,0.65)",
          opacity: entered ? 1 : 0,
          transform: entered ? "scale(1)" : "scale(0.92)",
          transition: "opacity 300ms ease-out, transform 300ms ease-out",
        }}
      >
        {/* Level number tile */}
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-3xl font-bold text-white"
          style={{
            background: "linear-gradient(135deg, #7C6CF8, #5B8EF0)",
            boxShadow: "0 4px 20px rgba(124,108,248,0.45)",
          }}
        >
          {level}
        </div>

        <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          Level Up
        </p>
        <p className="mt-1.5 text-[22px] font-bold text-white">{title}</p>
        <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">{desc}</p>

        <button
          type="button"
          onClick={onDismiss}
          className="mt-6 w-full rounded-2xl py-3.5 text-[15px] font-bold text-white"
          style={{ background: "linear-gradient(90deg, #7C6CF8, #5B8EF0)" }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Achievement unlock toast
// ---------------------------------------------------------------------------

function AchievementToast({
  achievement,
  onDone,
}: {
  achievement: Achievement;
  onDone: () => void;
}) {
  const [entered, setEntered] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    const timer = setTimeout(() => onDoneRef.current(), 3000);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div
      className="absolute left-4 right-4 top-0 z-[60] flex justify-center"
      style={{
        paddingTop: "max(1rem, calc(env(safe-area-inset-top) + 0.5rem))",
        opacity: entered ? 1 : 0,
        transform: entered ? "translateY(0)" : "translateY(-8px)",
        transition: "opacity 250ms ease-out, transform 250ms ease-out",
        pointerEvents: "none",
      }}
    >
      <div
        className="flex w-full max-w-sm items-center gap-3 rounded-2xl px-4 py-3"
        style={{
          background: "rgba(10,11,16,0.97)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.55)",
          backdropFilter: "blur(12px)",
        }}
      >
        <span className="text-xl leading-none">{achievement.icon}</span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Achievement Unlocked
          </p>
          <p className="text-[14px] font-bold text-white">{achievement.title}</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function ProfileRootHeader({ onSettings }: { onSettings: () => void }) {
  return (
    <header
      className="flex shrink-0 items-center border-b border-white/[0.06] bg-black px-4 pb-2"
      style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
    >
      <h1 className="flex-1 text-lg font-bold text-white">Profile</h1>
      <button
        type="button"
        data-no-drag
        onClick={onSettings}
        className="flex h-11 w-11 items-center justify-center rounded-full active:bg-white/[0.08]"
        aria-label="Settings"
      >
        <Settings className="h-5 w-5 text-zinc-400" />
      </button>
    </header>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center px-3 py-4">
      <p className="text-[22px] font-bold tabular-nums leading-tight text-white">
        {value}
      </p>
      <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-zinc-600">
        {label}
      </p>
    </div>
  );
}

function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-[15px] font-bold text-white">{title}</h3>
      {action && (
        <button
          type="button"
          data-no-drag
          onClick={onAction}
          className="text-[12px] font-semibold text-[#00C6C6] active:opacity-60"
        >
          {action}
        </button>
      )}
    </div>
  );
}

function ArticleGroupCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`divide-y divide-white/[0.05] overflow-hidden rounded-2xl ${className}`}
      style={CARD_STYLE}
    >
      {children}
    </div>
  );
}
