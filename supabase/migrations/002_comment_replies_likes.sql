-- Comment replies (parent_id) and per-comment likes

ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.comments (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_comments_parent_id
  ON public.comments (parent_id);

-- ---------------------------------------------------------------------------
-- comment_likes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES public.comments (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, comment_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id
  ON public.comment_likes (comment_id);

CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id
  ON public.comment_likes (user_id);

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all comment likes"
  ON public.comment_likes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own comment likes"
  ON public.comment_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comment likes"
  ON public.comment_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
