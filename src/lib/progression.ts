/**
 * Core progression engine — activity log, XP, levels, daily goal, streak,
 * weekly activity, and achievements.
 * All persistence is via localStorage. No UI or routing dependencies.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActivityEventType =
  | "article_opened"
  | "briefing_completed"
  | "stock_panel_opened"
  | "article_saved"
  | "stock_watchlisted"
  | "article_liked"
  | "daily_goal_completed"
  | "achievement_unlocked";

export type ActivityEvent = {
  id: string;
  type: ActivityEventType;
  entityId: string;
  timestamp: number;
  localDate: string; // YYYY-MM-DD in local time
  metadata?: {
    articleId?: string;
    ticker?: string;
    category?: string; // article topic/category, captured at event time
  };
  xpAwarded: number; // 0 if rewardKey already used
  rewardKey?: string;
};

type ActivityStore = {
  version: 1;
  events: ActivityEvent[];
  usedRewardKeys: string[];
  cachedTotalXP: number;
};

export type ProgressionBaseline = {
  articlesRead: number;
  likedArticles: number;
  savedArticles: number;
  watchlistCount: number;
  importedXP: number;
  recordedAt: number;
  migrationVersion?: number;
};

type LevelDef = { level: number; title: string; xpRequired: number };

export type LevelState = {
  level: number;
  title: string;
  currentLevelXP: number;
  nextLevelXP: number;
  progressXP: number;
  progressPercent: number;
};

export type DailyGoalTask = {
  id:
    | "read_articles"
    | "complete_briefing"
    | "like_article"
    | "save_article"
    | "explore_stock";
  label: string;
  required: number;
  completed: number;
};

export type DailyGoalState = {
  tasks: DailyGoalTask[];
  totalTasks: number;
  completedTasks: number;
  isComplete: boolean;
  xpReward: number;
};

type StreakStore = { bestStreak: number };

export type StreakState = {
  currentStreak: number;
  bestStreak: number;
  lastCompletedDate: string | null;
  weeklyStrip: Array<{
    day: string;
    completed: boolean;
    isToday: boolean;
  }>;
  nextMilestone: number;
  goalCompletedToday: boolean;
};

export type WeeklyActivity = {
  articlesRead: number;
  briefingsCompleted: number;
  topicsExplored: number;
  watchlistViewed: number;
  xpEarned: number;
  mostReadTopic: string | null;
};

export type AchievementCategory =
  | "reading"
  | "markets"
  | "consistency"
  | "discovery"
  | "engagement";

export type Achievement = {
  id: string;
  category: AchievementCategory;
  title: string;
  description: string;
  howToUnlock: string;
  icon: string;
  progress: number;
  required: number;
  xpReward: number;
  unlocked: boolean;
};

export type SessionSnapshot = {
  initialLevel: number;
  initialUnlockedAchievementIds: string[];
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACTIVITY_STORE_KEY = "pf_activity_v1";
const BASELINE_KEY = "pf_baseline_v1";
const STREAK_STORE_KEY = "pf_streak_v1";

export const MAX_LEVEL = 100;

/** Named titles for early levels; higher levels use tier titles from getLevelTitle(). */
const NAMED_LEVEL_TITLES: Record<number, string> = {
  1: "Market Starter",
  2: "News Reader",
  3: "Market Explorer",
  4: "Informed Investor",
  5: "Market Analyst",
  6: "Portfolio Thinker",
  7: "Market Strategist",
};

/** XP threshold to reach a given level (level 1 = 0 XP). */
export function xpRequiredForLevel(level: number): number {
  const clamped = Math.max(1, Math.min(MAX_LEVEL, Math.floor(level)));
  if (clamped <= 1) return 0;

  const early: Record<number, number> = {
    2: 100,
    3: 250,
    4: 500,
    5: 1000,
    6: 2000,
    7: 4000,
  };
  if (clamped <= 7) return early[clamped] ?? 0;

  const n = clamped - 7;
  return Math.floor(4000 + n * 620 + n * n * 42);
}

export function getLevelTitle(level: number): string {
  const clamped = Math.max(1, Math.min(MAX_LEVEL, Math.floor(level)));
  if (NAMED_LEVEL_TITLES[clamped]) return NAMED_LEVEL_TITLES[clamped];
  if (clamped < 15) return "Market Apprentice";
  if (clamped < 25) return "Portfolio Builder";
  if (clamped < 40) return "Finance Enthusiast";
  if (clamped < 55) return "Market Insider";
  if (clamped < 70) return "Wealth Strategist";
  if (clamped < 85) return "Capital Master";
  if (clamped < 100) return "Market Veteran";
  return "Market Legend";
}

function buildLevelDef(level: number): LevelDef {
  return {
    level,
    title: getLevelTitle(level),
    xpRequired: xpRequiredForLevel(level),
  };
}

const XP_CONFIG: Record<ActivityEventType, number> = {
  article_opened: 8,
  briefing_completed: 12,
  stock_panel_opened: 6,
  article_saved: 5,
  stock_watchlisted: 8,
  article_liked: 6,
  daily_goal_completed: 35,
  achievement_unlocked: 0,
};

