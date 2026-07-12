"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { DiscussionThread } from "@/components/DiscussionThread";
import { UserAvatar } from "@/components/UserAvatar";
import { useAuth } from "@/context/AuthContext";
import {
  appendReplyToTree,
  buildDiscussionThread,
  collectCommentIds,
  countThreadComments,
  getAncestorIds,
  updateCommentLikeInTree,
  type ThreadComment,
} from "@/lib/commentThread";
import {
  extractCashtags,
  fetchTickerDiscussion,
  fetchTickerDiscussionLikeCounts,
  postTickerDiscussion,
  toggleTickerDiscussionLike,
} from "@/lib/tickerDiscussions";
import { PF_AVATAR_CHANGED_EVENT } from "@/lib/profileStorage";
import { getUserAvatarUrl, getUserDisplayName } from "@/lib/userIdentity";

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
  const [comments, setComments] = useState<ThreadComment[]>([]);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [replyTo, setReplyTo] = useState<ThreadComment | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [threadCycle, setThreadCycle] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const displayName = useMemo(() => getUserDisplayName(user), [user]);
  const avatarUrl = useMemo(
    () => (user ? getUserAvatarUrl(user.id) : null),
    [user]
  );

  const loadThread = useCallback(() => {
    const rows = fetchTickerDiscussion(ticker, user?.id);
    const commentIds = collectCommentIds(rows);
    const likeCounts = fetchTickerDiscussionLikeCounts(commentIds);
    const likedByUser = new Set<string>();
    if (user) {
      try {
        const raw = window.localStorage.getItem("pf_ticker_discussion_likes_v1");
        if (raw) {
          const map = JSON.parse(raw) as Record<string, string[]>;
          for (const id of map[user.id] ?? []) {
            if (commentIds.includes(id)) likedByUser.add(id);
          }
        }
      } catch {
        /* ignore */
      }
    }
    setComments(buildDiscussionThread(rows, likeCounts, likedByUser));
  }, [ticker, user]);

  useEffect(() => {
    setThreadCycle((v) => v + 1);
    setReplyTo(null);
    loadThread();
  }, [loadThread]);

  useEffect(() => {
    const onAvatarChange = () => loadThread();
    window.addEventListener(PF_AVATAR_CHANGED_EVENT, onAvatarChange);
    return () => window.removeEventListener(PF_AVATAR_CHANGED_EVENT, onAvatarChange);
  }, [loadThread]);

  const totalCount = countThreadComments(comments);

  const ensureThreadExpanded = useCallback(
    (commentId: string) => {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.add(commentId);
        for (const id of getAncestorIds(comments, commentId)) {
          next.add(id);
        }
        return next;
      });
    },
    [comments]
  );

  const handleLike = (commentId: string) => {
    if (!user) {
      requestSignIn();
      return;
    }
    const result = toggleTickerDiscussionLike(user.id, commentId);
    if (!result) return;
    setComments((prev) =>
      updateCommentLikeInTree(prev, commentId, result.liked, result.count)
    );
  };

  const handlePost = async () => {
    if (isGuest) {
      requestSignIn();
      return;
    }
    if (!user) return;
    const trimmed = draft.trim();
    if (!trimmed || posting) return;

    setPosting(true);
    const posted = postTickerDiscussion(
      ticker,
      trimmed,
      displayName,
      user.id,
      replyTo?.id
    );
    setPosting(false);

    if (!posted) return;

    const threadComment: ThreadComment = {
      ...posted,
      likes: 0,
      likedByMe: false,
      replies: [],
      isPlaceholder: false,
    };

    if (replyTo) {
      setComments((prev) => appendReplyToTree(prev, replyTo.id, threadComment));
      ensureThreadExpanded(replyTo.id);
    } else {
      setComments((prev) => [threadComment, ...prev]);
    }

    setDraft("");
    setReplyTo(null);
    void extractCashtags(trimmed);
  };

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(59,110,245,0.22), rgba(0,198,198,0.14))",
              border: "1px solid rgba(0,198,198,0.18)",
            }}
          >
            <MessageCircle className="h-3.5 w-3.5 text-[#00C6C6]" strokeWidth={2.25} />
          </div>
          <div>
            <p className="text-[14px] font-bold text-pocket-text">Discussion</p>
            <p className="text-[11px] text-pocket-muted">
              {totalCount} {totalCount === 1 ? "post" : "posts"} · ${ticker}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)] p-3">
        {replyTo && (
          <div className="mb-2.5 flex items-center justify-between rounded-xl border border-[var(--pocket-border)] bg-[var(--pocket-surface-hover)] px-3 py-2">
            <p className="min-w-0 truncate text-[12px] text-pocket-muted">
              Replying to{" "}
              <span className="font-semibold text-pocket-text">{replyTo.username}</span>
            </p>
            <button
              type="button"
              data-no-drag
              onClick={() => setReplyTo(null)}
              className="ml-2 shrink-0 text-[11px] font-medium text-[#00C6C6]"
            >
              Cancel
            </button>
          </div>
        )}

        {isGuest ? (
          <button
            type="button"
            data-no-drag
            onClick={requestSignIn}
            className="w-full rounded-xl border border-dashed border-[var(--pocket-border)] py-4 text-center text-[13px] font-medium text-pocket-muted active:bg-[var(--pocket-surface-hover)]"
          >
            Sign in to join the discussion
          </button>
        ) : (
          <div className="flex items-end gap-2.5">
            <UserAvatar
              name={displayName}
              avatarUrl={avatarUrl}
              size="md"
              className="mb-0.5"
            />
            <div className="min-w-0 flex-1 rounded-[18px] border border-[var(--pocket-border)] bg-[var(--pocket-surface-hover)] px-1 py-1 focus-within:border-[#00C6C6]/35">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={
                  replyTo
                    ? `Reply to ${replyTo.username}…`
                    : `Share your take on $${ticker}…`
                }
                rows={2}
                data-no-drag
                disabled={posting}
                className="max-h-28 min-h-[44px] w-full resize-none bg-transparent px-3 py-2 text-[15px] leading-snug text-pocket-text placeholder:text-pocket-muted focus:outline-none disabled:opacity-50"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handlePost();
                  }
                }}
              />
            </div>
            <button
              type="button"
              data-no-drag
              disabled={posting || !draft.trim()}
              onClick={() => void handlePost()}
              className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-black transition active:scale-95 disabled:opacity-35"
              style={{
                background:
                  draft.trim() && !posting
                    ? "linear-gradient(135deg, #3B6EF5 0%, #00C6C6 100%)"
                    : "rgba(255,255,255,0.12)",
              }}
              aria-label="Post"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {comments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--pocket-border)] px-4 py-10 text-center">
          <p className="text-[14px] font-semibold text-pocket-text">No posts yet</p>
          <p className="mt-1 text-[12px] text-pocket-muted">
            Be the first to share your view on ${ticker}.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)] px-3 py-1">
          {comments.map((comment) => (
            <DiscussionThread
              key={comment.id}
              comment={comment}
              depth={0}
              onLike={handleLike}
              onReply={(c) => {
                if (isGuest) {
                  requestSignIn();
                  return;
                }
                ensureThreadExpanded(c.id);
                setReplyTo(c);
                inputRef.current?.focus();
              }}
              replyTargetId={replyTo?.id ?? null}
              expandedIds={expandedIds}
              onToggleExpanded={(id, open) => {
                setExpandedIds((prev) => {
                  const next = new Set(prev);
                  if (open) next.add(id);
                  else next.delete(id);
                  return next;
                });
              }}
              resetKey={threadCycle}
              renderText={(text) => renderCashtagText(text, onOpenTicker)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
