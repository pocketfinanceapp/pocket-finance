"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronUp,
  Heart,
  MessageCircle,
  Send,
  X,
} from "lucide-react";
import { PopReaction } from "@/components/PopReaction";
import { useAuth } from "@/context/AuthContext";
import {
  addCommentReply,
  appendReplyToTree,
  buildDiscussionThread,
  countThreadComments,
  getAncestorIds,
  toggleCommentLike,
  updateCommentLikeInTree,
  type ThreadComment,
} from "@/lib/commentThread";
import type { NewsArticle } from "@/lib/types";
import { fetchComments, postComment } from "@/lib/userInteractions";

interface CommentSheetProps {
  open: boolean;
  onClose: () => void;
  article: NewsArticle | null;
  onCommentPosted?: () => void;
}

export function CommentSheet({
  open,
  onClose,
  article,
  onCommentPosted,
}: CommentSheetProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<ThreadComment[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [replyTo, setReplyTo] = useState<ThreadComment | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Investor";

  const userInitial = displayName.charAt(0).toUpperCase();
  const totalCount = countThreadComments(comments);

  const loadComments = useCallback(async () => {
    if (!article) return;
    setLoading(true);
    const rows = await fetchComments(article.id);
    setComments(buildDiscussionThread(article.id, rows));
    setLoading(false);
  }, [article]);

  useEffect(() => {
    if (open && article) {
      setInput("");
      setReplyTo(null);
      void loadComments();
    }
  }, [open, article, loadComments]);

  useEffect(() => {
    if (open) {
      setMounted(true);
      document.body.style.overflow = "hidden";
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
      return () => cancelAnimationFrame(raf);
    }

    setEntered(false);
    setKeyboardInset(0);
    setReplyTo(null);
    setExpandedIds(new Set());
    document.body.style.overflow = "";
    const t = window.setTimeout(() => setMounted(false), 280);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;

    const syncKeyboard = () => {
      const gap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardInset(gap > 40 ? gap : 0);
    };

    syncKeyboard();
    vv.addEventListener("resize", syncKeyboard);
    vv.addEventListener("scroll", syncKeyboard);
    return () => {
      vv.removeEventListener("resize", syncKeyboard);
      vv.removeEventListener("scroll", syncKeyboard);
    };
  }, [open]);

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
    const liked = toggleCommentLike(commentId);
    setComments((prev) => updateCommentLikeInTree(prev, commentId, liked));
  };

  const submit = async () => {
    const text = input.trim();
    if (!text || !article || !user || submitting) return;

    setSubmitting(true);

    if (replyTo) {
      const stored = addCommentReply(article.id, replyTo.id, text, displayName);
      const reply: ThreadComment = {
        id: stored.id,
        username: displayName,
        avatar: userInitial.length >= 2 ? userInitial : displayName.slice(0, 2).toUpperCase(),
        avatarColor: "#3B6EF5",
        text,
        timeAgo: "Just now",
        likes: 0,
        likedByMe: false,
        replies: [],
        parentId: replyTo.id,
      };
      setComments((prev) => appendReplyToTree(prev, replyTo.id, reply));
      ensureThreadExpanded(replyTo.id);
      setInput("");
      setReplyTo(null);
      setSubmitting(false);
      requestAnimationFrame(() => {
        document.getElementById(`comment-${stored.id}`)?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      });
      return;
    }

    const created = await postComment(user.id, article.id, text, displayName);
    setSubmitting(false);

    if (created) {
      setComments((prev) => [
        {
          ...created,
          likes: 0,
          likedByMe: false,
          replies: [],
          isPlaceholder: false,
        },
        ...prev,
      ]);
      setInput("");
      onCommentPosted?.();
      listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (!mounted || typeof document === "undefined") return null;

  const composerBottom = `max(0.75rem, env(safe-area-inset-bottom, 0px))`;
  const sheetBottom = keyboardInset > 0 ? `${keyboardInset}px` : "0px";

  return createPortal(
    <div
      className="pf-theme-scope fixed inset-0 z-[200]"
      data-no-drag
      data-interactive
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close comments"
        className={`absolute inset-0 backdrop-blur-md transition-opacity duration-300 ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        style={{ background: "var(--pocket-backdrop)" }}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="comment-sheet-title"
        className={`absolute inset-x-0 mx-auto flex w-full max-w-mobile flex-col overflow-hidden rounded-t-[28px] border border-[var(--pocket-border)] shadow-[0_-24px_80px_rgba(0,0,0,0.25)] transition-transform duration-300 ease-out ${
          entered ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          bottom: sheetBottom,
          height:
            keyboardInset > 0
              ? "min(72dvh, calc(100dvh - 1rem))"
              : "min(88dvh, calc(100dvh - 0.5rem))",
          background: "var(--pocket-sheet)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(0,198,198,0.55) 35%, rgba(59,110,245,0.55) 65%, transparent)",
          }}
        />

        <div className="flex shrink-0 flex-col items-center px-5 pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-[var(--pocket-border)]" />
        </div>

        <header className="grid shrink-0 grid-cols-[1fr_auto] items-start gap-3 border-b border-[var(--pocket-border)] px-5 pb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(59,110,245,0.28), rgba(0,198,198,0.18))",
                  border: "1px solid rgba(0,198,198,0.22)",
                }}
              >
                <MessageCircle className="h-4 w-4 text-[#00C6C6]" strokeWidth={2.25} />
              </div>
              <div className="min-w-0">
                <h2 id="comment-sheet-title" className="text-[17px] font-bold leading-tight text-pocket-text">
                  Discussion
                </h2>
                <p className="mt-0.5 text-[12px] text-pocket-muted">
                  {totalCount} {totalCount === 1 ? "comment" : "comments"}
                </p>
              </div>
            </div>

            {article && (
              <div className="mt-3 space-y-1.5">
                <span className="inline-flex rounded-full bg-[#00C6C6]/12 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-[#00C6C6]">
                  {article.ticker}
                </span>
                <p className="line-clamp-2 text-[13px] leading-snug text-pocket-muted">
                  {article.headline}
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            data-no-drag
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--pocket-surface-hover)] text-pocket-muted active:bg-[var(--pocket-card-hover)] active:text-pocket-text"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div
          ref={listRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3"
        >
          {loading && comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--pocket-surface-hover)]" />
              <p className="mt-4 text-sm text-pocket-muted">Loading discussion…</p>
            </div>
          ) : (
            <div className="space-y-1">
              {comments.map((comment) => (
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  depth={0}
                  onLike={handleLike}
                  onReply={(c) => {
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
                />
              ))}
            </div>
          )}
        </div>

        <div
          className="shrink-0 border-t border-[var(--pocket-border)] px-4 pt-3"
          style={{
            paddingBottom: composerBottom,
            background: "var(--pocket-composer)",
            backdropFilter: "blur(14px)",
          }}
        >
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

          {!user ? (
            <p className="py-2.5 text-center text-[13px] text-pocket-muted">
              Sign in to join the discussion
            </p>
          ) : (
            <div className="flex items-end gap-2.5">
              <div
                className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(59,110,245,0.85), rgba(0,198,198,0.75))",
                }}
              >
                {userInitial}
              </div>

              <div
                className="min-w-0 flex-1 rounded-[20px] border border-[var(--pocket-border)] bg-[var(--pocket-surface-hover)] px-1 py-1 shadow-[inset_0_1px_0_var(--pocket-border)] focus-within:border-[#00C6C6]/35"
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    replyTo ? `Reply to ${replyTo.username}…` : "Add to the discussion…"
                  }
                  rows={1}
                  data-no-drag
                  disabled={submitting}
                  className="max-h-28 min-h-[44px] w-full resize-none bg-transparent px-3 py-2.5 text-[15px] leading-snug text-pocket-text placeholder:text-pocket-muted focus:outline-none disabled:opacity-50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void submit();
                    }
                  }}
                />
              </div>

              <button
                type="button"
                data-no-drag
                onClick={() => void submit()}
                disabled={submitting || !input.trim()}
                className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-black transition active:scale-95 disabled:opacity-35"
                style={{
                  background:
                    input.trim() && !submitting
                      ? "linear-gradient(135deg, #3B6EF5 0%, #00C6C6 100%)"
                      : "rgba(255,255,255,0.12)",
                  color:
                    input.trim() && !submitting ? "#000" : "rgba(255,255,255,0.4)",
                }}
                aria-label="Post comment"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

