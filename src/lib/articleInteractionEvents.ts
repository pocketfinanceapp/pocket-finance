export const PF_ARTICLE_LIKE_UPDATED = "pf-article-like-updated";
export const PF_ARTICLE_COMMENT_UPDATED = "pf-article-comment-updated";

export interface ArticleLikeUpdatedDetail {
  articleId: string;
  likeCount: number;
  liked?: boolean;
}

export interface ArticleCommentUpdatedDetail {
  articleId: string;
  commentCount: number;
}

export function emitArticleLikeUpdated(detail: ArticleLikeUpdatedDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ArticleLikeUpdatedDetail>(PF_ARTICLE_LIKE_UPDATED, {
      detail,
    })
  );
}

export function emitArticleCommentUpdated(
  detail: ArticleCommentUpdatedDetail
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ArticleCommentUpdatedDetail>(PF_ARTICLE_COMMENT_UPDATED, {
      detail,
    })
  );
}
