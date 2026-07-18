-- Soft-delete for comments + emoji reactions (replaces the plain heart like).

-- ---------------------------------------------------------------------------
-- Soft delete
-- ---------------------------------------------------------------------------
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Authors need to be able to soft-delete (UPDATE) their own comments. The
-- original migration only granted SELECT/INSERT, so this policy is new.
CREATE POLICY "Users can update their own comments"
  ON public.comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Emoji reactions — one reaction per user per comment. Tapping a different
-- emoji swaps it; tapping the same emoji again removes it (handled in app
-- code via upsert/delete, not here).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES public.comments (id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, comment_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id
  ON public.comment_reactions (comment_id);

CREATE INDEX IF NOT EXISTS idx_comment_reactions_user_id
  ON public.comment_reactions (user_id);

ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all comment reactions"
  ON public.comment_reactions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own comment reactions"
  ON public.comment_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comment reactions"
  ON public.comment_reactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comment reactions"
  ON public.comment_reactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
