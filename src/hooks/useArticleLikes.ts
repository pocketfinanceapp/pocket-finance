"use client";

import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import {
  fetchLikeCount,
  fetchUserLikedArticleIds,
  likeArticle,
  unlikeArticle,
} from "@/lib/userInteractions";
import type { NewsArticle } from "@/lib/types";

export function useArticleLikes(article: NewsArticle) {
  const { reloadProfileStats } = useApp();
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [toggling, setToggling] = useState(false);

  const refresh = useCallback(async () => {
    const count = await fetchLikeCount(article.id);
    setLikeCount(count);
    if (user) {
      const ids = await fetchUserLikedArticleIds(user.id);
      setLiked(ids.has(article.id));
    } else {
      setLiked(false);
    }
  }, [article.id, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleLike = useCallback(async () => {
    if (!user || toggling) return;
    setToggling(true);

    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? Math.max(0, c - 1) : c + 1));

    const ok = wasLiked
      ? await unlikeArticle(user.id, article.id)
      : await likeArticle(user.id, article);

    if (!ok) {
      setLiked(wasLiked);
      setLikeCount((c) => (wasLiked ? c + 1 : Math.max(0, c - 1)));
    } else {
      void reloadProfileStats();
    }

    setToggling(false);
  }, [user, toggling, liked, article, reloadProfileStats]);

  return { liked, likeCount, toggleLike, toggling };
}
