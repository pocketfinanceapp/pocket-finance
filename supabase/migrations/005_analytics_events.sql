-- Minimal owner-facing usage analytics. Distinct from the XP/achievement
-- activity log in src/lib/progression.ts, which is localStorage-only,
-- per-device, and never reaches the server — this table is what actually
-- lets you see real aggregate usage across users by querying it directly
-- in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name
  ON public.analytics_events (event_name);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at
  ON public.analytics_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id
  ON public.analytics_events (user_id);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Insert-only from the client — no SELECT policy is needed since the app
-- itself never reads this data back; you query it directly via the
-- Supabase SQL editor (which runs as a role that bypasses RLS).
CREATE POLICY "Users can insert their own analytics events"
  ON public.analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