export const DAILY_GOAL_XP_REWARD = XP_CONFIG.daily_goal_completed;

/** Shown in UI — per-action XP values for motivation. */
export const XP_REWARDS = XP_CONFIG;

const STREAK_MILESTONES = [3, 7, 14, 30] as const;

const WEEK_DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ---------------------------------------------------------------------------
// In-memory session snapshot (never persisted)
// ---------------------------------------------------------------------------

let sessionSnapshot: SessionSnapshot | null = null;

// ---------------------------------------------------------------------------
// Storage helpers — activity store
// ---------------------------------------------------------------------------

function emptyStore(): ActivityStore {
  return { version: 1, events: [], usedRewardKeys: [], cachedTotalXP: 0 };
}

function loadStore(): ActivityStore {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = localStorage.getItem(ACTIVITY_STORE_KEY);
    if (!raw) return emptyStore();
    return JSON.parse(raw) as ActivityStore;
  } catch {
    return emptyStore();
  }
}

function saveStore(store: ActivityStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIVITY_STORE_KEY, JSON.stringify(store));
  } catch {
    /* storage blocked */
  }
}

// ---------------------------------------------------------------------------
// Storage helpers — baseline
// ---------------------------------------------------------------------------

function loadBaseline(): ProgressionBaseline | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(BASELINE_KEY);
    return raw ? (JSON.parse(raw) as ProgressionBaseline) : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Storage helpers — streak best score
// ---------------------------------------------------------------------------

function loadStreakStore(): StreakStore {
  if (typeof window === "undefined") return { bestStreak: 0 };
  try {
    const raw = localStorage.getItem(STREAK_STORE_KEY);
    return raw ? (JSON.parse(raw) as StreakStore) : { bestStreak: 0 };
  } catch {
    return { bestStreak: 0 };
  }
}

function saveStreakStore(s: StreakStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STREAK_STORE_KEY, JSON.stringify(s));
  } catch {
    /* storage blocked */
  }
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function getLocalDate(): string {
  const d = new Date();
  return formatLocalDate(d);
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Subtract one calendar day from a YYYY-MM-DD string. */
function subtractDay(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() - 1);
  return formatLocalDate(d);
}

/** Add N calendar days to a YYYY-MM-DD string. */
function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + n);
  return formatLocalDate(d);
}

/** YYYY-MM-DD of the Monday of the week containing today. */
function getCurrentMonday(): string {
  const d = new Date();
  const dow = d.getDay(); // 0=Sun, 1=Mon, …
  const diff = dow === 0 ? 6 : dow - 1; // days since Monday
  d.setDate(d.getDate() - diff);
  return formatLocalDate(d);
}

// ---------------------------------------------------------------------------
// Misc helpers
// ---------------------------------------------------------------------------

function getMostFrequent(arr: string[]): string | null {
  if (arr.length === 0) return null;
  const counts = new Map<string, number>();
  for (const s of arr) counts.set(s, (counts.get(s) ?? 0) + 1);
  let max = 0;
  let best: string | null = null;
  for (const [s, n] of counts) {
    if (n > max) {
      max = n;
      best = s;
    }
  }
  return best;
}

/** Check legacy achievements.ts flag without importing from that module. */
function hasLegacyStockViewed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("pf-first-stock-viewed") === "1";
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Reward key builder
// ---------------------------------------------------------------------------

function buildRewardKey(
  type: ActivityEventType,
  entityId: string,
  metadata?: ActivityEvent["metadata"]
): string {
  switch (type) {
    case "article_opened":
      return `article_opened:${metadata?.articleId ?? entityId}`;
    case "briefing_completed":
      return `briefing_completed:${metadata?.articleId ?? entityId}`;
    case "stock_panel_opened":
      return `stock_panel_opened:${metadata?.ticker ?? entityId}`;
    case "article_saved":
      return `article_saved:${metadata?.articleId ?? entityId}`;
    case "stock_watchlisted":
      return `stock_watchlisted:${metadata?.ticker ?? entityId}`;
    case "article_liked":
      return `article_liked:${metadata?.articleId ?? entityId}`;
    case "daily_goal_completed":
      return `daily_goal_completed:${entityId}`;
    case "achievement_unlocked":
      return `achievement_unlocked:${entityId}`;
  }
}

// ---------------------------------------------------------------------------
// Level calculation
// ---------------------------------------------------------------------------

export function calculateLevel(totalXP: number): LevelState {
  let idx = 0;
  for (let i = MAX_LEVEL - 1; i >= 0; i--) {
    if (totalXP >= xpRequiredForLevel(i + 1)) {
      idx = i;
      break;
    }
  }

  const currentLevel = buildLevelDef(idx + 1);
  const isMax = idx === MAX_LEVEL - 1;
  const nextLevel = isMax ? currentLevel : buildLevelDef(idx + 2);

  const currentLevelXP = currentLevel.xpRequired;
  const nextLevelXP = nextLevel.xpRequired;
  const progressXP = isMax ? 0 : totalXP - currentLevelXP;
  const rangeXP = isMax ? 1 : nextLevelXP - currentLevelXP;
  const progressPercent = isMax
    ? 100
    : Math.min(100, Math.round((progressXP / rangeXP) * 100));

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    currentLevelXP,
    nextLevelXP,
    progressXP,
    progressPercent,
  };
}

