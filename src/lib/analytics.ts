/**
 * Minimal, fire-and-forget owner-facing usage analytics.
 *
 * NOT the same thing as the XP/achievement activity log in progression.ts —
 * that log is localStorage-only, per-device, and never reaches the server,
 * so it's invisible to you as the app owner. This is what actually lets
 * you see real aggregate usage: query the analytics_events table directly
 * in the Supabase SQL editor (e.g. `select event_name, count(*) from
 * analytics_events group by event_name order by count(*) desc`).
 *
 * Deliberately dumb: no batching, no queue, no offline retry. Never
 * awaited by callers — a failed analytics write must never be able to
 * slow down or break the actual feature it's attached to.
 */

import { getSupabase } from "@/lib/supabase";

export type AnalyticsEventName =
  | "comment_posted"
  | "comment_reacted"
  | "comment_reported"
  | "comment_deleted"
  | "ticker_followed"
  | "ticker_unfollowed"
  | "article_liked"
  | "article_saved";

export function trackEvent(
  userId: string | null | undefined,
  eventName: AnalyticsEventName,
  entityId?: string,
  metadata?: Record<string, unknown>
): void {
  if (!userId) return;

  const supabase = getSupabase();
  void supabase
    .from("analytics_events")
    .insert({
      user_id: userId,
      event_name: eventName,
      entity_id: entityId ?? null,
      metadata: metadata ?? null,
    })
    .then(({ error }) => {
      if (error) console.error("trackEvent:", error.message);
    });
}
