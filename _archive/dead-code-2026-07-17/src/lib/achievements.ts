const PF_FIRST_STOCK_VIEWED_KEY = "pf-first-stock-viewed";
const PF_SEEN_BADGES_KEY = "pf-seen-badges";

export interface AchievementStats {
  articlesRead: number;
  likedCount: number;
  streak: number;
  firstStockViewed: boolean;
}

export interface AchievementBadge {
  id: string;
  emoji: string;
  name: string;
  progressHint: string;
  isUnlocked: (stats: AchievementStats) => boolean;
}

export const ACHIEVEMENT_BADGES: AchievementBadge[] = [
  {
    id: "first-steps",
    emoji: "🌱",
    name: "First Steps",
    progressHint: "Read 1 article",
    isUnlocked: (s) => s.articlesRead >= 1,
  },
  {
    id: "news-junkie",
    emoji: "🗞️",
    name: "News Junkie",
    progressHint: "Read 10 articles",
    isUnlocked: (s) => s.articlesRead >= 10,
  },
  {
    id: "on-fire",
    emoji: "🔥",
    name: "On Fire",
    progressHint: "Read 50 articles",
    isUnlocked: (s) => s.articlesRead >= 50,
  },
  {
    id: "market-watcher",
    emoji: "📈",
    name: "Market Watcher",
    progressHint: "View a stock panel",
    isUnlocked: (s) => s.firstStockViewed,
  },
  {
    id: "rising-star",
    emoji: "⭐",
    name: "Rising Star",
    progressHint: "3 day streak",
    isUnlocked: (s) => s.streak >= 3,
  },
  {
    id: "diamond-hands",
    emoji: "💎",
    name: "Diamond Hands",
    progressHint: "7 day streak",
    isUnlocked: (s) => s.streak >= 7,
  },
  {
    id: "market-expert",
    emoji: "🏆",
    name: "Market Expert",
    progressHint: "Read 100 articles",
    isUnlocked: (s) => s.articlesRead >= 100,
  },
  {
    id: "curator",
    emoji: "❤️",
    name: "Curator",
    progressHint: "Like 5 articles",
    isUnlocked: (s) => s.likedCount >= 5,
  },
];

export function markFirstStockViewed(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PF_FIRST_STOCK_VIEWED_KEY, "1");
  } catch {
    /* storage blocked */
  }
}

export function hasViewedStockPanel(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(PF_FIRST_STOCK_VIEWED_KEY) === "1";
  } catch {
    return false;
  }
}

export function loadSeenBadgeIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(PF_SEEN_BADGES_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function markBadgeSeen(badgeId: string): void {
  if (typeof window === "undefined") return;
  try {
    const seen = loadSeenBadgeIds();
    seen.add(badgeId);
    localStorage.setItem(PF_SEEN_BADGES_KEY, JSON.stringify([...seen]));
  } catch {
    /* storage blocked */
  }
}

export function getUnlockedBadgeIds(stats: AchievementStats): string[] {
  return ACHIEVEMENT_BADGES.filter((badge) => badge.isUnlocked(stats)).map(
    (badge) => badge.id
  );
}
