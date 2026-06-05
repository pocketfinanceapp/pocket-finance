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

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={article ? `Comments · ${article.ticker}` : "Comments"}
      tall
    >
      <ul className="max-h-[55dvh] space-y-4 overflow-y-auto px-5 pb-4">
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

      <div className="flex gap-2 border-t border-white/10 px-4 py-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void submit()}
          placeholder="Add a comment..."
          data-no-drag
          disabled={!user}
          className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-pocket-teal/50 focus:outline-none disabled:opacity-50"
        />
        <button
          type="button"
          data-no-drag
          onClick={() => void submit()}
          disabled={submitting || !user}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pocket-teal text-black active:scale-95 disabled:opacity-50"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </BottomSheet>
  );
}
