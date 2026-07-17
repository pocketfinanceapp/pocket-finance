"use client";

import { useEffect, useState } from "react";
import type { NewsArticle } from "./types";

interface SimilarState {
  uuid: string | null;
  articles: NewsArticle[];
}

/**
 * Shared fetch for Marketaux's news/similar/{uuid} endpoint. Used by both
 * the "More on this story" carousel and the multi-source Pocket Briefing so
 * an article view only makes one similar-articles request, not two.
 * Returns an empty list immediately (no fetch) for articles that didn't
 * come from Marketaux — NewsAPI/demo articles have no uuid to look up.
 *
 * `loading` is derived synchronously from comparing the requested uuid to
 * the uuid the current state was resolved for — not a separate piece of
 * state set inside an effect. That matters: an effect-driven loading flag
 * lags one render behind a prop change (whether that's the very first
 * mount or navigating from one article to another), which would let a
 * consumer like the Pocket Briefing generator read a false "not loading"
 * on the render right after the uuid changed and fire early.
 */
export function useSimilarArticles(uuid: string | null | undefined) {
  const normalizedUuid = uuid ?? null;
  const [state, setState] = useState<SimilarState>({
    uuid: null,
    articles: [],
  });

  const loading = normalizedUuid !== null && state.uuid !== normalizedUuid;

  useEffect(() => {
    if (!normalizedUuid) {
      setState({ uuid: null, articles: [] });
      return;
    }

    let cancelled = false;

    fetch(`/api/marketaux/similar?uuid=${encodeURIComponent(normalizedUuid)}`)
      .then((res) => (res.ok ? res.json() : { articles: [] }))
      .then((data: { articles?: NewsArticle[] }) => {
        if (!cancelled) {
          setState({ uuid: normalizedUuid, articles: data.articles ?? [] });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ uuid: normalizedUuid, articles: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [normalizedUuid]);

  return {
    articles: state.uuid === normalizedUuid ? state.articles : [],
    loading,
  };
}
