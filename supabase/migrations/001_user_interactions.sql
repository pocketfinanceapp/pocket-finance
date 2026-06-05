-- Pocket Finance: likes, saved articles, comments
-- Run in Supabase SQL Editor or via supabase db push

-- ---------------------------------------------------------------------------
-- liked_articles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.liked_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  article_id TEXT NOT NULL,
  article_title TEXT NOT NULL,
  article_url TEXT NOT NULL,
  ticker TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_liked_articles_article_id
  ON public.liked_articles (article_id);

CREATE INDEX IF NOT EXISTS idx_liked_articles_user_id
  ON public.liked_articles (user_id);

ALTER TABLE public.liked_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all likes"
  ON public.liked_articles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own likes"
  ON public.liked_articles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON public.liked_articles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- saved_articles (watchlist)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  article_id TEXT NOT NULL,
  article_title TEXT NOT NULL,
  article_url TEXT NOT NULL,
  ticker TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_articles_user_id
  ON public.saved_articles (user_id);

CREATE INDEX IF NOT EXISTS idx_saved_articles_article_id
  ON public.saved_articles (article_id);

ALTER TABLE public.saved_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own saved articles"
  ON public.saved_articles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved articles"
  ON public.saved_articles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved articles"
  ON public.saved_articles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- comments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  article_id TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_article_id
  ON public.comments (article_id);

CREATE INDEX IF NOT EXISTS idx_comments_created_at
  ON public.comments (created_at DESC);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all comments"
  ON public.comments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own comments"
  ON public.comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
