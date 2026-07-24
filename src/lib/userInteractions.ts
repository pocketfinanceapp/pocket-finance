import { getSupabase } from "@/lib/supabase";
import { isDisallowedComment } from "@/lib/commentFilter";
import { loadProfileAvatar } from "@/lib/profileStorage";
import { resolveArticleTicker } from "@/lib/tickerMap";
import type {
  Comment,
  LikedArticleEntry,
  NewsArticle,
  SavedArticleEntry,
} from "@/lib/types";
import { timeAgo } from "@/lib/utils";

const AVATAR_COLORS = [
  "#3B6EF5",
  "#00C6C6",
  "#22c55e",
  "#a855f7",
  "#ec4899",
  "#f59e0b",
];

function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "PF";
}

// ---------------------------------------------------------------------------
// In-flight request dedup
//
// Multiple call sites can legitimately end up asking for the same user's
// data at nearly the same moment on page load (e.g. AppContext's initial
// sync plus a secondary auth event or another component's own reload call).
// Rather than chase down every such caller, collapse concurrent calls for
// the same (function, args) pair into a single underlying request — this is
// what actually stops duplicate Supabase queries from going out, regardless
// of which part of the app triggered the second call.
// ---------------------------------------------------------------------------
const inFlightRequests = new Map<string, Promise<unknown>>();

function dedupeRequest<T>(key: string, run: () => Promise<T>): Promise<T> {
  const existing = inFlightRequests.get(key);
  if (existing) return existing as Promise<T>;
  const promise = run().finally(() => {
    inFlightRequests.delete(key);
  });
  inFlightRequests.set(key, promise);
  return promise;
}

// ---------------------------------------------------------------------------
// User stats
// ---------------------------------------------------------------------------

export async function fetchUserStoriesRead(userId: string): Promise<number> {
  return dedupeRequest(`fetchUserStoriesRead:${userId}`, async () => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("user_stats")
      .select("stories_read")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("fetchUserStoriesRead:", error.message);
      return 0;
    }
    return data?.stories_read ?? 0;
  });
}

export async function setUserStoriesRead(
  userId: string,
  count: number
): Promise<boolean> {
  const supabase = getSupabase();
  const { error } = await supabase.from("user_stats").upsert(
    {
      user_id: userId,
      stories_read: count,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("setUserStoriesRead:", error.message);
    return false;
  }
  return true;
}

export async function incrementUserStoriesRead(
  userId: string
): Promise<number | null> {
  const supabase = getSupabase();
  const current = await fetchUserStoriesRead(userId);
  const next = current + 1;

  const { error } = await supabase.from("user_stats").upsert(
    {
      user_id: userId,
      stories_read: next,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("incrementUserStoriesRead:", error.message);
    return null;
  }
  return next;
}

export async function fetchUserLikedCount(userId: string): Promise<number> {
  return dedupeRequest(`fetchUserLikedCount:${userId}`, async () => {
    // Deliberately not `count: "exact", head: true` — that combination was
    // consistently returning 503s in production (verified live: every
    // other query on this table succeeded, only this HEAD+exact-count
    // shape failed, repeatedly, across several rounds of testing). A
    // per-user liked list is small, so a plain select + client-side
    // length is cheap and avoids whatever's wrong with the HEAD path.
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("liked_articles")
      .select("id")
      .eq("user_id", userId);

    if (error) {
      console.error("fetchUserLikedCount:", error.message);
      return 0;
    }
    return data?.length ?? 0;
  });
}

// ---------------------------------------------------------------------------
// Likes
// ---------------------------------------------------------------------------

export async function fetchLikeCount(articleId: string): Promise<number> {
  // See the comment on fetchUserLikedCount - the count:"exact", head:true
  // combination was the one query shape returning 503s in production, so
  // this uses the same plain-select-and-count-client-side approach.
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("liked_articles")
    .select("id")
    .eq("article_id", articleId);

  if (error) {
    console.error("fetchLikeCount:", error.message);
    return 0;
  }
  return data?.length ?? 0;
}

// The feed renders every card at once (no virtualization), so on a fresh
// load every FeedCard mounting at the same moment used to fire its own
// fetchLikeCount HEAD request - dozens of concurrent count queries against
// the same table, which is what was tripping the intermittent 503s. This
// batched version fetches counts for a whole page of articles in a single
// query (client-side tally instead of N separate count=exact HEAD calls),
// paired with the debounced request queue in AppContext.ensureLikeCountsLoaded.
export async function fetchLikeCounts(
  articleIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (articleIds.length === 0) return counts;
  for (const id of articleIds) counts.set(id, 0);

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("liked_articles")
    .select("article_id")
    .in("article_id", articleIds);

  if (error) {
    console.error("fetchLikeCounts:", error.message);
    return counts;
  }
  for (const row of data ?? []) {
    counts.set(row.article_id, (counts.get(row.article_id) ?? 0) + 1);
  }
  return counts;
}

export async function fetchUserLikedArticleIds(
  userId: string
): Promise<Set<string>> {
  return dedupeRequest(`fetchUserLikedArticleIds:${userId}`, async () => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("liked_articles")
      .select("article_id")
      .eq("user_id", userId);

    if (error) {
      console.error("fetchUserLikedArticleIds:", error.message);
      return new Set<string>();
    }
    return new Set((data ?? []).map((r) => r.article_id));
  });
}

export async function likeArticle(
  userId: string,
  article: NewsArticle
): Promise<boolean> {
  const supabase = getSupabase();
  const { error } = await supabase.from("liked_articles").insert({
    user_id: userId,
    article_id: article.id,
    article_title: article.headline,
    article_url: article.sourceUrl,
    ticker: resolveArticleTicker(article),
  });

  if (error) {
    console.error("likeArticle:", error.message);
    return false;
  }
  return true;
}

export async function unlikeArticle(
  userId: string,
  articleId: string
): Promise<boolean> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("liked_articles")
    .delete()
    .eq("user_id", userId)
    .eq("article_id", articleId);

  if (error) {
    console.error("unlikeArticle:", error.message);
    return false;
  }
  return true;
}

