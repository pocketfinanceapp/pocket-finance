"use client";

import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import {
  PF_ARTICLE_LIKE_UPDATED,
  emitArticleLikeUpdated,
  type ArticleLikeUpdatedDetail,
} from "@/lib/articleInteractionEvents";
import {
  fetchLikeCount,
  likeArticle,
  unlikeArticle,
} from "@/lib/userInteractions";
import { markArticleLiked } from "@/lib/progression";
import { trackEvent } from "@/lib/analytics";
import type { NewsArticle } from "@/lib/types";

export function useArticleLikes(article: NewsArticle) {
  const {
    reloadProfileStats,
    likedArticleIds,
    setLikedArticleIds,
    likeCounts,
    ensureLikeCountsLoaded,
  } = useApp();
  const { user } = useAuth();
  // Derived from the shared AppContext set (one fetch per session, not one
  // per rendered card — see the comment on likedArticleIds in AppContext)
  // rather than each card independently re-fetching the user's full liked
  // list. Updating that set below is what makes every other card showing
  // this same article stay in sync instantly, no event round-trip needed.
  const liked = likedArticleIds.has(article.id);
  const [likeCount, setLikeCount] = useState(0);
  const [toggling, setToggling] = useState(false);

  // Request this article's count through the shared, debounced batch
  // loader rather than fetching it directly — see the comment on
  // likeCounts/ensureLikeCountsLoaded in AppContext for why (every card in
  // the unvirtualized feed mounting at once used to mean one HEAD count
  // query per card, which was tripping intermittent 503s).
  useEffect(() => {
    ensureLikeCountsLoaded([article.id]);
  }, [article.id, ensureLikeCountsLoaded]);

  useEffect(() => {
    const known = likeCounts.get(article.id);
    if (known !== undefined) setLikeCount(known);
  }, [article.id, likeCounts]);

  useEffect(() => {
    const onLikeUpdated = (event: Event) => {
      const detail = (event as CustomEvent<ArticleLikeUpdatedDetail>).detail;
      if (detail.articleId !== article.id) return;
      setLikeCount(detail.likeCount);
    };

    window.addEventListener(PF_ARTICLE_LIKE_UPDATED, onLikeUpdated);
    return () =>
      window.removeEventListener(PF_ARTICLE_LIKE_UPDATED, onLikeUpdated);
  }, [article.id]);

  const setLikedLocally = useCallback(
    (next: boolean) => {
      setLikedArticleIds((prev) => {
        if (next === prev.has(article.id)) return prev;
        const updated = new Set(prev);
        if (next) updated.add(article.id);
        else updated.delete(article.id);
        return updated;
      });
    },
    [article.id, setLikedArticleIds]
  );

  const toggleLike = useCallback(async () => {
    if (!user || toggling) return;
    setToggling(true);

    const wasLiked = liked;
    setLikedLocally(!wasLiked);
    setLikeCount((c) => (wasLiked ? Math.max(0, c - 1) : c + 1));

    const ok = wasLiked
      ? await unlikeArticle(user.id, article.id)
      : await likeArticle(user.id, article);

    if (!ok) {
      setLikedLocally(wasLiked);
      setLikeCount((c) => (wasLiked ? c + 1 : Math.max(0, c - 1)));
    } else {
      if (!wasLiked) {
        markArticleLiked(article.id);
        trackEvent(user.id, "article_liked", article.id);
      }
      void reloadProfileStats();
      const count = await fetchLikeCount(article.id);
      setLikeCount(count);
      emitArticleLikeUpdated({
        articleId: article.id,
        likeCount: count,
        liked: !wasLiked,
      });
    }

    setToggling(false);
  }, [user, toggling, liked, article, reloadProfileStats, setLikedLocally]);

  const likeOnly = useCallback(async () => {
    if (!user || toggling || liked) return false;
    setToggling(true);
    setLikedLocally(true);
    setLikeCount((c) => c + 1);

    const ok = await likeArticle(user.id, article);
    if (!ok) {
      setLikedLocally(false);
      setLikeCount((c) => Math.max(0, c - 1));
    } else {
      markArticleLiked(article.id);
      trackEvent(user.id, "article_liked", article.id);
      void reloadProfileStats();
      const count = await fetchLikeCount(article.id);
      setLikeCount(count);
      emitArticleLikeUpdated({
        articleId: article.id,
        likeCount: count,
        liked: true,
      });
    }

    setToggling(false);
    return ok;
  }, [user, toggling, liked, article, reloadProfileStats, setLikedLocally]);

  return { liked, likeCount, toggleLike, likeOnly, toggling };
}