const THREAD_AVATAR = 36;
const THREAD_GAP = 12;
/** px from reply-row start to parent avatar column center */
const THREAD_BRANCH_OFFSET = THREAD_AVATAR + THREAD_GAP - THREAD_AVATAR / 2;

function CommentAvatar({
  comment,
  compact = false,
}: {
  comment: ThreadComment;
  compact?: boolean;
}) {
  const size = compact ? "h-8 w-8 text-[10px]" : "h-9 w-9 text-[11px]";
  return (
    <div
      className={`relative z-[1] flex shrink-0 items-center justify-center rounded-full font-bold text-white ${size}`}
      style={{ backgroundColor: comment.avatarColor }}
    >
      {comment.avatar}
    </div>
  );
}

function CommentThread({
  comment,
  depth,
  onLike,
  onReply,
  replyTargetId,
  expandedIds,
  onToggleExpanded,
  isLast = true,
}: {
  comment: ThreadComment;
  depth: number;
  onLike: (id: string) => void;
  onReply: (comment: ThreadComment) => void;
  replyTargetId: string | null;
  expandedIds: Set<string>;
  onToggleExpanded: (id: string, open: boolean) => void;
  isLast?: boolean;
}) {
  const [localExpanded, setLocalExpanded] = useState(depth === 0);
  const hasReplies = comment.replies.length > 0;
  const expanded = expandedIds.has(comment.id) || localExpanded;
  const isReplyTarget = replyTargetId === comment.id;

  const toggleExpanded = () => {
    const next = !expanded;
    setLocalExpanded(next);
    onToggleExpanded(comment.id, next);
  };

  return (
    <article
      id={`comment-${comment.id}`}
      className={`relative ${depth === 0 ? "py-2.5" : "pt-3"}`}
    >
      {depth > 0 && (
        <>
          <div
            className="pf-thread-branch pointer-events-none absolute top-0 z-0 rounded-bl-[12px] border-b-2 border-l-2"
            style={{
              left: -THREAD_BRANCH_OFFSET,
              width: THREAD_BRANCH_OFFSET + THREAD_AVATAR / 2,
              height: THREAD_AVATAR / 2 + 2,
            }}
            aria-hidden
          />
          <span
            className="pointer-events-none absolute z-[1] rounded-full bg-[#00C6C6] ring-2 ring-[var(--pocket-sheet,#08090e)]"
            style={{
              left: THREAD_AVATAR / 2 - 3,
              top: THREAD_AVATAR / 2 - 3,
              width: 6,
              height: 6,
            }}
            aria-hidden
          />
          {!isLast && (
            <div
              className="pf-thread-trunk pointer-events-none absolute z-0 w-[2px]"
              style={{
                left: -THREAD_BRANCH_OFFSET + 1,
                top: THREAD_AVATAR / 2 + 4,
                bottom: 0,
              }}
              aria-hidden
            />
          )}
        </>
      )}

      <div className="relative z-[1] flex gap-3">
        <div className="flex w-9 shrink-0 flex-col items-center">
          <CommentAvatar comment={comment} compact={depth > 0} />
          {hasReplies && expanded && (
            <div
              className="pf-thread-trunk mt-2 w-[2px] flex-1 rounded-full"
              style={{ minHeight: 10 }}
              aria-hidden
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div
            className={`rounded-2xl border px-3.5 py-2.5 transition-colors ${
              isReplyTarget
                ? "border-[#00C6C6]/45 bg-[#00C6C6]/[0.07] shadow-[0_0_0_1px_rgba(0,198,198,0.12)]"
                : "border-[var(--pocket-border)] bg-[var(--pocket-surface-hover)]"
            } ${depth > 0 ? "rounded-tl-md" : "rounded-tl-lg"}`}
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-[13px] font-semibold text-pocket-text">
                {comment.username}
              </span>
              <span className="text-[10px] text-pocket-muted">{comment.timeAgo}</span>
            </div>
            <p className="mt-1 text-[14px] leading-relaxed text-pocket-text">
              {comment.text}
            </p>
          </div>

          <div className="mt-1.5 flex items-center gap-1">
            <PopReaction
              aria-label={comment.likedByMe ? "Unlike comment" : "Like comment"}
              burst={!comment.likedByMe}
              onClick={() => onLike(comment.id)}
              className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium transition-colors ${
                comment.likedByMe
                  ? "text-[#00C6C6]"
                  : "text-pocket-muted hover:text-pocket-text"
              }`}
            >
              <Heart
                className={`h-3.5 w-3.5 ${comment.likedByMe ? "fill-[#00C6C6] text-[#00C6C6]" : ""}`}
                strokeWidth={2.25}
              />
              {comment.likes > 0 && (
                <span className="tabular-nums">{comment.likes}</span>
              )}
            </PopReaction>

            <button
              type="button"
              data-no-drag
              onClick={() => onReply(comment)}
              className={`rounded-full px-2 py-1 text-[11px] font-medium transition-colors ${
                isReplyTarget
                  ? "text-[#00C6C6]"
                  : "text-pocket-muted hover:text-pocket-text"
              }`}
            >
              Reply
            </button>
          </div>

          {hasReplies && (
            <button
              type="button"
              data-no-drag
              onClick={toggleExpanded}
              className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-[#00C6C6]/90"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  Hide {comment.replies.length}{" "}
                  {comment.replies.length === 1 ? "reply" : "replies"}
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  View {comment.replies.length}{" "}
                  {comment.replies.length === 1 ? "reply" : "replies"}
                </>
              )}
            </button>
          )}

          {expanded && hasReplies && (
            <div className="relative mt-1">
              <div
                className="pf-thread-trunk pointer-events-none absolute z-0 w-[2px] rounded-full"
                style={{
                  left: -(THREAD_GAP + THREAD_AVATAR / 2) + 1,
                  top: 0,
                  bottom: 0,
                }}
                aria-hidden
              />
              {comment.replies.map((reply, index) => (
                <CommentThread
                  key={reply.id}
                  comment={reply}
                  depth={depth + 1}
                  onLike={onLike}
                  onReply={onReply}
                  replyTargetId={replyTargetId}
                  expandedIds={expandedIds}
                  onToggleExpanded={onToggleExpanded}
                  isLast={index === comment.replies.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
