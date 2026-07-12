import type { Comment } from "./types";

const STORAGE_KEY = "pf_ticker_discussions_v1";

interface StoredTickerComment {
  id: string;
  ticker: string;
  username: string;
  text: string;
  createdAt: string;
  likes: number;
}

function loadAll(): StoredTickerComment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredTickerComment[]) : [];
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

export function fetchTickerDiscussion(ticker: string): Comment[] {
  const upper = ticker.toUpperCase();
  return loadAll()
    .filter((item) => item.ticker === upper)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((item) => ({
      id: item.id,
      username: item.username,
      avatar: item.username.slice(0, 2).toUpperCase(),
      avatarColor: "#00C6C6",
      text: item.text,
      timeAgo: formatRelative(item.createdAt),
    }));
}

export function postTickerDiscussion(
  ticker: string,
  text: string,
  username: string
): Comment | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const item: StoredTickerComment = {
    id: `td-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ticker: ticker.toUpperCase(),
    username,
    text: trimmed,
    createdAt: new Date().toISOString(),
    likes: 0,
  };

  const next = [item, ...loadAll()];
  persist(next);

  return {
    id: item.id,
    username: item.username,
    avatar: item.username.slice(0, 2).toUpperCase(),
    avatarColor: "#00C6C6",
    text: item.text,
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
