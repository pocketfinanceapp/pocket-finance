"use client";

import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  extractCashtags,
  fetchTickerDiscussion,
  postTickerDiscussion,
} from "@/lib/tickerDiscussions";
import type { Comment } from "@/lib/types";

interface TickerDiscussionTabProps {
  ticker: string;
  onOpenTicker?: (symbol: string) => void;
}

function renderCashtagText(
  text: string,
  onOpenTicker?: (symbol: string) => void
) {
  const parts = text.split(/(\$[A-Z]{1,6}\b)/g);
  return parts.map((part, index) => {
    const match = part.match(/^\$([A-Z]{1,6})$/);
    if (!match) {
      return <span key={index}>{part}</span>;
    }
    const symbol = match[1];
    return (
      <button
        key={index}
        type="button"
        data-no-drag
        onClick={() => onOpenTicker?.(symbol)}
        className="font-semibold text-[#00C6C6] underline-offset-2 hover:underline"
      >
        ${symbol}
      </button>
    );
  });
}

export function TickerDiscussionTab({
  ticker,
  onOpenTicker,
}: TickerDiscussionTabProps) {
  const { user, isGuest, requestSignIn } = useAuth();
  const [comments, setComments] = useState<Comment[]>(() =>
    fetchTickerDiscussion(ticker)
  );
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  const displayName = useMemo(
    () => user?.user_metadata?.full_name?.trim() || user?.email?.split("@")[0] || "You",
    [user]
  );

  const refresh = useCallback(() => {
    setComments(fetchTickerDiscussion(ticker));
  }, [ticker]);

  const handlePost = async () => {
    if (isGuest) {
      requestSignIn();
      return;
    }
    const trimmed = draft.trim();
    if (!trimmed) return;

    setPosting(true);
    const posted = postTickerDiscussion(ticker, trimmed, displayName);
    if (posted) {
      setDraft("");
      refresh();
      void extractCashtags(trimmed);
    }
    setPosting(false);
  };

  return (
    <div className="px-4 pb-8">
      <div className="rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)] p-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Share your take on $${ticker}. Use $SYMBOL to tag assets.`}
          rows={3}
          className="w-full resize-none bg-transparent text-[15px] leading-snug text-pocket-text placeholder:text-pocket-muted focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[11px] text-pocket-muted">
            Tip: type $AAPL or $BTC to link assets
          </p>
          <button
            type="button"
            data-no-drag
            disabled={posting || !draft.trim()}
            onClick={() => void handlePost()}
            className="rounded-full bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] px-4 py-2 text-[12px] font-bold text-white disabled:opacity-40"
          >
            Post
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {comments.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-pocket-muted">
            No discussion yet. Start the thread for ${ticker}.
          </p>
        ) : (
          comments.map((comment) => (
            <article
              key={comment.id}
              className="rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)] p-4"
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ backgroundColor: comment.avatarColor }}
                >
                  {comment.avatar}
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-pocket-text">
                    {comment.username}
                  </p>
                  <p className="text-[11px] text-pocket-muted">
                    {comment.timeAgo}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-pocket-text">
                {renderCashtagText(comment.text, onOpenTicker)}
              </p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
