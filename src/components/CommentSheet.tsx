"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MessageCircle, Send, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { Comment, NewsArticle } from "@/lib/types";
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
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Investor";

  const userInitial = displayName.charAt(0).toUpperCase();

  const loadComments = useCallback(async () => {
    if (!article) return;
    setLoading(true);
    const rows = await fetchComments(article.id);
    setComments(rows);
    setLoading(false);
  }, [article]);

  useEffect(() => {
    if (open && article) {
      setInput("");
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

  const submit = async () => {
    const text = input.trim();
    if (!text || !article || !user || submitting) return;

    setSubmitting(true);
    const created = await postComment(
      user.id,
      article.id,
      text,
      displayName
    );
    setSubmitting(false);

    if (created) {
      setComments((c) => [created, ...c]);
      setInput("");
      onCommentPosted?.();
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  };

  if (!mounted || typeof document === "undefined") return null;

  const composerBottom = `max(0.75rem, env(safe-area-inset-bottom, 0px))`;
  const sheetBottom = keyboardInset > 0 ? `${keyboardInset}px` : "0px";

  return createPortal(
    <div
      className="fixed inset-0 z-[200]"
      data-no-drag
      data-interactive
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close comments"
        className={`absolute inset-0 bg-[#030305]/80 backdrop-blur-md transition-opacity duration-300 ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="comment-sheet-title"
        className={`absolute inset-x-0 mx-auto flex w-full max-w-mobile flex-col overflow-hidden rounded-t-[28px] border border-white/[0.08] shadow-[0_-24px_80px_rgba(0,0,0,0.65)] transition-transform duration-300 ease-out ${
          entered ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          bottom: sheetBottom,
          maxHeight: keyboardInset > 0 ? "min(72dvh, calc(100dvh - 1rem))" : "min(88dvh, calc(100dvh - 0.5rem))",
          background:
            "linear-gradient(180deg, rgba(16,18,32,0.98) 0%, rgba(8,9,14,0.99) 100%)",
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

        <div className="flex shrink-0 flex-col items-center px-5 pt-3">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-white/[0.06] px-5 pb-4 pt-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(59,110,245,0.28), rgba(0,198,198,0.18))",
                  border: "1px solid rgba(0,198,198,0.22)",
                }}
              >
                <MessageCircle className="h-4 w-4 text-[#00C6C6]" strokeWidth={2.25} />
              </div>
              <div className="min-w-0">
                <h2 id="comment-sheet-title" className="text-[17px] font-bold text-white">
                  Discussion
                </h2>
                {article && (
                  <p className="mt-0.5 truncate text-[12px] text-zinc-500">
                    {article.headline}
                  </p>
                )}
              </div>
            </div>

            {article && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#00C6C6]/15 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-[#00C6C6]">
                  {article.ticker}
                </span>
                <span className="text-[11px] font-medium text-zinc-500">
                  {comments.length} {comments.length === 1 ? "comment" : "comments"}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            data-no-drag
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-zinc-400 active:bg-white/[0.10] active:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <ul
          ref={listRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4"
        >
          {loading && comments.length === 0 && (
            <li className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-8 w-8 animate-pulse rounded-full bg-white/[0.06]" />
              <p className="mt-4 text-sm text-zinc-500">Loading comments…</p>
            </li>
          )}

          {!loading && comments.length === 0 && (
            <li className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(59,110,245,0.12), rgba(0,198,198,0.08))",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <MessageCircle className="h-6 w-6 text-zinc-500" />
              </div>
              <p className="mt-4 text-[15px] font-semibold text-white">
                Start the conversation
              </p>
              <p className="mt-1 max-w-[240px] text-[13px] leading-relaxed text-zinc-500">
                Share your take on this story — be the first to comment.
              </p>
            </li>
          )}

          {comments.map((c, i) => (
            <li
              key={c.id}
              className={`flex gap-3 ${i > 0 ? "mt-4 border-t border-white/[0.04] pt-4" : ""}`}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm"
                style={{ backgroundColor: c.avatarColor }}
              >
                {c.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="rounded-2xl rounded-tl-md px-3.5 py-2.5"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="flex items-baseline gap-2">
                    <span className="text-[13px] font-semibold text-white">
                      {c.username}
                    </span>
                    <span className="text-[10px] text-zinc-500">{c.timeAgo}</span>
                  </div>
                  <p className="mt-1 text-[14px] leading-relaxed text-zinc-300">
                    {c.text}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div
          className="shrink-0 border-t border-white/[0.08] px-4 pt-3"
          style={{
            paddingBottom: composerBottom,
            background:
              "linear-gradient(180deg, rgba(8,9,14,0.72) 0%, rgba(8,9,14,0.98) 100%)",
            backdropFilter: "blur(12px)",
          }}
        >
          {!user ? (
            <p className="py-2 text-center text-[13px] text-zinc-500">
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
                className="min-w-0 flex-1 rounded-[20px] px-1 py-1"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                }}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Write a comment…"
                  rows={1}
                  data-no-drag
                  disabled={submitting}
                  className="max-h-28 min-h-[44px] w-full resize-none bg-transparent px-3 py-2.5 text-[15px] leading-snug text-white placeholder:text-zinc-500 focus:outline-none disabled:opacity-50"
                  onFocus={() => {
                    requestAnimationFrame(() => {
                      inputRef.current?.scrollIntoView({ block: "nearest" });
                    });
                  }}
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
                  color: input.trim() && !submitting ? "#000" : "rgba(255,255,255,0.4)",
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
