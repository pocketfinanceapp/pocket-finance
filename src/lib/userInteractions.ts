import { getSupabase } from "@/lib/supabase";
import { resolveArticleTicker } from "@/lib/tickerMap";
import type { Comment, NewsArticle, SavedArticleEntry } from "@/lib/types";
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
// User stats
// ---------------------------------------------------------------------------

export async function fetchUserStoriesRead(userId: string): Promise<number> {
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
  const supabase = getSupabase();
  const { count, error } = await supabase
    .from("liked_articles")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("fetchUserLikedCount:", error.message);
    return 0;
  }
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Likes
// ---------------------------------------------------------------------------

export async function fetchLikeCount(articleId: string): Promise<number> {
  const supabase = getSupabase();
  const { count, error } = await supabase
    .from("liked_articles")
    .select("*", { count: "exact", head: true })
    .eq("article_id", articleId);

  if (error) {
    console.error("fetchLikeCount:", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function fetchUserLikedArticleIds(
  userId: string
): Promise<Set<string>> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("liked_articles")
    .select("article_id")
    .eq("user_id", userId);

  if (error) {
    console.error("fetchUserLikedArticleIds:", error.message);
    return new Set();
  }
  return new Set((data ?? []).map((r) => r.article_id));
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

// ---------------------------------------------------------------------------
// Saved articles (watchlist)
// ---------------------------------------------------------------------------

export async function fetchSavedArticles(
  userId: string
): Promise<SavedArticleEntry[]> {
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

export async function fetchComments(articleId: string): Promise<Comment[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("comments")
    .select("id, display_name, comment_text, created_at")
    .eq("article_id", articleId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchComments:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    username: row.display_name,
    avatar: initials(row.display_name),
    avatarColor: avatarColor(row.display_name),
    text: row.comment_text,
    timeAgo: timeAgo(row.created_at),
  }));
}

export async function fetchCommentCount(articleId: string): Promise<number> {
  const supabase = getSupabase();
  const { count, error } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("article_id", articleId);

  if (error) {
    console.error("fetchCommentCount:", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function postComment(
  userId: string,
  articleId: string,
  commentText: string,
  displayName: string
): Promise<Comment | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("comments")
    .insert({
      user_id: userId,
      article_id: articleId,
      comment_text: commentText.trim(),
      display_name: displayName.trim(),
    })
    .select("id, display_name, comment_text, created_at")
    .single();

  if (error || !data) {
    console.error("postComment:", error?.message);
    return null;
  }

  return {
    id: data.id,
    username: data.display_name,
    avatar: initials(data.display_name),
    avatarColor: avatarColor(data.display_name),
    text: data.comment_text,
    timeAgo: "Just now",
  };
}
