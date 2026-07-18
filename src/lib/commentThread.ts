import type { Comment } from "@/lib/types";

export type ThreadComment = Comment & {
  likes: number;
  likedByMe: boolean;
  reportedByMe: boolean;
  replies: ThreadComment[];
  isPlaceholder?: boolean;
};

export function buildDiscussionThread(
  apiComments: Comment[],
  likeCounts: Map<string, number>,
  likedByUser: Set<string>,
  reportedByUser: Set<string> = new Set()
): ThreadComment[] {
  const byId = new Map<string, ThreadComment>();

  for (const comment of apiComments) {
    byId.set(comment.id, {
      ...comment,
      likes: likeCounts.get(comment.id) ?? 0,
      likedByMe: likedByUser.has(comment.id),
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

export function countThreadComments(comments: ThreadComment[]): number {
  return comments.reduce(
    (sum, comment) => sum + 1 + countThreadComments(comment.replies),
    0
  );
}

export function updateCommentLikeInTree(
  comments: ThreadComment[],
  commentId: string,
  liked: boolean,
  likeCount?: number
): ThreadComment[] {
  return comments.map((comment) => {
    if (comment.id === commentId) {
      const nextCount =
        likeCount ??
        Math.max(0, comment.likes + (liked ? (comment.likedByMe ? 0 : 1) : comment.likedByMe ? -1 : 0));
      return {
        ...comment,
        likedByMe: liked,
        likes: nextCount,
      };
    }

    if (comment.replies.length > 0) {
      return {
        ...comment,
        replies: updateCommentLikeInTree(
          comment.replies,
          commentId,
          liked,
          likeCount
        ),
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
