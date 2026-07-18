"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Heart } from "lucide-react";
import { PopReaction } from "@/components/PopReaction";
import { UserAvatar } from "@/components/UserAvatar";
import type { ThreadComment } from "@/lib/commentThread";

const REPLY_INDENT = "ml-8";

export interface DiscussionThreadProps {
  comment: ThreadComment;
  depth: number;
  onLike: (id: string) => void;
  onReply: (comment: ThreadComment) => void;
  onReport: (id: string) => void;
  replyTargetId: string | null;
  expandedIds: Set<string>;
  onToggleExpanded: (id: string, open: boolean) => void;
  resetKey: number;
  renderText?: (text: string) => React.ReactNode;
}

export function DiscussionThread({
  comment,
  depth,
  onLike,
  onReply,
  onReport,
  replyTargetId,
  expandedIds,
  onToggleExpanded,
  resetKey,
  renderText,
}: DiscussionThreadProps) {
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
      className={depth === 0 ? "py-2" : "pt-2.5"}
    >
      <div className="flex gap-3">
        <UserAvatar
          name={comment.username}
          avatarUrl={comment.avatarUrl}
          avatarColor={comment.avatarColor}
          size={depth > 0 ? "sm" : "md"}
        />

        <div className="min-w-0 flex-1">
          <div
            className={`rounded-2xl border px-3.5 py-2.5 transition-colors ${
              isReplyTarget
                ? "border-[#00C6C6]/45 bg-[#00C6C6]/[0.07]"
                : "border-[var(--pocket-border)] bg-[var(--pocket-surface-hover)]"
            }`}
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-[13px] font-semibold text-pocket-text">
                {comment.username}
              </span>
              <span className="text-[10px] text-pocket-muted">{comment.timeAgo}</span>
            </div>
            <CommentBody
              text={comment.text}
              resetKey={resetKey}
              renderText={renderText}
            />
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

            <button
              type="button"
              data-no-drag
              disabled={comment.reportedByMe}
              onClick={() => onReport(comment.id)}
              className={`rounded-full px-2 py-1 text-[11px] font-medium transition-colors ${
                comment.reportedByMe
                  ? "text-pocket-muted/60"
                  : "text-pocket-muted hover:text-pocket-text"
              }`}
            >
              {comment.reportedByMe ? "Reported" : "Report"}
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
            <div className={`mt-2 space-y-0 ${REPLY_INDENT}`}>
              {comment.replies.map((reply) => (
                <DiscussionThread
                  key={reply.id}
                  comment={reply}
                  depth={depth + 1}
                  onLike={onLike}
                  onReply={onReply}
                  onReport={onReport}
                  replyTargetId={replyTargetId}
                  expandedIds={expandedIds}
                  onToggleExpanded={onToggleExpanded}
                  resetKey={resetKey}
                  renderText={renderText}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function CommentBody({
  text,
  resetKey,
  renderText,
}: {
  text: string;
  resetKey: number;
  renderText?: (text: string) => React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    setExpanded(false);
  }, [resetKey]);

  const isLong = text.length > 160 || text.split("\n").length > 3;
  const content = renderText ? renderText(text) : text;

  if (!isLong) {
    return (
      <p className="mt-1 text-[14px] leading-relaxed text-pocket-text">{content}</p>
    );
  }

  return (
    <div className="mt-1">
      <p
        className={`text-[14px] leading-relaxed text-pocket-text ${
          expanded ? "" : "line-clamp-4"
        }`}
      >
        {content}
      </p>
      <button
        type="button"
        data-no-drag
        onClick={() => setExpanded((v) => !v)}
        className="mt-1 text-[11px] font-semibold text-[#00C6C6] active:opacity-70"
      >
        {expanded ? "Show less" : "Read more"}
      </button>
    </div>
  );
}
