-- Comment reports — basic moderation. A comment that accumulates enough
-- reports (see AUTO_HIDE_REPORT_THRESHOLD in src/lib/userInteractions.ts)
-- is filtered out of fetchComments() automatically, without needing a human
-- moderator to review every single report.

CREATE TABLE IF NOT EXISTS public.comment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES public.comments (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, comment_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_reports_comment_id
  ON public.comment_reports (comment_id);

CREATE INDEX IF NOT EXISTS idx_comment_reports_user_id
  ON public.comment_reports (user_id);

ALTER TABLE public.comment_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all comment reports"
  ON public.comment_reports
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own comment reports"
  ON public.comment_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comment reports"
  ON public.comment_reports
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