// ---------------------------------------------------------------------------
// Core public API — XP & events
// ---------------------------------------------------------------------------

/** Baseline importedXP + sum of all xpAwarded events. */
export function getTotalXP(): number {
  const baseline = loadBaseline();
  const store = loadStore();
  const importedXP = baseline?.importedXP ?? 0;
  const eventsXP = store.events.reduce((sum, e) => sum + e.xpAwarded, 0);
  return importedXP + eventsXP;
}

/**
 * Append a new activity event. XP is awarded only when the rewardKey has not
 * been used before. Every valid action records an event for analytics.
 * For article_opened and briefing_completed, also evaluates daily goal completion.
 */
export function recordActivityEvent(
  type: ActivityEventType,
  entityId: string,
  metadata?: ActivityEvent["metadata"]
): ActivityEvent {
  const store = loadStore();

  const rewardKey = buildRewardKey(type, entityId, metadata);
  const alreadyRewarded = store.usedRewardKeys.includes(rewardKey);
  const xpAwarded = alreadyRewarded ? 0 : XP_CONFIG[type];

  const event: ActivityEvent = {
    id:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    entityId,
    timestamp: Date.now(),
    localDate: getLocalDate(),
    metadata,
    xpAwarded,
    rewardKey,
  };

  store.events.push(event);

  if (!alreadyRewarded) {
    store.usedRewardKeys.push(rewardKey);
  }

  // Recalculate cached total
  const baseline = loadBaseline();
  const importedXP = baseline?.importedXP ?? 0;
  store.cachedTotalXP =
    importedXP + store.events.reduce((sum, e) => sum + e.xpAwarded, 0);

  saveStore(store);

  // Notify UI listeners that progression state may have changed
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("pf-progression-updated"));
  }

  // Evaluate daily goal after qualifying events
  if (
    type === "article_opened" ||
    type === "briefing_completed" ||
    type === "article_liked" ||
    type === "article_saved" ||
    type === "stock_panel_opened"
  ) {
    evaluateDailyGoalCompletion();
  }

  grantAchievementRewards();

  return event;
}

/**
 * Fire briefing XP only after briefing has fully generated AND the user has
 * viewed it for at least 10 seconds or scrolled to the end.
 * Do NOT call on panel open.
 */
export function markBriefingCompleted(articleId: string): ActivityEvent {
  return recordActivityEvent("briefing_completed", articleId, { articleId });
}

/** Award XP when a user likes an article (once per article). */
export function markArticleLiked(articleId: string): ActivityEvent {
  return recordActivityEvent("article_liked", articleId, { articleId });
}

/** Current level state derived from total XP. */
export function getProgressionState(): LevelState {
  return calculateLevel(getTotalXP());
}

/**
 * Count of unique articles genuinely opened since the progression system was
 * installed. Uses the deduplicated usedRewardKeys rather than the legacy
 * Supabase storiesRead counter (which inflates via feed-impression tracking).
 */
export function getUniqueArticlesOpened(): number {
  const store = loadStore();
  return store.usedRewardKeys.filter((k) => k.startsWith("article_opened:"))
    .length;
}

/**
 * Lifetime unique articles opened for display in the Profile identity card.
 * Mirrors the same calculation used by reading achievements in getAchievements():
 *   baseline.articlesRead  (historical opens before the activity log existed)
 *   + unique article_opened keys in usedRewardKeys  (new opens since log started)
 *
 * This avoids showing 0 for users who already had a reading history before the
 * activity log was introduced.
 */
export function getLifetimeArticlesOpened(): number {
  const baseline = loadBaseline();
  const store = loadStore();
  const uniqueOpenedInLog = store.usedRewardKeys.filter((k) =>
    k.startsWith("article_opened:")
  ).length;
  return (baseline?.articlesRead ?? 0) + uniqueOpenedInLog;
}

/** Full append-only event log. */
export function getActivityEvents(): ActivityEvent[] {
  return loadStore().events;
}

/** Events filtered to a single calendar day (YYYY-MM-DD). */
export function getActivityEventsForDate(localDate: string): ActivityEvent[] {
  return loadStore().events.filter((e) => e.localDate === localDate);
}

/**
 * Events for the Mon–Sun week starting on mondayDate (YYYY-MM-DD).
 * mondayDate must be a Monday; no validation is performed.
 */
export function getActivityEventsForWeek(mondayDate: string): ActivityEvent[] {
  const end = addDays(mondayDate, 6);
  return loadStore().events.filter(
    (e) => e.localDate >= mondayDate && e.localDate <= end
  );
}

// ---------------------------------------------------------------------------
// Daily goal
// ---------------------------------------------------------------------------

/**
 * Pure getter — no side effects, no localStorage writes.
 * Counts unique entities only; reopening the same article/briefing does not
 * inflate progress.
 */
