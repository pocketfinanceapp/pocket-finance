"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PF_ARTICLE_COMMENT_UPDATED,
  emitArticleCommentUpdated,
  type ArticleCommentUpdatedDetail,
} from "@/lib/articleInteractionEvents";
import { fetchCommentCount } from "@/lib/userInteractions";

export function useArticleCommentCount(
  articleId: string,
  refreshKey = 0
): number {
  const [commentCount, setCommentCount] = useState(0);

  const refresh = useCallback(async () => {
    const count = await fetchCommentCount(articleId);
    setCommentCount(count);
    emitArticleCommentUpdated({ articleId, commentCount: count });
  }, [articleId]);

  useEffect(() => {
    void refresh();
  }, [refresh, refreshKey]);

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