export async function fetchLikedArticles(
  userId: string
): Promise<LikedArticleEntry[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("liked_articles")
    .select("id, article_id, article_title, article_url, ticker, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchLikedArticles:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    articleId: row.article_id,
    articleTitle: row.article_title,
    articleUrl: row.article_url,
    ticker: row.ticker,
    likedAt: row.created_at,
  }));
}

// ---------------------------------------------------------------------------
// Saved articles (watchlist)
// ---------------------------------------------------------------------------

export async function fetchSavedArticles(
  userId: string
): Promise<SavedArticleEntry[]> {
  return dedupeRequest(`fetchSavedArticles:${userId}`, async () => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("saved_articles")
      .select("id, article_id, article_title, article_url, ticker, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("fetchSavedArticles:", error.message);
      return [];
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      articleId: row.article_id,
      articleTitle: row.article_title,
      articleUrl: row.article_url,
      ticker: row.ticker,
      savedAt: row.created_at,
    }));
  });
}

export async function saveArticle(
  userId: string,
  article: NewsArticle
): Promise<boolean> {
  const supabase = getSupabase();
  const { error } = await supabase.from("saved_articles").insert({
    user_id: userId,
    article_id: article.id,
    article_title: article.headline,
    article_url: article.sourceUrl,
    ticker: resolveArticleTicker(article),
  });

  if (error) {
    console.error("saveArticle:", error.message);
    return false;
  }
  return true;
}

export async function unsaveArticle(
  userId: string,
  articleId: string
): Promise<boolean> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("saved_articles")
    .delete()
    .eq("user_id", userId)
    .eq("article_id", articleId);

  if (error) {
    console.error("unsaveArticle:", error.message);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

// Basic moderation: a comment that collects this many reports is filtered
// out of fetchComments() automatically — no human review needed to hide
// the obvious cases. Its replies (if not themselves reported) stay visible
// as top-level comments rather than disappearing with it.
const AUTO_HIDE_REPORT_THRESHOLD = 3;

export async function fetchComments(articleId: string): Promise<Comment[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("comments")
    .select("id, user_id, display_name, comment_text, created_at, parent_id, deleted_at")
    .eq("article_id", articleId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchComments:", error.message);
    return [];
  }

  const rows = data ?? [];
  const reportCounts = await fetchCommentReportCounts(rows.map((row) => row.id));

  return rows
    .filter((row) => (reportCounts.get(row.id) ?? 0) < AUTO_HIDE_REPORT_THRESHOLD)
    .map((row) => {
      const isDeleted = Boolean(row.deleted_at);
      return {
        id: row.id,
        userId: row.user_id,
        username: row.display_name,
        avatar: initials(row.display_name),
        avatarColor: avatarColor(row.display_name),
        avatarUrl: row.user_id ? loadProfileAvatar(row.user_id) : null,
        text: isDeleted ? "This comment was deleted" : row.comment_text,
        timeAgo: timeAgo(row.created_at),
        parentId: row.parent_id ?? null,
        isDeleted,
      };
    });
}

/** Soft-delete — replaces the text with a placeholder rather than removing
 * the row, so replies underneath don't get orphaned. Only the author can
 * do this (enforced by RLS via auth.uid() = user_id). */
export async function deleteComment(
  userId: string,
  commentId: string
): Promise<boolean> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("user_id", userId);

  if (error) {
    console.error("deleteComment:", error.message);
    return false;
  }
  return true;
}

