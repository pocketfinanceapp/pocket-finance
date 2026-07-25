"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  ChevronRight,
  Clock3,
  Heart,
  Settings,
  Sparkles,
  Tag,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import {
  PANEL_EXIT_MS,
  panelEnterStyle,
  tabEnterStyle,
  useTabEntered,
  useTabPageEntered,
} from "@/lib/tabEnterAnimation";
import { FadeInSection } from "./SubPageShell";
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
  getLifetimeArticlesOpened,
  getProgressionState,
  getSessionSnapshot,
  getTotalXP,
  getWeeklyActivity,
  type Achievement,
  type DailyGoalState,
  type LevelState,
  type WeeklyActivity,
} from "@/lib/progression";
import type { LikedArticleEntry, NewsArticle } from "@/lib/types";
import { fetchLikedArticles } from "@/lib/userInteractions";
import { buildWatchlistItems } from "@/lib/watchlistUtils";
import { getDismissedWatchlistTickers } from "@/lib/watchlistStore";
import { timeAgo } from "@/lib/utils";
import { MyTopicsSelector } from "./MyTopicsSelector";
import { ProfileAchievements } from "./ProfileAchievements";
import { ProfileArticlePreview } from "./ProfileArticlePreview";
import { ProfileIdentitySection } from "./ProfileIdentitySection";
import {
  ProfileActivitySection,
  ProfileProgressionHub,
} from "./ProfileProgressionHub";
import { ProfileProgressTabs } from "./ProfileProgressTabs";
import { AchievementIcon } from "./icons/AchievementIcon";
import { ScreenHeader } from "./ScreenHeader";
import { SubPageShell } from "./SubPageShell";
import { SettingsPage } from "./SettingsPage";

// ---------------------------------------------------------------------------
// Session-level flags (module-level → survive ProfilePage mount/unmount)
// ---------------------------------------------------------------------------

let _levelUpModalShownThisSession = false;
const _achievementToastsShownThisSession = new Set<string>();

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

const CARD_STYLE = "pf-card-surface overflow-hidden rounded-2xl";

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
  /** Article pool — used to derive the list of sources for Settings > News Sources */
  catalogArticles?: NewsArticle[];
}

type SettingsScreen = "main" | "liked" | "saved" | "topics";