export function getDailyGoalState(): DailyGoalState {
  const todayEvents = getActivityEventsForDate(getLocalDate());

  const uniqueArticlesRead = new Set(
    todayEvents
      .filter((e) => e.type === "article_opened")
      .map((e) => e.metadata?.articleId ?? e.entityId)
  ).size;

  const uniqueBriefingsDone = new Set(
    todayEvents
      .filter((e) => e.type === "briefing_completed")
      .map((e) => e.metadata?.articleId ?? e.entityId)
  ).size;

  const uniqueLikesToday = new Set(
    todayEvents
      .filter((e) => e.type === "article_liked")
      .map((e) => e.metadata?.articleId ?? e.entityId)
  ).size;

  const uniqueSavesToday = new Set(
    todayEvents
      .filter((e) => e.type === "article_saved")
      .map((e) => e.metadata?.articleId ?? e.entityId)
  ).size;

  const uniqueStocksToday = new Set(
    todayEvents
      .filter((e) => e.type === "stock_panel_opened")
      .map((e) => e.metadata?.ticker ?? e.entityId)
  ).size;

  const tasks: DailyGoalTask[] = [
    {
      id: "read_articles",
      label: "Read 3 articles",
      required: 3,
      completed: Math.min(uniqueArticlesRead, 3),
    },
    {
      id: "complete_briefing",
      label: "Finish 1 Pocket Briefing",
      required: 1,
      completed: Math.min(uniqueBriefingsDone, 1),
    },
    {
      id: "like_article",
      label: "Like 1 article",
      required: 1,
      completed: Math.min(uniqueLikesToday, 1),
    },
    {
      id: "save_article",
      label: "Save 1 article",
      required: 1,
      completed: Math.min(uniqueSavesToday, 1),
    },
    {
      id: "explore_stock",
      label: "Open 1 stock panel",
      required: 1,
      completed: Math.min(uniqueStocksToday, 1),
    },
  ];

  const completedTasks = tasks.filter(
    (t) => t.completed >= t.required
  ).length;
  const isComplete = completedTasks === tasks.length;

  return {
    tasks,
    totalTasks: tasks.length,
    completedTasks,
    isComplete,
    xpReward: DAILY_GOAL_XP_REWARD,
  };
}

/**
 * Check whether the daily goal is complete and, if so, record the
 * daily_goal_completed event (which awards bonus XP, once per day).
 * Never call inside a getter or render cycle — call after article_opened or
 * briefing_completed events have been persisted.
 */
export function evaluateDailyGoalCompletion(): void {
  const state = getDailyGoalState();
  if (!state.isComplete) return;

  const today = getLocalDate();
  const todayKey = `daily_goal_completed:${today}`;
  const store = loadStore();

  if (!store.usedRewardKeys.includes(todayKey)) {
    recordActivityEvent("daily_goal_completed", today);
  }
}

// ---------------------------------------------------------------------------
// Streak
// ---------------------------------------------------------------------------

/**
 * Compute the current streak length from a sorted (descending) list of
 * unique dates on which the daily goal was completed.
 */
