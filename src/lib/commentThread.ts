import type { Comment } from "@/lib/types";

/** Fixed reaction set shown in the emoji picker — kept small and familiar
 * (mirrors the reaction sets in Instagram/Messenger-style pickers). */
export const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍"] as const;

export type ThreadComment = Comment & {
  /** emoji -> count, e.g. { "❤️": 3, "😂": 1 } */
  reactions: Record<string, number>;
  /** The emoji the current user picked, or null if they haven't reacted. */
  myReaction: string | null;
  reportedByMe: boolean;
  replies: ThreadComment[];
  isPlaceholder?: boolean;
};

export function buildDiscussionThread(
  apiComments: Comment[],
  reactionCounts: Map<string, Record<string, number>>,
  myReactions: Map<string, string>,
  reportedByUser: Set<string> = new Set()
): ThreadComment[] {
  const byId = new Map<string, ThreadComment>();

  for (const comment of apiComments) {
    byId.set(comment.id, {
      ...comment,
      reactions: reactionCounts.get(comment.id) ?? {},
      myReaction: myReactions.get(comment.id) ?? null,
      reportedByMe: reportedByUser.has(comment.id),
      replies: [],
      isPlaceholder: false,
    });
  }

  const roots: ThreadComment[] = [];

  for (const comment of byId.values()) {
    const parentId = comment.parentId;
    if (parentId && byId.has(parentId)) {
      byId.get(parentId)!.replies.push(comment);
    } else {
      roots.push(comment);
    }
  }

  return roots;
}

// Soft-deleted comments still render in the tree as "This comment was
// deleted" tombstones (so replies stay attached to something), but
// shouldn't count toward the visible total — matches the deleted_at filter
// fetchCommentCount() applies server-side. Without the isDeleted check
// here, deleting your own comment left the header count exactly where it
// was.
export function countThreadComments(comments: ThreadComment[]): number {
  return comments.reduce(
    (sum, comment) =>
      sum + (comment.isDeleted ? 0 : 1) + countThreadComments(comment.replies),
    0
  );
}

/**
 * Applies a reaction change to a comment: switching to a new emoji,
 * or clearing (nextEmoji = null) to remove the user's reaction entirely.
 */
export function updateCommentReactionInTree(
  comments: ThreadComment[],
  commentId: string,
  nextEmoji: string | null
): ThreadComment[] {
  return comments.map((comment) => {
    if (comment.id === commentId) {
      const reactions = { ...comment.reactions };
      const prevEmoji = comment.myReaction;

      if (prevEmoji) {
        const prevCount = (reactions[prevEmoji] ?? 1) - 1;
        if (prevCount <= 0) delete reactions[prevEmoji];
        else reactions[prevEmoji] = prevCount;
      }
      if (nextEmoji) {
        reactions[nextEmoji] = (reactions[nextEmoji] ?? 0) + 1;
      }

      return { ...comment, reactions, myReaction: nextEmoji };
    }

    if (comment.replies.length > 0) {
      return {
        ...comment,
        replies: updateCommentReactionInTree(comment.replies, commentId, nextEmoji),
      };
    }

    return comment;
  });
}

export const DELETED_COMMENT_TEXT = "This comment was deleted";

export function markCommentDeletedInTree(
  comments: ThreadComment[],
  commentId: string
): ThreadComment[] {
  return comments.map((comment) => {
    if (comment.id === commentId) {
      return { ...comment, isDeleted: true, text: DELETED_COMMENT_TEXT };
    }

    if (comment.replies.length > 0) {
      return {
        ...comment,
        replies: markCommentDeletedInTree(comment.replies, commentId),
      };
    }

    return comment;
  });
}

export function updateCommentReportInTree(
  comments: ThreadComment[],
  commentId: string
): ThreadComment[] {
  return comments.map((comment) => {
    if (comment.id === commentId) {
      return { ...comment, reportedByMe: true };
    }

    if (comment.replies.length > 0) {
      return {
        ...comment,
        replies: updateCommentReportInTree(comment.replies, commentId),
      };
    }

    return comment;
  });
}

export function appendReplyToTree(
  comments: ThreadComment[],
  parentId: string,
  reply: ThreadComment
): ThreadComment[] {
  return comments.map((comment) => {
    if (comment.id === parentId) {
      return {
        ...comment,
        replies: [reply, ...comment.replies],
      };
    }

    if (comment.replies.length > 0) {
      return {
        ...comment,
        replies: appendReplyToTree(comment.replies, parentId, reply),
      };
    }

    return comment;
  });
}

export function getAncestorIds(
  comments: ThreadComment[],
  commentId: string
): string[] {
  for (const comment of comments) {
    if (comment.id === commentId) return [];
    const nested = findAncestorPath(comment.replies, commentId, [comment.id]);
    if (nested) return nested;
  }
  return [];
}

function findAncestorPath(
  comments: ThreadComment[],
  targetId: string,
  path: string[]
): string[] | null {
  for (const comment of comments) {
    if (comment.id === targetId) return path;
    const nested = findAncestorPath(comment.replies, targetId, [
      ...path,
      comment.id,
    ]);
    if (nested) return nested;
  }
  return null;
}

export function collectCommentIds(comments: Comment[]): string[] {
  return comments.map((comment) => comment.id);
}
