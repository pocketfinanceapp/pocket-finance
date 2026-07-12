"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  MessageCircle,
  Send,
  X,
} from "lucide-react";
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
import type { NewsArticle } from "@/lib/types";
import {
  emitArticleCommentUpdated,
} from "@/lib/articleInteractionEvents";
import { PF_AVATAR_CHANGED_EVENT } from "@/lib/profileStorage";
import { getUserAvatarUrl, getUserDisplayName } from "@/lib/userIdentity";
import {
  fetchCommentLikeCounts,
  fetchComments,
  fetchCommentCount,
  fetchUserCommentLikes,
  postComment,
  toggleCommentLike,
} from "@/lib/userInteractions";

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
  const [sheetCycle, setSheetCycle] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const displayName = getUserDisplayName(user);
  const avatarUrl = user ? getUserAvatarUrl(user.id) : null;

  const totalCount = countThreadComments(comments);

  const loadComments = useCallback(async () => {
    if (!article) return;
    setLoading(true);
    const rows = await fetchComments(article.id);
    const commentIds = collectCommentIds(rows);
    const [likeCounts, likedByUser] = await Promise.all([
      fetchCommentLikeCounts(commentIds),
      user ? fetchUserCommentLikes(user.id, commentIds) : Promise.resolve(new Set<string>()),
    ]);
    setComments(buildDiscussionThread(rows, likeCounts, likedByUser));
    const count = await fetchCommentCount(article.id);
    emitArticleCommentUpdated({ articleId: article.id, commentCount: count });
    setLoading(false);
  }, [article, user]);

  useEffect(() => {
    if (open && article) {
      setSheetCycle((v) => v + 1);
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
    const t = window.setTimeout(() => setMounted(false), 200);
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

  useEffect(() => {
    if (!open) return;
    const onAvatarChange = () => void loadComments();
    window.addEventListener(PF_AVATAR_CHANGED_EVENT, onAvatarChange);
    return () => window.removeEventListener(PF_AVATAR_CHANGED_EVENT, onAvatarChange);
  }, [open, loadComments]);

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

  const handleLike = async (commentId: string) => {
    if (!user) return;
    const result = await toggleCommentLike(user.id, commentId);
    if (!result) return;
    setComments((prev) =>
      updateCommentLikeInTree(prev, commentId, result.liked, result.count)
    );
  };

  const submit = async () => {
    const text = input.trim();
    if (!text || !article || !user || submitting) return;

    setSubmitting(true);

    if (replyTo) {
      const created = await postComment(
        user.id,
        article.id,
        text,
        displayName,
        replyTo.id
      );
      setSubmitting(false);

      if (created) {
        const reply: ThreadComment = {
          ...created,
          likes: 0,
          likedByMe: false,
          replies: [],
          isPlaceholder: false,
        };
        setComments((prev) => appendReplyToTree(prev, replyTo.id, reply));
        ensureThreadExpanded(replyTo.id);
        setInput("");
        setReplyTo(null);
        onCommentPosted?.();
        const count = await fetchCommentCount(article.id);
        emitArticleCommentUpdated({ articleId: article.id, commentCount: count });
        requestAnimationFrame(() => {
          document.getElementById(`comment-${created.id}`)?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        });
      }
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
      const count = await fetchCommentCount(article.id);
      emitArticleCommentUpdated({ articleId: article.id, commentCount: count });
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
        className={`absolute inset-0 backdrop-blur-md transition-opacity duration-200 ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        style={{ background: "var(--pocket-backdrop)" }}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="comment-sheet-title"
        className={`absolute inset-x-0 mx-auto flex w-full max-w-mobile flex-col overflow-hidden rounded-t-[28px] border border-[var(--pocket-border)] shadow-[0_-24px_80px_rgba(0,0,0,0.25)] transition-transform duration-200 ease-out ${
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
                <DiscussionThread
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
                  resetKey={sheetCycle}
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
              <UserAvatar
                name={displayName}
                avatarUrl={avatarUrl}
                size="md"
                className="mb-0.5"
              />

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
