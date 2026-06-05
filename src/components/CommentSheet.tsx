"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import type { Comment, NewsArticle } from "@/lib/types";
import {
  createComment,
  getCommentsForArticle,
} from "@/lib/comments";
import { BottomSheet } from "./BottomSheet";

interface CommentSheetProps {
  open: boolean;
  onClose: () => void;
  article: NewsArticle | null;
}

export function CommentSheet({ open, onClose, article }: CommentSheetProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (open && article) {
      setComments(getCommentsForArticle(article.id, article.ticker));
      setInput("");
    }
  }, [open, article]);

  const submit = () => {
    const text = input.trim();
    if (!text) return;
    setComments((c) => [createComment("you", text), ...c]);
    setInput("");
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={article ? `Comments · ${article.ticker}` : "Comments"}
      tall
    >
      <ul className="max-h-[55dvh] space-y-4 overflow-y-auto px-5 pb-4">
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
                  @{c.username}
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
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Add a comment..."
          data-no-drag
          className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-pocket-teal/50 focus:outline-none"
        />
        <button
          type="button"
          data-no-drag
          onClick={submit}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pocket-teal text-black active:scale-95"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </BottomSheet>
  );
}
