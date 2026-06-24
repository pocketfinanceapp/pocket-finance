/**
 * Core progression engine — append-only activity log, XP, and level system.
 * All persistence is via localStorage (no UI, no routing dependencies).
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
  id: string; // crypto.randomUUID()
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

type SessionSnapshot = {
  initialLevel: number;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACTIVITY_STORE_KEY = "pf_activity_v1";
const BASELINE_KEY = "pf_baseline_v1";

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

// ---------------------------------------------------------------------------
// In-memory session snapshot (never persisted)
// ---------------------------------------------------------------------------

let sessionSnapshot: SessionSnapshot | null = null;

// ---------------------------------------------------------------------------
// Storage helpers
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

function loadBaseline(): ProgressionBaseline | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(BASELINE_KEY);
    return raw ? (JSON.parse(raw) as ProgressionBaseline) : null;
  } catch {
    return null;
  }
}

function getLocalDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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
  const progressPercent = isMax ? 100 : Math.min(100, Math.round((progressXP / rangeXP) * 100));

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
// Public API
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
  return event;
}

/**
 * Fire briefing XP only after briefing has fully generated AND user has viewed
 * it for at least 10 seconds or scrolled to the end. Do NOT call on panel open.
 */
export function markBriefingCompleted(articleId: string): ActivityEvent {
  return recordActivityEvent("briefing_completed", articleId, { articleId });
}

/** Current level state derived from total XP. */
export function getProgressionState(): LevelState {
  return calculateLevel(getTotalXP());
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
  const monday = new Date(`${mondayDate}T00:00:00`);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const end = [
    sunday.getFullYear(),
    String(sunday.getMonth() + 1).padStart(2, "0"),
    String(sunday.getDate()).padStart(2, "0"),
  ].join("-");
  return loadStore().events.filter(
    (e) => e.localDate >= mondayDate && e.localDate <= end
  );
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
 * Run once on app init before initSessionSnapshot().
 * Reads existing user totals and creates a one-time importedXP baseline.
 * Seeds usedRewardKeys for all identifiable saved articles and watchlist tickers
 * so that re-saving or re-adding existing items does not award XP again.
 * Safe to call multiple times — exits immediately after the first run.
 */
export function migrateActivityData(opts?: MigrateOptions): void {
  if (typeof window === "undefined") return;

  try {
    if (localStorage.getItem(BASELINE_KEY)) return; // already migrated
  } catch {
    return;
  }

  const articlesRead = opts?.articlesRead ?? 0;
  const savedArticlesArr = opts?.savedArticles ?? [];
  const savedCount = savedArticlesArr.length;
  const watchlistTickers = opts?.watchlistTickers ?? [];
  const watchlistCount = watchlistTickers.length;

  const importedXP = articlesRead * 5 + savedCount * 3 + watchlistCount * 5;

  const baseline: ProgressionBaseline = {
    articlesRead,
    likedArticles: 0, // likes are not rewarded retroactively
    savedArticles: savedCount,
    watchlistCount,
    importedXP,
    recordedAt: Date.now(),
  };

  try {
    localStorage.setItem(BASELINE_KEY, JSON.stringify(baseline));
  } catch {
    return;
  }

  // Seed usedRewardKeys to prevent double-awarding for pre-existing items
  const store = loadStore();
  const existingKeys = new Set(store.usedRewardKeys);

  for (const sa of savedArticlesArr) {
    // Skip optimistic entries that haven't been persisted to DB yet
    const articleId = sa.articleId ?? sa.id;
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

  store.cachedTotalXP =
    importedXP + store.events.reduce((sum, e) => sum + e.xpAwarded, 0);

  saveStore(store);
}

// ---------------------------------------------------------------------------
// Session snapshot — level only (achievement snapshot added in Prompt 2)
// ---------------------------------------------------------------------------

/**
 * Capture initial level in memory on app startup (after migrateActivityData).
 * Used in future prompts for level-up detection. Not persisted to localStorage.
 */
export function initSessionSnapshot(): void {
  const totalXP = getTotalXP();
  const { level } = calculateLevel(totalXP);
  sessionSnapshot = { initialLevel: level };
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