function parseCommentCount(count: number | null | undefined): number {
  if (count == null || !Number.isFinite(count) || count < 0) return 0;
  return Math.floor(count);
}

export async function fetchCommentCount(articleId: string): Promise<number> {
  const supabase = getSupabase();
  // Soft-deleted comments (deleted_at set — see deleteComment above) still
  // render as a "This comment was deleted" tombstone in the thread, but
  // shouldn't count toward the visible comment count. Without this filter,
  // deleting a comment leaves the count exactly where it was.
  //
  // Deliberately not count:"exact",head:true - see the comment on
  // fetchUserLikedCount for why (that exact combination was the one query
  // shape returning 503s in production across liked_articles; using the
  // same plain-select approach here defensively, since it's the same
  // count=exact HEAD pattern against a different table).
  const { data, error } = await supabase
    .from("comments")
    .select("id")
    .eq("article_id", articleId)
    .is("deleted_at", null);

  if (error) {
    console.error("fetchCommentCount:", error.message);
    return 0;
  }
  return parseCommentCount(data?.length ?? 0);
}

// Same rationale as fetchLikeCounts above: the feed renders every card at
// once, so every FeedCard's useArticleCommentCount used to fire its own
// per-article comment-count query on mount — a burst of concurrent queries
// against the comments table. This batches a whole page of article ids
// into one query, tallied client-side, paired with the debounced
// ensureCommentCountsLoaded queue in AppContext.
export async function fetchCommentCounts(
  articleIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (articleIds.length === 0) return counts;
  for (const id of articleIds) counts.set(id, 0);

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("comments")
    .select("article_id")
    .in("article_id", articleIds)
    .is("deleted_at", null);

  if (error) {
    console.error("fetchCommentCounts:", error.message);
    return counts;
  }
  for (const row of data ?? []) {
    counts.set(row.article_id, (counts.get(row.article_id) ?? 0) + 1);
  }
  return counts;
}

export interface PostCommentResult {
  comment: Comment | null;
  /** Set when the comment was rejected by the client-side content filter — a
   * user-facing reason to show, distinct from a generic network/DB error. */
  blockedReason?: string;
}

export async function postComment(
  userId: string,
  articleId: string,
  commentText: string,
  displayName: string,
  parentId?: string | null
): Promise<PostCommentResult> {
  const filterResult = isDisallowedComment(commentText);
  if (filterResult.blocked) {
    return { comment: null, blockedReason: filterResult.reason };
  }

  try {
    const supabase = getSupabase();
    const payload: Record<string, string | null> = {
      user_id: userId,
      article_id: articleId,
      comment_text: commentText.trim(),
      display_name: displayName.trim(),
    };
    if (parentId) payload.parent_id = parentId;

    const { data, error } = await supabase
      .from("comments")
      .insert(payload)
      .select("id, user_id, display_name, comment_text, created_at, parent_id")
      .single();

    if (error || !data) {
      console.error("postComment:", error?.message, error?.details, error?.hint);
      return {
        comment: null,
        blockedReason: "Couldn't post your comment. Please try again.",
      };
    }

    return {
      comment: {
        id: data.id,
        userId: data.user_id,
        username: data.display_name,
        avatar: initials(data.display_name),
        avatarColor: avatarColor(data.display_name),
        avatarUrl: loadProfileAvatar(userId),
        text: data.comment_text,
        timeAgo: "Just now",
        parentId: data.parent_id ?? null,
      },
    };
  } catch (err) {
    console.error("postComment: threw", err);
    return {
      comment: null,
      blockedReason: "Couldn't post your comment. Please try again.",
    };
  }
}

