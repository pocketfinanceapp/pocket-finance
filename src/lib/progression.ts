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
  | "daily_goal_completed";

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

export type DailyGoalState = {
  tasks: [
    {
      id: "read_articles";
      label: "Read 3 articles";
      required: 3;
      completed: number;
    },
    {
      id: "complete_briefing";
      label: "Read 1 Pocket Briefing";
      required: 1;
      completed: number;
    },
  ];
  totalTasks: number;
  completedTasks: number;
  isComplete: boolean;
  xpReward: 15;
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
  icon: string;
  progress: number;
  required: number;
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

const LEVELS: LevelDef[] = [
  { level: 1, title: "Market Starter", xpRequired: 0 },
  { level: 2, title: "News Reader", xpRequired: 100 },
  { level: 3, title: "Market Explorer", xpRequired: 250 },
  { level: 4, title: "Informed Investor", xpRequired: 500 },
  { level: 5, title: "Market Analyst", xpRequired: 1000 },
  { level: 6, title: "Portfolio Thinker", xpRequired: 2000 },
  { level: 7, title: "Market Strategist", xpRequired: 4000 },
];

const XP_CONFIG: Record<ActivityEventType, number> = {
  article_opened: 5,
  briefing_completed: 8,
  stock_panel_opened: 4,
  article_saved: 3,
  stock_watchlisted: 5,
  daily_goal_completed: 15,
};

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
    case "daily_goal_completed":
      return `daily_goal_completed:${entityId}`;
  }
}

// ---------------------------------------------------------------------------
// Level calculation
// ---------------------------------------------------------------------------

export function calculateLevel(totalXP: number): LevelState {
  const maxIndex = LEVELS.length - 1;
  let idx = 0;
  for (let i = maxIndex; i >= 0; i--) {
    if (totalXP >= LEVELS[i].xpRequired) {
      idx = i;
      break;
    }
  }

  const currentLevel = LEVELS[idx];
  const isMax = idx === maxIndex;
  const nextLevel = isMax ? LEVELS[maxIndex] : LEVELS[idx + 1];

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

  // Evaluate daily goal after article_opened and briefing_completed events
  if (type === "article_opened" || type === "briefing_completed") {
    evaluateDailyGoalCompletion();
  }

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

  const readCompleted = Math.min(uniqueArticlesRead, 3);
  const briefingCompleted = Math.min(uniqueBriefingsDone, 1);

  const completedTasks =
    (readCompleted >= 3 ? 1 : 0) + (briefingCompleted >= 1 ? 1 : 0);
  const isComplete = completedTasks === 2;

  return {
    tasks: [
      {
        id: "read_articles",
        label: "Read 3 articles",
        required: 3,
        completed: readCompleted,
      },
      {
        id: "complete_briefing",
        label: "Read 1 Pocket Briefing",
        required: 1,
        completed: briefingCompleted,
      },
    ],
    totalTasks: 2,
    completedTasks,
    isComplete,
    xpReward: 15,
  };
}

/**
 * Check whether the daily goal is complete and, if so, record the
 * daily_goal_completed event (which awards 15 XP, once per day).
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

  // Helper
  function make(
    id: string,
    category: AchievementCategory,
    title: string,
    description: string,
    icon: string,
    progress: number,
    required: number
  ): Achievement {
    return {
      id,
      category,
      title,
      description,
      icon,
      progress: Math.min(progress, required),
      required,
      unlocked: progress >= required,
    };
  }

  return [
    // Reading
    make(
      "first_briefing",
      "discovery",
      "First Briefing",
      "Completed your first Pocket Briefing",
      "⚡",
      uniqueBriefings,
      1
    ),
    make(
      "news_regular",
      "reading",
      "News Regular",
      "Opened 10 articles",
      "📰",
      totalArticlesRead,
      10
    ),
    make(
      "deep_reader",
      "reading",
      "Deep Reader",
      "Opened 50 articles",
      "📚",
      totalArticlesRead,
      50
    ),
    make(
      "century_club",
      "reading",
      "Century Club",
      "Opened 100 articles",
      "💯",
      totalArticlesRead,
      100
    ),
    make(
      "news_obsessed",
      "reading",
      "News Obsessed",
      "Opened 500 articles",
      "🗞️",
      totalArticlesRead,
      500
    ),

    // Markets
    make(
      "market_watcher",
      "markets",
      "Market Watcher",
      "Viewed your first stock panel",
      "📈",
      hasAnyStockViewed ? 1 : 0,
      1
    ),
    make(
      "stock_follower",
      "markets",
      "Stock Follower",
      "Added a stock to your watchlist",
      "⭐",
      totalWatchlisted,
      1
    ),
    make(
      "market_explorer",
      "markets",
      "Market Explorer",
      "Opened 5 different stock panels",
      "🔭",
      totalStockPanels,
      5
    ),

    // Consistency
    make(
      "first_steps",
      "consistency",
      "First Steps",
      "Opened your first article",
      "🌱",
      totalArticlesRead,
      1
    ),
    make(
      "rising_star",
      "consistency",
      "Rising Star",
      "Maintained a 3-day streak",
      "🌟",
      currentStreak,
      3
    ),
    make(
      "diamond_hands",
      "consistency",
      "Diamond Hands",
      "Maintained a 7-day streak",
      "💎",
      currentStreak,
      7
    ),
    make(
      "two_weeks_strong",
      "consistency",
      "Two Weeks Strong",
      "Maintained a 14-day streak",
      "🏃",
      currentStreak,
      14
    ),
    make(
      "monthly_investor",
      "consistency",
      "Monthly Investor",
      "Maintained a 30-day streak",
      "🏆",
      currentStreak,
      30
    ),

    // Discovery
    make(
      "curator",
      "engagement",
      "Curator",
      "Liked 5 articles",
      "❤️",
      likedCount,
      5
    ),
    make(
      "topic_explorer",
      "discovery",
      "Topic Explorer",
      "Read articles across 3 topics",
      "🗺️",
      uniqueTopics,
      3
    ),
    make(
      "saver",
      "discovery",
      "Saver",
      "Saved 5 articles",
      "🔖",
      totalSaved,
      5
    ),

    // Engagement
    make(
      "market_analyst",
      "engagement",
      "Market Analyst",
      "Earned 500 XP",
      "📊",
      totalXP,
      500
    ),
    make(
      "on_fire",
      "engagement",
      "On Fire",
      "Opened 50 articles total",
      "🔥",
      totalArticlesRead,
      50
    ),
  ];
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
