"use client";

import { useEffect, useState } from "react";
import {
  PF_ARTICLE_COMMENT_UPDATED,
  type ArticleCommentUpdatedDetail,
} from "@/lib/articleInteractionEvents";
import { fetchCommentCount } from "@/lib/userInteractions";
import { useApp } from "@/context/AppContext";

export function useArticleCommentCount(
  articleId: string,
  refreshKey = 0
): number {
  const { commentCounts, ensureCommentCountsLoaded } = useApp();
  const [commentCount, setCommentCount] = useState(0);

  // Initial count comes from the shared, debounced batch loader instead of
  // each card fetching its own — see the comment on
  // commentCounts/ensureCommentCountsLoaded in AppContext (same fix as
  // likeCounts: the feed renders every card at once, so N cards used to
  // mean N concurrent per-article count queries).
  useEffect(() => {
    ensureCommentCountsLoaded([articleId]);
  }, [articleId, ensureCommentCountsLoaded]);

  useEffect(() => {
    const known = commentCounts.get(articleId);
    if (known !== undefined) setCommentCount(known);
  }, [articleId, commentCounts]);

  // refreshKey changes after this card's own comment sheet closes having
  // posted something — that's a single, low-frequency, user-triggered
  // event, so it's fine (and simpler) to fetch it directly rather than
  // route it through the batch queue.
  useEffect(() => {
    if (refreshKey === 0) return;
    let cancelled = false;
    void fetchCommentCount(articleId).then((count) => {
      if (!cancelled) setCommentCount(count);
    });
    return () => {
      cancelled = true;
    };
  }, [articleId, refreshKey]);

  useEffect(() => {
    const onCommentUpdated = (event: Event) => {
      const detail = (event as CustomEvent<ArticleCommentUpdatedDetail>).detail;
      if (detail.articleId !== articleId) return;
      setCommentCount(detail.commentCount);
    };

    window.addEventListener(PF_ARTICLE_COMMENT_UPDATED, onCommentUpdated);
    return () =>
      window.removeEventListener(PF_ARTICLE_COMMENT_UPDATED, onCommentUpdated);
  }, [articleId]);

  return commentCount;
}
