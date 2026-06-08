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

  saveStreakData({ count, lastVisitDate: today });
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

export function loadFavouriteTopics(): ProfileTopic[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TOPICS_KEY);
    if (!raw) {
      console.log("[pf-topics] read:", []);
      return [];
    }
    const parsed = JSON.parse(raw) as string[];
    const topics = PROFILE_TOPICS.filter((t) => parsed.includes(t));
    console.log("[pf-topics] read:", topics);
    return topics;
  } catch {
    console.log("[pf-topics] read:", []);
    return [];
  }
}

export function saveFavouriteTopics(topics: ProfileTopic[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOPICS_KEY, JSON.stringify(topics));
  console.log("[pf-topics] saved:", topics);
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
