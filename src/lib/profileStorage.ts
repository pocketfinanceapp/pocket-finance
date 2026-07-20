import type { NewsArticle } from "./types";

export const PROFILE_TOPICS = [
  "Tech",
  "Energy",
  "Crypto",
  "Markets",
  "Economy",
  "AI",
  "Healthcare",
  "Real Estate",
  "Commodities",
  "Banking",
] as const;

export type ProfileTopic = (typeof PROFILE_TOPICS)[number];

export const TOPIC_KEYWORDS: Record<ProfileTopic, string[]> = {
  Tech: ["technology", "software", "semiconductor"],
  Energy: ["energy", "oil", "gas"],
  Crypto: ["bitcoin", "crypto", "blockchain", "ethereum"],
  Markets: ["stocks", "market", "trading", "equities"],
  Economy: ["economy", "gdp", "inflation", "recession"],
  AI: ["artificial intelligence", "machine learning", "ai"],
  Healthcare: ["health", "pharma", "biotech", "drug"],
  "Real Estate": ["property", "housing", "real estate", "mortgage"],
  Commodities: ["gold", "silver", "commodities", "copper"],
  Banking: ["bank", "finance", "lending", "fed", "interest rate"],
};

export interface RecentlyReadEntry {
  id: string;
  headline: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  readAt: string;
}

const STREAK_KEY = "pocket-reading-streak";
export const PF_TOPICS_STORAGE_KEY = "pf-topics";
const TOPICS_KEY = PF_TOPICS_STORAGE_KEY;
export const PF_TOPICS_CHANGED_EVENT = "pf-topics-changed";
const RECENT_KEY = "pocket-recently-read";
const MAX_RECENT = 5;

interface StreakData {
  count: number;
  lastVisitDate: string;
  bestStreak?: number;
}

function localDateKey(date = new Date()): string {
  return date.toLocaleDateString("en-CA");
}

function yesterdayDateKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return localDateKey(d);
}

function loadStreakData(): StreakData {
  if (typeof window === "undefined") return { count: 0, lastVisitDate: "" };
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { count: 0, lastVisitDate: "" };
    const parsed = JSON.parse(raw) as StreakData;
    return {
      count: typeof parsed.count === "number" ? parsed.count : 0,
      lastVisitDate: parsed.lastVisitDate ?? "",
    };
  } catch {
    return { count: 0, lastVisitDate: "" };
  }
}

function saveStreakData(data: StreakData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STREAK_KEY, JSON.stringify(data));
}

/** Call once per app session to update consecutive-day streak */
export function recordAppVisit(): number {
  const today = localDateKey();
  const data = loadStreakData();

  if (data.lastVisitDate === today) {
    return data.count;
  }

  const count =
    data.lastVisitDate === yesterdayDateKey() ? data.count + 1 : 1;

  const bestStreak = Math.max(data.bestStreak ?? 0, count);
  saveStreakData({ count, lastVisitDate: today, bestStreak });
  return count;
}

/** Active streak — 0 if the user missed a day */
export function getReadingStreak(): number {
  const data = loadStreakData();
  const today = localDateKey();
  const yesterday = yesterdayDateKey();

  if (data.lastVisitDate === today || data.lastVisitDate === yesterday) {
    return data.count;
  }
  return 0;
}

const WEEK_STRIP_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;

/** SSR-safe stand-in for getLoginStreakState()'s return shape — matches
 * exactly what that function returns on the server (no localStorage access,
 * so all streak data is zeroed). Used to seed client state so the first
 * client render matches the server-rendered HTML; the real value is then
 * applied via an effect right after mount. Calling the real, localStorage-
 * reading function directly in a useState initializer caused a hydration
 * mismatch (React error #418) for any returning user, since it would
 * return real data on the client's first render but empty data on the
 * server's. */
export function getInitialLoginStreakState() {
  const dayIndex = (new Date().getDay() + 6) % 7;
  const weeklyStrip = WEEK_STRIP_LABELS.map((day, i) => ({
    day,
    completed: false,
    isToday: i === dayIndex,
  }));
  return {
    currentStreak: 0,
    bestStreak: 0,
    visitedToday: false,
    weeklyStrip,
  };
}

export function getLoginStreakState() {
  const data = loadStreakData();
  const today = localDateKey();
  const visitedToday = data.lastVisitDate === today;
  const currentStreak = getReadingStreak();
  const bestStreak = Math.max(data.bestStreak ?? 0, currentStreak);

  const todayDate = new Date();
  const dayIndex = (todayDate.getDay() + 6) % 7;
  const weeklyStrip = WEEK_STRIP_LABELS.map((day, i) => {
    const offset = i - dayIndex;
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const key = localDateKey(d);
    const completed =
      data.lastVisitDate === key ||
      (currentStreak > 0 &&
        visitedToday &&
        offset <= 0 &&
        offset > -currentStreak);
    return {
      day,
      completed,
      isToday: i === dayIndex,
    };
  });

  return {
    currentStreak,
    bestStreak,
    visitedToday,
    weeklyStrip,
  };
}

export function loadFavouriteTopics(): ProfileTopic[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TOPICS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return PROFILE_TOPICS.filter((t) => parsed.includes(t));
  } catch {
    return [];
  }
}

export function saveFavouriteTopics(topics: ProfileTopic[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOPICS_KEY, JSON.stringify(topics));
  window.dispatchEvent(new CustomEvent(PF_TOPICS_CHANGED_EVENT));
}

export function toggleFavouriteTopic(topic: ProfileTopic): ProfileTopic[] {
  const current = loadFavouriteTopics();
  const next = current.includes(topic)
    ? current.filter((t) => t !== topic)
    : [...current, topic];
  saveFavouriteTopics(next);
  return next;
}

export function loadRecentlyRead(): RecentlyReadEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentlyReadEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

export function addRecentlyRead(article: NewsArticle): void {
  if (typeof window === "undefined") return;

  const entry: RecentlyReadEntry = {
    id: article.id,
    headline: article.headline,
    sourceName: article.sourceName,
    sourceUrl: article.sourceUrl,
    publishedAt: article.publishedAt,
    readAt: new Date().toISOString(),
  };

  const withoutDup = loadRecentlyRead().filter((e) => e.id !== article.id);
  const next = [entry, ...withoutDup].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

// ---------------------------------------------------------------------------
// Profile avatar (local image, keyed by user id)
// ---------------------------------------------------------------------------

export const PF_AVATAR_CHANGED_EVENT = "pf-avatar-changed";

function avatarStorageKey(userId: string): string {
  return `pf-profile-avatar-${userId}`;
}

export function loadProfileAvatar(userId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(avatarStorageKey(userId));
  } catch {
    return null;
  }
}

export function saveProfileAvatar(userId: string, dataUrl: string | null): void {
  if (typeof window === "undefined") return;
  const key = avatarStorageKey(userId);
  if (!dataUrl) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, dataUrl);
  }
  window.dispatchEvent(new CustomEvent(PF_AVATAR_CHANGED_EVENT));
}

export function compressAvatarFile(
  file: File,
  maxSize = 256
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Invalid image"));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