export function ProfilePage({
  onClose,
  onSubPageChange,
  catalogArticles = [],
}: ProfilePageProps) {
  const {
    storiesRead,
    likedArticlesCount,
    savedArticles,
    followedTickers,
    reloadProfileStats,
  } = useApp();
  const { user, isGuest, requestSignIn } = useAuth();

  /* ── Sub-screen state ───────────────────────────────────────────────── */
  const [showSettings, setShowSettings] = useState(false);
  const [settingsScreen, setSettingsScreen] = useState<SettingsScreen>("main");
  const [showTopics, setShowTopics] = useState(false);
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [showAllRecentlyRead, setShowAllRecentlyRead] = useState(false);

  const isSubPage =
    showSettings || showTopics || showAllAchievements || showAllRecentlyRead;
  const profileEntered = useTabPageEntered("profile", !isSubPage);
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

  const refreshLocalProfile = useCallback(() => {
    setRecentlyRead(loadRecentlyRead());
    setSelectedTopics(loadFavouriteTopics());
  }, []);

  useEffect(() => {
    void reloadProfileStats();
    refreshLocalProfile();
  }, [reloadProfileStats, refreshLocalProfile]);

  // Saved preview derives directly from the live savedArticles list already
  // kept in AppContext (same source reloadSavedArticles/saveArticle write
  // to), instead of a separate one-shot fetch — previously this only ran
  // once on mount, so saving/unsaving an article elsewhere in the app while
  // Profile stayed mounted (or navigating back to it without a full
  // remount) left this list showing stale data.
  const savedPreview = useMemo(() => savedArticles.slice(0, 2), [savedArticles]);

  // Liked preview still needs its own fetch (AppContext only tracks a live
  // count + id set for liked articles, not the full title/url entries), but
  // now re-fetches whenever likedArticlesCount changes so it stays in sync
  // with likes/unlikes made elsewhere, not just on mount.
  useEffect(() => {
    if (!user?.id) return;
    fetchLikedArticles(user.id)
      .then((items) => setLikedPreview(items.slice(0, 2)))
      .catch(() => {});
  }, [user?.id, likedArticlesCount]);

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
  const weeklyActivity: WeeklyActivity = useMemo(
    () => getWeeklyActivity(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [likedArticlesCount, progressionTick]
  );
  const allAchievements = useMemo(
    () =>
      getAchievements({
        likedArticlesCount,
        savedArticlesCount: savedArticles.length,
        followedTickersCount: followedTickers.length,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [likedArticlesCount, savedArticles.length, followedTickers.length, progressionTick]
  );
  const uniqueArticlesOpened = useMemo(
    () => getLifetimeArticlesOpened(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [progressionTick]
  );

  /**
   * Watchlist count uses the same canonical deduplication as WatchlistPage:
   * group savedArticles by ticker, exclude dismissed tickers, count all items.
   */
  const watchlistCount = useMemo(() => {
    const dismissed = getDismissedWatchlistTickers();
    return buildWatchlistItems(savedArticles).filter(
      (item) => !dismissed.has(item.ticker)
    ).length;
  }, [savedArticles]);

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
      <div className="relative flex h-full min-h-0 flex-col pf-page bg-pocket-bg">
        <SettingsPage
          onBack={() => {
            setShowSettings(false);
            setSettingsScreen("main");
          }}
          initialScreen={settingsScreen}
          catalogArticles={catalogArticles}
        />
      </div>
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
      <div className="relative flex h-full min-h-0 flex-col pf-page bg-pocket-bg">
        <SubPageShell
          open
          title="Achievements"
          onClose={() => setShowAllAchievements(false)}
        >
          <ProfileAchievements
            likedArticlesCount={likedArticlesCount}
            savedArticlesCount={savedArticles.length}
            followedTickersCount={followedTickers.length}
          />
        </SubPageShell>
      </div>
    );
  }

  if (showAllRecentlyRead) {
    return (
      <div className="relative flex h-full min-h-0 flex-col pf-page bg-pocket-bg">
        <SubPageShell
          open
          title="Recently Read"
          onClose={() => setShowAllRecentlyRead(false)}
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
        </SubPageShell>
      </div>
    );
  }

  /* ── Guest state ──────────────────────────────────────────────────────── */

  if (isGuest && !user) {
    return (
      <div className="flex h-full min-h-0 flex-col pf-page bg-pocket-bg">
        <ProfileRootHeader onSettings={() => openSettings()} />
        <div className="relative flex flex-1 flex-col overflow-hidden px-5">
          <div className="pointer-events-none select-none blur-[2px] opacity-40">
            <ProfileProgressionHub
              progression={{
                level: 2,
                title: "News Reader",
                currentLevelXP: 100,
                nextLevelXP: 250,
                progressXP: 42,
                progressPercent: 28,
              }}
              totalXP={142}
              dailyGoal={{
                tasks: [
                  {
                    id: "read_articles",
                    label: "Read 3 articles",
                    required: 3,
                    completed: 1,
                  },
                  {
                    id: "complete_briefing",
                    label: "Finish 1 Pocket Briefing",
                    required: 1,
                    completed: 0,
                  },
                  {
                    id: "like_article",
                    label: "Like 1 article",
                    required: 1,
                    completed: 0,
                  },
                  {
                    id: "save_article",
                    label: "Save 1 article",
                    required: 1,
                    completed: 0,
                  },
                  {
                    id: "explore_stock",
                    label: "Open 1 stock panel",
                    required: 1,
                    completed: 0,
                  },
                ],
                totalTasks: 5,
                completedTasks: 0,
                isComplete: false,
                xpReward: 35,
              }}
              weekly={{
                articlesRead: 0,
                briefingsCompleted: 0,
                topicsExplored: 0,
                watchlistViewed: 0,
                xpEarned: 0,
                mostReadTopic: null,
              }}
              articlesOpened={0}
              likedCount={0}
              watchlistCount={0}
            />
          </div>
          <div className="mt-4 opacity-40 blur-[2px]">
            <ProfileProgressTabs
              progression={{
                level: 2,
                title: "News Reader",
                currentLevelXP: 100,
                nextLevelXP: 250,
                progressXP: 42,
                progressPercent: 28,
              }}
              totalXP={142}
              animateIn={false}
            />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            <p className="text-lg font-semibold text-pocket-text">Track your market mastery</p>
            <p className="mt-2 text-sm leading-relaxed text-pocket-muted">
              Sign in to earn XP, unlock achievements, and build your reading streak.
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

  /* ── Main profile dashboard ───────────────────────────────────────────── */

  return (
    <div className="relative flex h-full min-h-0 flex-col pf-page bg-pocket-bg">
      {/* Sticky root header */}
      <div style={tabEnterStyle(profileEntered, 0)}>
        <ProfileRootHeader onSettings={() => openSettings()} />
      </div>

      {/* Achievement toast (fixed at top) */}
      {currentToast && (
        <AchievementToast achievement={currentToast} onDone={handleToastDone} />
      )}

      {/* Scrollable content */}
      <div
        className="min-h-0 flex-1 overflow-y-auto px-5 pf-scroll"
        style={{ paddingBottom: "calc(9rem + env(safe-area-inset-bottom))" }}
      >
        {/* ── Identity (avatar + name) ──────────────────────────────────── */}
        {user && (
          <ProfileIdentitySection
            user={user}
            displayName={displayName}
            initials={initials}
            email={user.email}
            joined={joined}
            animateIn={profileEntered}
          />
        )}

        {/* ── Streak & Level tabs ──────────────────────────────────────── */}
        <div className="mt-4" style={tabEnterStyle(profileEntered, 100)}>
          <ProfileProgressTabs
            progression={progressionState}
            totalXP={totalXP}
            animateIn={profileEntered}
          />
        </div>

        {/* ── Your activity ────────────────────────────────────────────── */}
        <div className="mt-4" style={tabEnterStyle(profileEntered, 160)}>
          <ProfileActivitySection
            progression={progressionState}
            totalXP={totalXP}
            weekly={weeklyActivity}
            articlesOpened={uniqueArticlesOpened}
            likedCount={likedArticlesCount}
            watchlistCount={watchlistCount}
            animateIn={profileEntered}
            enterDelay={0}
          />
        </div>

        {/* ── Personalise feed ─────────────────────────────────────────── */}
        <section className="mt-4" style={tabEnterStyle(profileEntered, 280)}>
          <QuickActionRow
            icon={Tag}
            title="My topics"
            subtitle={
              selectedTopics.length === 0
                ? "Choose topics to personalise your For You feed"
                : `${selectedTopics.length} topic${selectedTopics.length === 1 ? "" : "s"} selected`
            }
            onClick={() => setShowTopics(true)}
          />
        </section>

        {/* ── Achievements ─────────────────────────────────────────────── */}
        <section className="mt-5" style={tabEnterStyle(profileEntered, 440)}>
          <ProfileAchievements
            likedArticlesCount={likedArticlesCount}
            savedArticlesCount={savedArticles.length}
            followedTickersCount={followedTickers.length}
            maxItems={3}
            onViewAll={() => setShowAllAchievements(true)}
          />
        </section>

        {/* ── Library (saved, liked, recently read) ────────────────────── */}
        {(savedPreview.length > 0 ||
          likedPreview.length > 0 ||
          recentlyReadPreview.length > 0) && (
          <section className="mt-5" style={tabEnterStyle(profileEntered, 520)}>
            <SectionHeader title="Your library" />
            <div className="mt-3 space-y-3">
              {savedPreview.length > 0 && (
                <LibraryGroup
                  title="Saved"
                  action="View all"
                  onAction={() => openSettings("saved")}
                >
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
                </LibraryGroup>
              )}

              {likedPreview.length > 0 && (
                <LibraryGroup
                  title="Liked"
                  action="View all"
                  onAction={() => openSettings("liked")}
                >
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
                </LibraryGroup>
              )}

              {recentlyReadPreview.length > 0 && (
                <LibraryGroup
                  title="Recently read"
                  action="View history"
                  onAction={() => setShowAllRecentlyRead(true)}
                >
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
                </LibraryGroup>
              )}
            </div>
          </section>
        )}

        {/* ── 10. Footer ───────────────────────────────────────────────── */}
        <p className="mt-10 text-center text-[11px] text-pocket-muted">
          Pocket Finance · Bold news. Smarter moves.
        </p>
      </div>

      {/* ── Level-up modal ─────────────────────────────────────────────── */}
      {levelUpData && (
        <LevelUpModal
          level={levelUpData.level}
          onDismiss={() => setLevelUpData(null)}
        />
      )}
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
  const [exiting, setExiting] = useState(false);
  const entered = useTabEntered(true);

  const handleBack = () => {
    setExiting(true);
    window.setTimeout(onBack, PANEL_EXIT_MS);
  };

  const handleSuggestion = (topic: ProfileTopic) => {
    toggleFavouriteTopic(topic);
    const updated = loadFavouriteTopics();
    setLiveTopics(updated);
    // Force MyTopicsSelector to re-read from localStorage so the new pill shows selected
    setReloadKey((k) => k + 1);
  };

  const showSuggestions = liveTopics.length === 0;

  return (
    <div
      className="absolute inset-0 z-20 flex h-full min-h-0 flex-col pf-page bg-pocket-bg"
      style={panelEnterStyle(entered && !exiting)}
    >
      <header
        className="flex shrink-0 flex-col border-b border-[var(--pocket-border)] px-4"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-pocket-muted">
          Pocket Finance
        </p>
        <div className="flex items-center justify-between pb-3 pt-1.5">
          <button
            type="button"
            data-no-drag
            onClick={handleBack}
            className="flex items-center gap-1.5 active:opacity-60"
          >
            <ArrowLeft className="h-5 w-5 text-pocket-muted" />
            <span className="text-[15px] font-semibold text-pocket-text">
              My Topics
            </span>
          </button>
          <button
            type="button"
            data-no-drag
            onClick={handleBack}
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
        <FadeInSection delayMs={80}>
        <p className="text-sm text-pocket-muted">
          Choose topics to personalise your For You feed.
        </p>
        <MyTopicsSelector
          showCount
          reloadKey={reloadKey}
          onTopicsChange={setLiveTopics}
        />

        {/* "Your feed" info card */}
        <div className="mt-5 rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)] p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#3B6EF5]/70" />
            <div>
              <p className="text-[13px] font-semibold text-pocket-text">Your feed</p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-pocket-muted">
                Selected topics shape your For You feed and help personalise
                your Companies recommendations.
              </p>
            </div>
          </div>
        </div>

        {/* Suggested topics prompt — only when nothing selected */}
        {showSuggestions && (
          <div className="mt-5">
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-pocket-muted">
              Suggested for you
            </p>
            <div className="flex gap-2">
              {SUGGESTED_TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  data-no-drag
                  onClick={() => handleSuggestion(topic)}
                  className="rounded-full border border-[var(--pocket-border)] bg-[var(--pocket-surface-hover)] px-3.5 py-2 text-[13px] font-medium text-pocket-muted active:opacity-60"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        )}
        </FadeInSection>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Level-up modal
// ---------------------------------------------------------------------------

function LevelUpModal({
  level,
  onDismiss,
}: {
  level: number;
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

        <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-pocket-muted">
          Level Up
        </p>
        <p className="mt-1.5 text-[22px] font-bold text-white">Level {level}</p>
        <p className="mt-2 text-[13px] leading-relaxed text-zinc-300">{desc}</p>

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
        className="pf-card-surface flex w-full max-w-sm items-center gap-3 rounded-2xl px-4 py-3 backdrop-blur-md"
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(59,110,245,0.22), rgba(0,198,198,0.16))",
            border: "1px solid rgba(0,198,198,0.22)",
            color: "#00C6C6",
          }}
        >
          <AchievementIcon id={achievement.id} size={20} unlocked />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-pocket-muted">
            Achievement Unlocked
          </p>
          <p className="text-[14px] font-bold text-pocket-text">{achievement.title}</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function ProfileRootHeader({
  onSettings,
}: {
  onSettings: () => void;
}) {
  return (
    <header
      className="pf-header-bar flex shrink-0 items-center border-b border-[var(--pocket-border)] bg-pocket-bg px-4 pb-3"
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      <div className="min-w-0 flex-1">
        <h1 className="text-[24px] font-black tracking-tight text-pocket-text">Profile</h1>
        <p className="mt-0.5 text-[14px] font-medium text-pocket-muted">
          Your progress, library, and preferences
        </p>
      </div>
      <button
        type="button"
        data-no-drag
        onClick={onSettings}
        className="flex h-11 w-11 items-center justify-center rounded-full active:bg-[var(--pocket-surface-hover)]"
        aria-label="Settings"
      >
        <Settings className="h-5 w-5 text-pocket-muted" />
      </button>
    </header>
  );
}

function QuickActionRow({
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-no-drag
      onClick={onClick}
      className={`${CARD_STYLE} flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-[var(--pocket-surface-hover)]`}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{
          background: "rgba(59,110,245,0.14)",
          border: "1px solid rgba(59,110,245,0.18)",
        }}
      >
        <Icon className="h-[18px] w-[18px] text-[#8BA8FF]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-pocket-text">{title}</p>
        <p className="mt-0.5 text-[12px] text-pocket-muted">{subtitle}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-pocket-muted" />
    </button>
  );
}

function LibraryGroup({
  title,
  action,
  onAction,
  children,
}: {
  title: string;
  action: string;
  onAction: () => void;
  children: React.ReactNode;
}) {
  const GroupIcon =
    title === "Saved" ? Bookmark : title === "Liked" ? Heart : Clock3;

  return (
    <div className={CARD_STYLE}>
      <div className="flex items-center justify-between border-b border-[var(--pocket-border)] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <GroupIcon className="h-3.5 w-3.5 text-pocket-muted" />
          <p className="text-[13px] font-semibold text-pocket-text">{title}</p>
        </div>
        <button
          type="button"
          data-no-drag
          onClick={onAction}
          className="text-[12px] font-semibold text-[#00C6C6] active:opacity-60"
        >
          {action}
        </button>
      </div>
      <div className="divide-y divide-[var(--pocket-border)]">{children}</div>
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
      <h3 className="text-[15px] font-bold text-pocket-text">{title}</h3>
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
      className={`${CARD_STYLE} divide-y divide-[var(--pocket-border)] ${className}`}
    >
      {children}
    </div>
  );
}
