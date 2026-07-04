import type { Comment } from "@/lib/types";

export type ThreadComment = Comment & {
  likes: number;
  likedByMe: boolean;
  replies: ThreadComment[];
  parentId?: string | null;
  isPlaceholder?: boolean;
};

const LIKES_KEY = "pf_comment_likes_v1";
const REPLIES_KEY = "pf_comment_replies_v1";

const PLACEHOLDER_AUTHORS = [
  { name: "Alex Chen", color: "#3B6EF5" },
  { name: "Morgan Lee", color: "#00C6C6" },
  { name: "Jordan Park", color: "#a855f7" },
  { name: "Sam Rivera", color: "#22c55e" },
  { name: "Taylor Kim", color: "#ec4899" },
  { name: "Riley Brooks", color: "#f59e0b" },
  { name: "Casey Wu", color: "#6366f1" },
  { name: "Drew Patel", color: "#14b8a6" },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function makeComment(
  id: string,
  authorIdx: number,
  text: string,
  timeAgo: string,
  likes: number,
  replies: ThreadComment[] = []
): ThreadComment {
  const author = PLACEHOLDER_AUTHORS[authorIdx % PLACEHOLDER_AUTHORS.length];
  return {
    id,
    username: author.name,
    avatar: initials(author.name),
    avatarColor: author.color,
    text,
    timeAgo,
    likes,
    likedByMe: false,
    replies,
    isPlaceholder: true,
  };
}

/** Rich seeded placeholder threads — merged with live comments. */
function buildPlaceholderThreads(articleId: string): ThreadComment[] {
  const seed = articleId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const tickerHint = articleId.slice(-4).toUpperCase();

  return [
    makeComment(
      `ph-${articleId}-1`,
      seed % 8,
      "Earnings look solid but guidance was cautious — watching how the market reacts tomorrow.",
      "2h",
      12 + (seed % 6),
      [
        makeComment(
          `ph-${articleId}-1-r1`,
          (seed + 1) % 8,
          "Same here. The margin commentary was the real story.",
          "1h",
          4
        ),
        makeComment(
          `ph-${articleId}-1-r2`,
          (seed + 2) % 8,
          "Volume spike suggests institutions are repositioning.",
          "45m",
          2
        ),
      ]
    ),
    makeComment(
      `ph-${articleId}-2`,
      (seed + 3) % 8,
      `Anyone else adding ${tickerHint} exposure on this dip? Fundamentals still look intact to me.`,
      "4h",
      8 + (seed % 4),
      [
        makeComment(
          `ph-${articleId}-2-r1`,
          (seed + 4) % 8,
          "Scaling in slowly — macro headwinds aren't gone yet.",
          "3h",
          3
        ),
      ]
    ),
    makeComment(
      `ph-${articleId}-3`,
      (seed + 5) % 8,
      "Great breakdown in the briefing. The sector rotation angle is under-discussed.",
      "6h",
      15 + (seed % 5)
    ),
    makeComment(
      `ph-${articleId}-4`,
      (seed + 6) % 8,
      "Short-term noise, long-term thesis unchanged. Holding through volatility.",
      "8h",
      6
    ),
    makeComment(
      `ph-${articleId}-5`,
      (seed + 7) % 8,
      "Would love to see more detail on supply chain costs in the next update.",
      "12h",
      3,
      [
        makeComment(
          `ph-${articleId}-5-r1`,
          (seed + 1) % 8,
          "Management hinted at normalization on the call — worth re-reading.",
          "10h",
          5
        ),
        makeComment(
          `ph-${articleId}-5-r2`,
          (seed + 2) % 8,
          "Agreed. Transcript section on ops was the most useful part.",
          "9h",
          2
        ),
        makeComment(
          `ph-${articleId}-5-r3`,
          (seed + 3) % 8,
          "Saved this thread for my notes — thanks all.",
          "8h",
          1
        ),
      ]
    ),
  ];
}

function loadLikedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LIKES_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveLikedIds(ids: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LIKES_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

type StoredReply = {
  id: string;
  parentId: string;
  username: string;
  text: string;
  createdAt: number;
};

function loadStoredReplies(articleId: string): StoredReply[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(REPLIES_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as Record<string, StoredReply[]>;
    return all[articleId] ?? [];
  } catch {
    return [];
  }
}

function saveStoredReply(articleId: string, reply: StoredReply): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(REPLIES_KEY);
    const all: Record<string, StoredReply[]> = raw ? JSON.parse(raw) : {};
    all[articleId] = [reply, ...(all[articleId] ?? [])];
    localStorage.setItem(REPLIES_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

function mapApiComment(c: Comment): ThreadComment {
  return {
    ...c,
    likes: 0,
    likedByMe: false,
    replies: [],
    isPlaceholder: false,
  };
}

function applyLikes(comments: ThreadComment[], likedIds: Set<string>): void {
  for (const c of comments) {
    c.likedByMe = likedIds.has(c.id);
    if (c.likedByMe && c.likes === 0 && !c.isPlaceholder) {
      c.likes = 1;
    }
    applyLikes(c.replies, likedIds);
  }
}

function insertReplies(
  comments: ThreadComment[],
  stored: StoredReply[],
  displayName: string
): void {
  for (const r of stored) {
    const parent = findComment(comments, r.parentId);
    if (!parent) continue;
    parent.replies.unshift({
      id: r.id,
      username: r.username,
      avatar: initials(r.username),
      avatarColor: "#3B6EF5",
      text: r.text,
      timeAgo: "Just now",
      likes: 0,
      likedByMe: false,
      replies: [],
      parentId: r.parentId,
      isPlaceholder: false,
    });
  }
}

function findComment(
  comments: ThreadComment[],
  id: string
): ThreadComment | null {
  for (const c of comments) {
    if (c.id === id) return c;
    const nested = findComment(c.replies, id);
    if (nested) return nested;
  }
  return null;
}

export function buildDiscussionThread(
  articleId: string,
  apiComments: Comment[]
): ThreadComment[] {
  const live = apiComments.map(mapApiComment);
  const placeholders = buildPlaceholderThreads(articleId);
  const merged = [...live, ...placeholders];
  const likedIds = loadLikedIds();
  applyLikes(merged, likedIds);
  insertReplies(merged, loadStoredReplies(articleId), "");
  return merged;
}

export function toggleCommentLike(commentId: string): boolean {
  const likedIds = loadLikedIds();
  const nowLiked = !likedIds.has(commentId);
  if (nowLiked) likedIds.add(commentId);
  else likedIds.delete(commentId);
  saveLikedIds(likedIds);
  return nowLiked;
}

export function addCommentReply(
  articleId: string,
  parentId: string,
  text: string,
  displayName: string
): StoredReply {
  const reply: StoredReply = {
    id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    parentId,
    username: displayName,
    text: text.trim(),
    createdAt: Date.now(),
  };
  saveStoredReply(articleId, reply);
  return reply;
}

export function countThreadComments(comments: ThreadComment[]): number {
  return comments.reduce(
    (sum, c) => sum + 1 + countThreadComments(c.replies),
    0
  );
}

export function updateCommentLikeInTree(
  comments: ThreadComment[],
  commentId: string,
  liked: boolean
): ThreadComment[] {
  return comments.map((c) => {
    if (c.id === commentId) {
      const delta = liked ? (c.likedByMe ? 0 : 1) : c.likedByMe ? -1 : 0;
      return {
        ...c,
        likedByMe: liked,
        likes: Math.max(0, c.likes + delta),
      };
    }
    return {
      ...c,
      replies: updateCommentLikeInTree(c.replies, commentId, liked),
    };
  });
}

export function appendReplyToTree(
  comments: ThreadComment[],
  parentId: string,
  reply: ThreadComment
): ThreadComment[] {
  return comments.map((c) => {
    if (c.id === parentId) {
      return { ...c, replies: [reply, ...c.replies] };
    }
    return {
      ...c,
      replies: appendReplyToTree(c.replies, parentId, reply),
    };
  });
}

/** Parent comment ids from root down to (but not including) targetId. */
export function getAncestorIds(
  comments: ThreadComment[],
  targetId: string
): string[] {
  const path: string[] = [];

  function walk(list: ThreadComment[], ancestors: string[]): boolean {
    for (const c of list) {
      if (c.id === targetId) {
        path.push(...ancestors);
        return true;
      }
      if (walk(c.replies, [...ancestors, c.id])) return true;
    }
    return false;
  }

  walk(comments, []);
  return path;
}
