-- Account deletion support.
--
-- comments.user_id currently cascades on delete (from 001), which means
-- deleting a user's auth account would hard-delete every comment they ever
-- wrote — and since comments.parent_id also cascades (from 002), that would
-- take down every reply OTHER users made to those comments too. That's
-- collateral damage on someone else's content, not just the deleted user's.
--
-- Switching to ON DELETE SET NULL means: the app anonymizes the user's own
-- comments first (comment_text + display_name replaced, deleted_at set —
-- same soft-delete convention as a manual comment delete), then the auth
-- user is deleted, which nulls out user_id on those now-anonymized rows.
-- Reply threads stay intact for everyone else.

ALTER TABLE public.comments ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.comments
  DROP CONSTRAINT IF EXISTS comments_user_id_fkey;

ALTER TABLE public.comments
  ADD CONSTRAINT comments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE SET NULL;

-- Everything else (liked_articles, saved_articles, comment_reactions,
-- comment_reports, user_stats, analytics_events) stays ON DELETE CASCADE —
-- those rows are entirely the deleted user's own data with no other user
-- depending on them, so they're fine to disappear along with the account.
