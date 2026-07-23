"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, SmilePlus, Trash2 } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { REACTION_EMOJIS, type ThreadComment } from "@/lib/commentThread";

const REPLY_INDENT = "ml-8";

export interface DiscussionThreadProps {
  comment: ThreadComment;
  depth: number;
  currentUserId: string | null;
  onReact: (id: string, emoji: string) => void;
  onReply: (comment: ThreadComment) => void;
  onReport: (id: string) => void;
  onDelete: (id: string) => void;
  replyTargetId: string | null;
  expandedIds: Set<string>;
  onToggleExpanded: (id: string, open: boolean) => void;
  resetKey: number;
  renderText?: (text: string) => React.ReactNode;
}

export function DiscussionThread({
  comment,
  depth,
  currentUserId,
  onReact,
  onReply,
  onReport,
  onDelete,
  replyTargetId,
  expandedIds,
  onToggleExpanded,
  resetKey,
  renderText,
}: DiscussionThreadProps) {
  const [localExpanded, setLocalExpanded] = useState(depth === 0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const hasReplies = comment.replies.length > 0;
  const expanded = expandedIds.has(comment.id) || localExpanded;
  const isReplyTarget = replyTargetId === comment.id;
  const isOwn = Boolean(currentUserId && comment.userId === currentUserId);
  const reactionEntries = Object.entries(comment.reactions).filter(([, count]) => count > 0);

  useEffect(() => {
    setPickerOpen(false);
    setConfirmingDelete(false);
  }, [resetKey]);

  const toggleExpanded = () => {
    const next = !expanded;
    setLocalExpanded(next);
    onToggleExpanded(comment.id, next);
  };

  const pickEmoji = (emoji: string) => {
    onReact(comment.id, emoji);
    setPickerOpen(false);
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
            {comment.isDeleted ? (
              <p className="mt-1 text-[14px] italic leading-relaxed text-pocket-muted">
                {comment.text}
              </p>
            ) : (
              <CommentBody
                text={comment.text}
                resetKey={resetKey}
                renderText={renderText}
              />
            )}
          </div>

          {!comment.isDeleted && (
            <>
              {reactionEntries.length > 0 && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  {reactionEntries.map(([emoji, count]) => (
                    <button
                      key={emoji}
                      type="button"
                      data-no-drag
                      onClick={() => pickEmoji(emoji)}
                      className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                        comment.myReaction === emoji
                          ? "border-[#00C6C6]/45 bg-[#00C6C6]/[0.1] text-[#00C6C6]"
                          : "border-[var(--pocket-border)] text-pocket-muted hover:text-pocket-text"
                      }`}
                    >
                      <span>{emoji}</span>
                      <span className="tabular-nums">{count}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-1.5 flex items-center gap-1">
                <button
                  type="button"
                  data-no-drag
                  onClick={() => setPickerOpen((v) => !v)}
                  className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium transition-colors ${
                    comment.myReaction
                      ? "text-[#00C6C6]"
                      : "text-pocket-muted hover:text-pocket-text"
                  }`}
                >
                  {comment.myReaction ? (
                    <span>{comment.myReaction}</span>
                  ) : (
                    <SmilePlus className="h-3.5 w-3.5" strokeWidth={2.25} />
                  )}
                  React
                </button>

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

                {isOwn && (
                  confirmingDelete ? (
                    <div className="flex items-center gap-0.5 rounded-full bg-red-500/10 pl-2 pr-0.5">
                      <span className="text-[11px] font-medium text-red-400">Delete?</span>
                      <button
                        type="button"
                        data-no-drag
                        onClick={() => {
                          setConfirmingDelete(false);
                          onDelete(comment.id);
                        }}
                        className="rounded-full px-2 py-1 text-[11px] font-semibold text-red-400 transition-colors hover:text-red-300"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        data-no-drag
                        onClick={() => setConfirmingDelete(false)}
                        className="rounded-full px-2 py-1 text-[11px] font-medium text-pocket-muted transition-colors hover:text-pocket-text"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      data-no-drag
                      onClick={() => setConfirmingDelete(true)}
                      className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-pocket-muted transition-colors hover:text-red-400"
                      aria-label="Delete comment"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                    </button>
                  )
                )}
              </div>

              {pickerOpen && (
                <div className="mt-1.5 flex w-fit items-center gap-1 rounded-full border border-[var(--pocket-border)] bg-[var(--pocket-sheet)] px-2 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      data-no-drag
                      onClick={() => pickEmoji(emoji)}
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-[17px] leading-none transition-transform active:scale-90 ${
                        comment.myReaction === emoji ? "bg-[#00C6C6]/15" : "hover:bg-[var(--pocket-surface-hover)]"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

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
                  currentUserId={currentUserId}
                  onReact={onReact}
                  onReply={onReply}
                  onReport={onReport}
                  onDelete={onDelete}
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