function computeStreak(sortedDates: string[], today: string): number {
  if (sortedDates.length === 0) return 0;

  const yesterday = subtractDay(today);
  const mostRecent = sortedDates[0];

  // Streak is broken if the most recent completion was 2+ days ago
  if (mostRecent < yesterday) return 0;

  // Walk backwards counting consecutive days
  let streak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const expected = subtractDay(sortedDates[i - 1]);
    if (sortedDates[i] === expected) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function getStreakState(): StreakState {
  const store = loadStore();
  const today = getLocalDate();

  // All unique dates where daily goal was completed, sorted descending
  const completionDates = [
    ...new Set(
      store.events
        .filter((e) => e.type === "daily_goal_completed")
        .map((e) => e.entityId) // entityId is the localDate for this event type
    ),
  ].sort((a, b) => (a > b ? -1 : 1));

  const currentStreak = computeStreak(completionDates, today);
  const goalCompletedToday = completionDates[0] === today;

  // Update best streak if current exceeds stored best
  const streakStore = loadStreakStore();
  if (currentStreak > streakStore.bestStreak) {
    streakStore.bestStreak = currentStreak;
    saveStreakStore(streakStore);
  }
  const bestStreak = Math.max(streakStore.bestStreak, currentStreak);

  const lastCompletedDate = completionDates[0] ?? null;

  // Weekly strip: Mon–Sun of current week
  const monday = getCurrentMonday();
  const completionSet = new Set(completionDates);
  const weeklyStrip = WEEK_DAY_LABELS.map((day, i) => {
    const date = addDays(monday, i);
    return {
      day,
      completed: completionSet.has(date),
      isToday: date === today,
    };
  });

  const nextMilestone =
    STREAK_MILESTONES.find((m) => m > currentStreak) ??
    STREAK_MILESTONES[STREAK_MILESTONES.length - 1];

  return {
    currentStreak,
    bestStreak,
    lastCompletedDate,
    weeklyStrip,
    nextMilestone,
    goalCompletedToday,
  };
}

// ---------------------------------------------------------------------------
// Weekly activity
// ---------------------------------------------------------------------------

export function getWeeklyActivity(): WeeklyActivity {
  const monday = getCurrentMonday();
  const weekEvents = getActivityEventsForWeek(monday);

  const articlesRead = new Set(
    weekEvents
      .filter((e) => e.type === "article_opened")
      .map((e) => e.metadata?.articleId ?? e.entityId)
  ).size;

  const briefingsCompleted = new Set(
    weekEvents
      .filter((e) => e.type === "briefing_completed")
      .map((e) => e.metadata?.articleId ?? e.entityId)
  ).size;

  const categories = weekEvents
    .filter((e) => e.metadata?.category)
    .map((e) => e.metadata!.category!);
  const topicsExplored = new Set(categories).size;
  const mostReadTopic = getMostFrequent(categories);

  const watchlistViewed = new Set(
    weekEvents
      .filter((e) => e.type === "stock_panel_opened")
      .map((e) => e.metadata?.ticker ?? e.entityId)
  ).size;

  const xpEarned = weekEvents.reduce((sum, e) => sum + e.xpAwarded, 0);

  return {
    articlesRead,
    briefingsCompleted,
    topicsExplored,
    watchlistViewed,
    xpEarned,
    mostReadTopic,
  };
}

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------

export interface GetAchievementsOptions {
  /** Pass from AppContext likedArticlesCount (Supabase-sourced). Defaults to 0. */
  likedArticlesCount?: number;
}

/**
 * Derive all achievement progress purely from the activity log and baseline.
 * For liked articles, pass the count from Supabase via opts — no article_liked
 * event is emitted by the system.
 */
export function getAchievements(opts?: GetAchievementsOptions): Achievement[] {
  const store = loadStore();
  const baseline = loadBaseline();
  const likedCount = opts?.likedArticlesCount ?? 0;
  const totalXP = getTotalXP();

  // --- Article reads: baseline history + unique new opens in activity log ---
  const uniqueOpenedInLog = store.usedRewardKeys.filter((k) =>
    k.startsWith("article_opened:")
  ).length;
  const totalArticlesRead = (baseline?.articlesRead ?? 0) + uniqueOpenedInLog;

  // --- Briefings: unique all-time from log only ---
  const uniqueBriefings = store.usedRewardKeys.filter((k) =>
    k.startsWith("briefing_completed:")
  ).length;

  // --- Stock panels: unique tickers from log + legacy localStorage flag ---
  const uniqueStockPanelsInLog = store.usedRewardKeys.filter((k) =>
    k.startsWith("stock_panel_opened:")
  ).length;
  const hasAnyStockViewed =
    hasLegacyStockViewed() || uniqueStockPanelsInLog > 0;
  const totalStockPanels = uniqueStockPanelsInLog + (hasLegacyStockViewed() && uniqueStockPanelsInLog === 0 ? 1 : 0);

  // --- Watchlisted: baseline.watchlistCount + new tickers in log ---
  const newWatchlisted = store.usedRewardKeys.filter((k) =>
    k.startsWith("stock_watchlisted:")
  ).length;
  const totalWatchlisted = (baseline?.watchlistCount ?? 0) + newWatchlisted;

  // --- Saved articles: all article_saved keys in usedRewardKeys ---
  // Includes baseline-seeded keys + new saves, so no double-counting.
  const totalSaved = store.usedRewardKeys.filter((k) =>
    k.startsWith("article_saved:")
  ).length;

  // --- Topic diversity: unique categories across all time ---
  const allCategories = store.events
    .filter((e) => e.metadata?.category)
    .map((e) => e.metadata!.category!);
  const uniqueTopics = new Set(allCategories).size;

  // --- Streak (read once for consistency) ---
  const streak = getStreakState();
  const currentStreak = streak.currentStreak;

  const dailyGoalsCompleted = new Set(
    store.events
      .filter((e) => e.type === "daily_goal_completed")
      .map((e) => e.entityId)
  ).size;

  // Helper
  function make(
    id: string,
    category: AchievementCategory,
    title: string,
    description: string,
    howToUnlock: string,
    icon: string,
    progress: number,
    required: number,
    xpReward: number
  ): Achievement {
    return {
      id,
      category,
      title,
      description,
      howToUnlock,
      icon,
      progress: Math.min(progress, required),
      required,
      xpReward,
      unlocked: progress >= required,
    };
  }

  return [
    // Reading — easiest → hardest
    make(
      "news_regular",
      "reading",
      "News Regular",
      "Opened 10 articles",
      "Read 10 different articles from your feed — each unique open counts once.",
      "📰",
      totalArticlesRead,
      10,
      25
    ),
    make(
      "loyal_reader",
      "reading",
      "Loyal Reader",
      "Opened 25 articles",
      "Keep reading — 25 unique articles unlocks this badge.",
      "📖",
      totalArticlesRead,
      25,
      40
    ),
    make(
      "deep_reader",
      "reading",
      "Deep Reader",
      "Opened 50 articles",
      "Stay curious. Open 50 unique articles across any topic.",
      "📚",
      totalArticlesRead,
      50,
      60
    ),
    make(
      "on_fire",
      "reading",
      "On Fire",
      "Opened 75 articles",
      "Momentum matters — open 75 unique articles.",
      "🔥",
      totalArticlesRead,
      75,
      75
    ),
    make(
      "century_club",
      "reading",
      "Century Club",
      "Opened 100 articles",
      "A true habit — reach 100 unique articles opened.",
      "💯",
      totalArticlesRead,
      100,
      90
    ),
    make(
      "library_legend",
      "reading",
      "Library Legend",
      "Opened 250 articles",
      "Serious reader — 250 unique articles all time.",
      "📚",
      totalArticlesRead,
      250,
      130
    ),
    make(
      "news_obsessed",
      "reading",
      "News Obsessed",
      "Opened 500 articles",
      "Power-user status: 500 unique articles opened all time.",
      "🗞️",
      totalArticlesRead,
      500,
      180
    ),
    make(
      "marathon_reader",
      "reading",
      "Marathon Reader",
      "Opened 1,000 articles",
      "Elite dedication — 1,000 unique articles opened.",
      "🏅",
      totalArticlesRead,
      1000,
      300
    ),

    // Markets — easiest → hardest
    make(
      "market_watcher",
      "markets",
      "Market Watcher",
      "Viewed your first stock panel",
      "Tap a ticker on any article to open its stock panel.",
      "📈",
      hasAnyStockViewed ? 1 : 0,
      1,
      20
    ),
    make(
      "stock_follower",
      "markets",
      "Stock Follower",
      "Added a stock to your watchlist",
      "Save a ticker to your watchlist from a stock panel or article.",
      "⭐",
      totalWatchlisted,
      1,
      25
    ),
    make(
      "market_explorer",
      "markets",
      "Market Explorer",
      "Opened 5 different stock panels",
      "Explore 5 different tickers — each unique panel counts once.",
      "🔭",
      totalStockPanels,
      5,
      40
    ),
    make(
      "watchlist_builder",
      "markets",
      "Watchlist Builder",
      "Added 5 stocks to your watchlist",
      "Track the market — add 5 tickers to your watchlist.",
      "📋",
      totalWatchlisted,
      5,
      50
    ),
    make(
      "market_veteran",
      "markets",
      "Market Veteran",
      "Opened 15 different stock panels",
      "Deep dive into 15 unique tickers over time.",
      "🎯",
      totalStockPanels,
      15,
      70
    ),
    make(
      "ticker_hunter",
      "markets",
      "Ticker Hunter",
      "Opened 30 different stock panels",
      "Research mode — open 30 unique ticker panels.",
      "🔍",
      totalStockPanels,
      30,
      100
    ),
    make(
      "portfolio_architect",
      "markets",
      "Portfolio Architect",
      "Added 15 stocks to your watchlist",
      "Build a serious watchlist — track 15 tickers.",
      "🏗️",
      totalWatchlisted,
      15,
      120
    ),

    // Consistency — easiest → hardest
    make(
      "first_steps",
      "consistency",
      "First Steps",
      "Opened your first article",
      "Open any article from the home feed to get started.",
      "🌱",
      totalArticlesRead,
      1,
      15
    ),
    make(
      "streak_starter",
      "consistency",
      "Streak Starter",
      "Maintained a 1-day streak",
      "Complete today's daily goal to earn your first streak day.",
      "✨",
      currentStreak,
      1,
      20
    ),
    make(
      "rising_star",
      "consistency",
      "Rising Star",
      "Maintained a 3-day streak",
      "Finish every daily goal task for 3 days in a row.",
      "🌟",
      currentStreak,
      3,
      35
    ),
    make(
      "diamond_hands",
      "consistency",
      "Diamond Hands",
      "Maintained a 7-day streak",
      "Keep showing up — 7 consecutive days of completed daily goals.",
      "💎",
      currentStreak,
      7,
      55
    ),
    make(
      "daily_champion",
      "consistency",
      "Daily Champion",
      "Completed the daily goal 7 times",
      "Finish all 5 daily tasks on 7 separate days.",
      "🎖️",
      dailyGoalsCompleted,
      7,
      65
    ),
    make(
      "two_weeks_strong",
      "consistency",
      "Two Weeks Strong",
      "Maintained a 14-day streak",
      "Fourteen days straight of completed daily goals.",
      "🏃",
      currentStreak,
      14,
      80
    ),
    make(
      "monthly_investor",
      "consistency",
      "Monthly Investor",
      "Maintained a 30-day streak",
      "The ultimate habit — 30 consecutive days of daily goals.",
      "🏆",
      currentStreak,
      30,
      120
    ),
    make(
      "goal_machine",
      "consistency",
      "Goal Machine",
      "Completed the daily goal 30 times",
      "Crush your daily tasks on 30 separate days.",
      "⚙️",
      dailyGoalsCompleted,
      30,
      150
    ),
    make(
      "iron_will",
      "consistency",
      "Iron Will",
      "Maintained a 60-day streak",
      "Two months straight — 60 consecutive daily goals.",
      "🛡️",
      currentStreak,
      60,
      250
    ),
    make(
      "quarterly_devotee",
      "consistency",
      "Quarterly Devotee",
      "Maintained a 90-day streak",
      "Three months of unbroken daily goals.",
      "👑",
      currentStreak,
      90,
      400
    ),

    // Explore / discovery — easiest → hardest
    make(
      "first_briefing",
      "discovery",
      "First Briefing",
      "Completed your first Pocket Briefing",
      "Open any article and finish reading its Pocket Briefing summary.",
      "⚡",
      uniqueBriefings,
      1,
      20
    ),
    make(
      "topic_explorer",
      "discovery",
      "Topic Explorer",
      "Read articles across 3 topics",
      "Read stories from at least 3 different categories.",
      "🗺️",
      uniqueTopics,
      3,
      30
    ),
    make(
      "saver",
      "discovery",
      "Saver",
      "Saved 5 articles",
      "Bookmark 5 articles to read later.",
      "🔖",
      totalSaved,
      5,
      35
    ),
    make(
      "briefing_master",
      "discovery",
      "Briefing Master",
      "Completed 10 Pocket Briefings",
      "Finish reading 10 unique Pocket Briefing summaries.",
      "⚡",
      uniqueBriefings,
      10,
      50
    ),
    make(
      "topic_master",
      "discovery",
      "Topic Master",
      "Read articles across 8 topics",
      "Broaden your view — explore 8 different topics.",
      "🧭",
      uniqueTopics,
      8,
      60
    ),
    make(
      "super_saver",
      "discovery",
      "Super Saver",
      "Saved 20 articles",
      "Build your library — save 20 articles.",
      "📥",
      totalSaved,
      20,
      70
    ),
    make(
      "briefing_sage",
      "discovery",
      "Briefing Sage",
      "Completed 50 Pocket Briefings",
      "Master the summaries — finish 50 unique briefings.",
      "🧠",
      uniqueBriefings,
      50,
      120
    ),
    make(
      "polymath",
      "discovery",
      "Polymath",
      "Read articles across 12 topics",
      "True breadth — read from 12 different categories.",
      "🎓",
      uniqueTopics,
      12,
      100
    ),
    make(
      "archive_keeper",
      "discovery",
      "Archive Keeper",
      "Saved 50 articles",
      "Curate a deep library — save 50 articles.",
      "🗄️",
      totalSaved,
      50,
      110
    ),

    // Engagement — easiest → hardest
    make(
      "curator",
      "engagement",
      "Curator",
      "Liked 5 articles",
      "Tap the heart on 5 articles you enjoy.",
      "❤️",
      likedCount,
      5,
      25
    ),
    make(
      "heart_collector",
      "engagement",
      "Heart Collector",
      "Liked 20 articles",
      "Spread the love — like 20 articles total.",
      "💖",
      likedCount,
      20,
      45
    ),
    make(
      "market_analyst",
      "engagement",
      "Market Analyst",
      "Earned 500 XP",
      "Earn XP by reading, liking, saving, and completing daily goals.",
      "📊",
      totalXP,
      500,
      50
    ),
    make(
      "super_curator",
      "engagement",
      "Super Curator",
      "Liked 100 articles",
      "Share your taste — like 100 articles total.",
      "💝",
      likedCount,
      100,
      90
    ),
    make(
      "xp_hunter",
      "engagement",
      "XP Hunter",
      "Earned 1,000 XP",
      "Stay active — rack up 1,000 lifetime XP.",
      "🏅",
      totalXP,
      1000,
      75
    ),
    make(
      "portfolio_scholar",
      "engagement",
      "Portfolio Scholar",
      "Earned 2,000 XP",
      "Elite engagement — reach 2,000 lifetime XP.",
      "🎓",
      totalXP,
      2000,
      100
    ),
    make(
      "xp_titan",
      "engagement",
      "XP Titan",
      "Earned 5,000 XP",
      "Power user — accumulate 5,000 lifetime XP.",
      "⚡",
      totalXP,
      5000,
      200
    ),
    make(
      "xp_legend",
      "engagement",
      "XP Legend",
      "Earned 10,000 XP",
      "Top tier — reach 10,000 lifetime XP.",
      "🌟",
      totalXP,
      10000,
      350
    ),
  ];
}

/**
 * Award one-time XP for newly unlocked achievements. Safe to call repeatedly.
 * Runs in a short loop so cascading XP milestones unlock in one pass.
 */
export function grantAchievementRewards(
  opts?: GetAchievementsOptions
): void {
  if (typeof window === "undefined") return;

  let changed = false;

  for (let pass = 0; pass < 8; pass++) {
    const achievements = getAchievements(opts);
    const store = loadStore();
    let passChanged = false;

    for (const a of achievements) {
      if (!a.unlocked || a.xpReward <= 0) continue;

      const rewardKey = `achievement_unlocked:${a.id}`;
      if (store.usedRewardKeys.includes(rewardKey)) continue;

      const event: ActivityEvent = {
        id:
          typeof crypto !== "undefined" &&
          typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type: "achievement_unlocked",
        entityId: a.id,
        timestamp: Date.now(),
        localDate: getLocalDate(),
        xpAwarded: a.xpReward,
        rewardKey,
      };

      store.events.push(event);
      store.usedRewardKeys.push(rewardKey);
      passChanged = true;
    }

    if (!passChanged) break;

    const baseline = loadBaseline();
    const importedXP = baseline?.importedXP ?? 0;
    store.cachedTotalXP =
      importedXP + store.events.reduce((sum, e) => sum + e.xpAwarded, 0);
    saveStore(store);
    changed = true;
  }

  if (changed && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("pf-progression-updated"));
  }
}