// ---------------------------------------------------------------------------
// Comment reactions (emoji picker — replaces the old plain heart like)
// ---------------------------------------------------------------------------

export async function fetchCommentReactionCounts(
  commentIds: string[]
): Promise<Map<string, Record<string, number>>> {
  const counts = new Map<string, Record<string, number>>();
  if (commentIds.length === 0) return counts;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("comment_reactions")
    .select("comment_id, emoji")
    .in("comment_id", commentIds);

  if (error) {
    console.error("fetchCommentReactionCounts:", error.message);
    return counts;
  }

  for (const row of data ?? []) {
    const perComment = counts.get(row.comment_id) ?? {};
    perComment[row.emoji] = (perComment[row.emoji] ?? 0) + 1;
    counts.set(row.comment_id, perComment);
  }
  return counts;
}

export async function fetchUserCommentReactions(
  userId: string,
  commentIds: string[]
): Promise<Map<string, string>> {
  if (commentIds.length === 0) return new Map();

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("comment_reactions")
    .select("comment_id, emoji")
    .eq("user_id", userId)
    .in("comment_id", commentIds);

  if (error) {
    console.error("fetchUserCommentReactions:", error.message);
    return new Map();
  }

  return new Map((data ?? []).map((row) => [row.comment_id, row.emoji]));
}

/**
 * Sets, swaps, or clears a user's reaction on a comment. Passing the emoji
 * they already picked removes it (toggle off). Returns the resulting emoji
 * (or null if cleared), or null on failure.
 */
export async function setCommentReaction(
  userId: string,
  commentId: string,
  emoji: string
): Promise<{ emoji: string | null } | null> {
  const supabase = getSupabase();
  const { data: existing, error: readError } = await supabase
    .from("comment_reactions")
    .select("id, emoji")
    .eq("user_id", userId)
    .eq("comment_id", commentId)
    .maybeSingle();

  if (readError) {
    console.error("setCommentReaction:", readError.message);
    return null;
  }

  if (existing && existing.emoji === emoji) {
    const { error } = await supabase
      .from("comment_reactions")
      .delete()
      .eq("user_id", userId)
      .eq("comment_id", commentId);

    if (error) {
      console.error("setCommentReaction:", error.message);
      return null;
    }
    return { emoji: null };
  }

  const { error } = await supabase.from("comment_reactions").upsert(
    { user_id: userId, comment_id: commentId, emoji },
    { onConflict: "user_id,comment_id" }
  );

  if (error) {
    console.error("setCommentReaction:", error.message);
    return null;
  }
  return { emoji };
}

// ---------------------------------------------------------------------------
// Comment reports (basic moderation — see AUTO_HIDE_REPORT_THRESHOLD above)
// ---------------------------------------------------------------------------

export async function fetchCommentReportCounts(
  commentIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (commentIds.length === 0) return counts;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("comment_reports")
    .select("comment_id")
    .in("comment_id", commentIds);

  if (error) {
    console.error("fetchCommentReportCounts:", error.message);
    return counts;
  }

  for (const row of data ?? []) {
    counts.set(row.comment_id, (counts.get(row.comment_id) ?? 0) + 1);
  }
  return counts;
}

export async function fetchUserCommentReports(
  userId: string,
  commentIds: string[]
): Promise<Set<string>> {
  if (commentIds.length === 0) return new Set();

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("comment_reports")
    .select("comment_id")
    .eq("user_id", userId)
    .in("comment_id", commentIds);

  if (error) {
    console.error("fetchUserCommentReports:", error.message);
    return new Set();
  }

  return new Set((data ?? []).map((row) => row.comment_id));
}

/** Idempotent — reporting the same comment twice is treated as success. */
export async function reportComment(
  userId: string,
  commentId: string
): Promise<boolean> {
  const supabase = getSupabase();
  const { error } = await supabase.from("comment_reports").insert({
    user_id: userId,
    comment_id: commentId,
  });

  if (error && error.code !== "23505") {
    console.error("reportComment:", error.message);
    return false;
  }
  return true;
}
