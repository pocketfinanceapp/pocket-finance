import type { Comment } from "./types";
import { getUserInitials } from "./userIdentity";
import { loadProfileAvatar } from "./profileStorage";

const STORAGE_KEY = "pf_ticker_discussions_v2";
const LIKES_KEY = "pf_ticker_discussion_likes_v1";

interface StoredTickerComment {
  id: string;
  ticker: string;
  userId: string;
  username: string;
  avatarUrl?: string | null;
  text: string;
  createdAt: string;
  parentId?: string | null;
}

function loadAll(): StoredTickerComment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StoredTickerComment[];

    const legacy = window.localStorage.getItem("pf_ticker_discussions_v1");
    if (!legacy) return [];
    const parsed = JSON.parse(legacy) as Array<{
      id: string;
      ticker: string;
      username: string;
      text: string;
      createdAt: string;
      likes?: number;
    }>;
    const migrated: StoredTickerComment[] = parsed.map((item) => ({
      id: item.id,
      ticker: item.ticker,
      userId: "",
      username: item.username,
      text: item.text,
      createdAt: item.createdAt,
      parentId: null,
    }));
    persist(migrated);
    return migrated;
  } catch {
    return [];
  }
}

function persist(items: StoredTickerComment[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

function loadLikedIds(userId: string): Set<string> {
  if (typeof window === "undefined" || !userId) return new Set();
  try {
    const raw = window.localStorage.getItem(LIKES_KEY);
    if (!raw) return new Set();
    const map = JSON.parse(raw) as Record<string, string[]>;
    return new Set(map[userId] ?? []);
  } catch {
    return new Set();
  }
}

function persistLikedIds(userId: string, ids: Set<string>): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    const raw = window.localStorage.getItem(LIKES_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    map[userId] = [...ids];
    window.localStorage.setItem(LIKES_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function avatarColor(seed: string): string {
  const colors = ["#3B6EF5", "#00C6C6", "#22c55e", "#a855f7", "#ec4899"];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function toComment(item: StoredTickerComment, likedByUser: Set<string>): Comment {
  const avatarUrl =
    item.avatarUrl ?? (item.userId ? loadProfileAvatar(item.userId) : null);
  return {
    id: item.id,
    userId: item.userId || undefined,
    username: item.username,
    avatar: getUserInitials(item.username),
    avatarColor: avatarColor(item.username),
    avatarUrl,
    text: item.text,
    timeAgo: formatRelative(item.createdAt),
    parentId: item.parentId ?? null,
  };
}

export function fetchTickerDiscussion(
  ticker: string,
  currentUserId?: string
): Comment[] {
  const upper = ticker.toUpperCase();
  const likedByUser = currentUserId ? loadLikedIds(currentUserId) : new Set<string>();
  return loadAll()
    .filter((item) => item.ticker === upper)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((item) => toComment(item, likedByUser));
}

export function fetchTickerDiscussionLikeCounts(
  commentIds: string[]
): Map<string, number> {
  const counts = new Map<string, number>();
  if (typeof window === "undefined" || commentIds.length === 0) return counts;

  try {
    const raw = window.localStorage.getItem(LIKES_KEY);
    if (!raw) return counts;
    const map = JSON.parse(raw) as Record<string, string[]>;
    for (const ids of Object.values(map)) {
      for (const id of ids) {
        if (commentIds.includes(id)) {
          counts.set(id, (counts.get(id) ?? 0) + 1);
        }
      }
    }
  } catch {
    /* ignore */
  }
  return counts;
}

export function toggleTickerDiscussionLike(
  userId: string,
  commentId: string
): { liked: boolean; count: number } | null {
  if (!userId) return null;
  const liked = loadLikedIds(userId);
  const wasLiked = liked.has(commentId);
  if (wasLiked) liked.delete(commentId);
  else liked.add(commentId);
  persistLikedIds(userId, liked);

  const counts = fetchTickerDiscussionLikeCounts([commentId]);
  return {
    liked: !wasLiked,
    count: counts.get(commentId) ?? (wasLiked ? 0 : 1),
  };
}

export function postTickerDiscussion(
  ticker: string,
  text: string,
  username: string,
  userId: string,
  parentId?: string | null
): Comment | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const item: StoredTickerComment = {
    id: `td-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ticker: ticker.toUpperCase(),
    userId,
    username,
    avatarUrl: loadProfileAvatar(userId),
    text: trimmed,
    createdAt: new Date().toISOString(),
    parentId: parentId ?? null,
  };

  const next = [item, ...loadAll()];
  persist(next);

  return {
    ...toComment(item, new Set()),
    timeAgo: "just now",
  };
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export const CASHTAG_PATTERN = /\$([A-Z]{1,6})\b/g;

export function extractCashtags(text: string): string[] {
  const tags = new Set<string>();
  for (const match of text.matchAll(CASHTAG_PATTERN)) {
    tags.add(match[1]);
  }
  return [...tags];
}