// ---------------------------------------------------------------------------
// One-time baseline migration
// ---------------------------------------------------------------------------

export interface MigrateOptions {
  /** From Supabase user_stats (storiesRead). */
  articlesRead?: number;
  /** Saved articles from Supabase — used to seed reward keys. */
  savedArticles?: Array<{ id: string; articleId?: string }>;
  /** Watchlist tickers if tracked separately (legacy). */
  watchlistTickers?: string[];
}

/**
 * Run on app init before initSessionSnapshot().
 * Creates or upgrades the importedXP baseline to v2 (founding-bonus model).
 *
 * v1 (old): importedXP = articlesRead × 5 + savedArticles × 3 + watchlist × 5
 *           → destructive: pushed heavy readers to max level instantly.
 * v2 (new): importedXP = foundingBonus (150 if >10 articles, else 0)
 *                        + savedArticles × 3 + savedArticles × 5
 *           → watchlistCount is seeded from savedArticles (watchlist = saves in this app).
 *           → historical achievements (Deep Reader, Century Club) remain intact via raw articlesRead.
 *
 * Safe to call multiple times. Skips only if migrationVersion >= 2 already present.
 */
export function migrateActivityData(opts?: MigrateOptions): void {
  if (typeof window === "undefined") return;

  // Check existing baseline version
  let existingBaseline: ProgressionBaseline | null = null;
  try {
    const raw = localStorage.getItem(BASELINE_KEY);
    if (raw) existingBaseline = JSON.parse(raw) as ProgressionBaseline;
  } catch {
    // corrupt — re-migrate
  }

  // Already at v2 or later — no-op
  if (existingBaseline && (existingBaseline.migrationVersion ?? 1) >= 2) return;

  const articlesRead = opts?.articlesRead ?? 0;
  const savedArticlesArr = opts?.savedArticles ?? [];
  const savedCount = savedArticlesArr.length;
  const watchlistTickers = opts?.watchlistTickers ?? [];

  // v2 XP: flat founding bonus replaces articlesRead × 5
  const foundingBonus = articlesRead > 10 ? 150 : 0;
  // watchlistCount mirrors savedArticles (same concept in this app)
  const watchlistCount = savedCount;
  const importedXP = foundingBonus + savedCount * 3 + watchlistCount * 5;

  const baseline: ProgressionBaseline = {
    articlesRead,
    likedArticles: 0, // likes not rewarded retroactively
    savedArticles: savedCount,
    watchlistCount,
    importedXP,
    recordedAt: existingBaseline?.recordedAt ?? Date.now(),
    migrationVersion: 2,
  };

  try {
    localStorage.setItem(BASELINE_KEY, JSON.stringify(baseline));
  } catch {
    return;
  }

  // Seed usedRewardKeys for pre-existing saved articles (skip if key already present)
  const store = loadStore();
  const existingKeys = new Set(store.usedRewardKeys);

  for (const sa of savedArticlesArr) {
    const articleId = sa.articleId ?? sa.id;
    // Skip optimistic entries that have not yet been persisted to DB
    if (articleId && !articleId.startsWith("optimistic-")) {
      const key = `article_saved:${articleId}`;
      if (!existingKeys.has(key)) {
        store.usedRewardKeys.push(key);
        existingKeys.add(key);
      }
    }
  }

  for (const ticker of watchlistTickers) {
    const key = `stock_watchlisted:${ticker}`;
    if (!existingKeys.has(key)) {
      store.usedRewardKeys.push(key);
      existingKeys.add(key);
    }
  }

  // Recalculate cachedTotalXP against the corrected baseline
  store.cachedTotalXP =
    importedXP + store.events.reduce((sum, e) => sum + e.xpAwarded, 0);

  saveStore(store);
}

// ---------------------------------------------------------------------------
// Session snapshot
// ---------------------------------------------------------------------------

/**
 * Capture initial level and unlocked achievements in memory at app startup
 * (after migrateActivityData has run). Used for level-up and achievement-unlock
 * detection later in the session. Not persisted to localStorage.
 */
export function initSessionSnapshot(opts?: GetAchievementsOptions): void {
  const totalXP = getTotalXP();
  const { level } = calculateLevel(totalXP);
  const achievements = getAchievements(opts);
  const initialUnlockedAchievementIds = achievements
    .filter((a) => a.unlocked)
    .map((a) => a.id);
  sessionSnapshot = { initialLevel: level, initialUnlockedAchievementIds };
}

/** Returns the in-memory session snapshot, or null if not yet initialised. */
export function getSessionSnapshot(): SessionSnapshot | null {
  return sessionSnapshot;
}

/**
 * Placeholder for future store schema migrations.
 * Currently a no-op beyond what migrateActivityData handles.
 */
export function migrateStore(): void {
  // Future: migrate pf_activity_v1 → v2 if schema changes
}
