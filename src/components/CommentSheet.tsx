"use client";

import { useCallback, useEffect, useState } from "react";
import { Send } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { Comment, NewsArticle } from "@/lib/types";
import { fetchComments, postComment } from "@/lib/userInteractions";
import { BottomSheet } from "./BottomSheet";

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

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Investor";

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
    }
  };

  const commentInput = (
    <div className="flex items-end gap-2.5">
      <div className="min-w-0 flex-1 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-2.5 focus-within:border-pocket-teal/40 focus-within:bg-white/[0.08]">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void submit()}
          placeholder={user ? "Add a comment…" : "Sign in to comment"}
          data-no-drag
          disabled={!user || submitting}
          className="w-full bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none disabled:opacity-50"
        />
      </div>
      <button
        type="button"
        data-no-drag
        onClick={() => void submit()}
        disabled={submitting || !user || !input.trim()}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pocket-teal text-black transition hover:bg-pocket-teal/90 active:scale-95 disabled:opacity-40"
        aria-label="Send"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={article ? `Comments · ${article.ticker}` : "Comments"}
      tall
      footer={commentInput}
    >
      <ul className="space-y-4 px-5 pb-4">
        {loading && comments.length === 0 && (
          <li className="py-8 text-center text-sm text-zinc-500">
            Loading comments…
          </li>
        )}
        {!loading && comments.length === 0 && (
          <li className="py-8 text-center text-sm text-zinc-500">
            No comments yet. Be the first.
          </li>
        )}
        {comments.map((c) => (
          <li key={c.id} className="flex gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: c.avatarColor }}
            >
              {c.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-white">
                  {c.username}
                </span>
                <span className="text-xs text-zinc-500">{c.timeAgo}</span>
              </div>
              <p className="mt-0.5 text-sm leading-relaxed text-zinc-300">
                {c.text}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </BottomSheet>
  );
}
