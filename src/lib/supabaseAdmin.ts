import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — bypasses Row Level Security entirely and
 * can call the auth.admin.* API (e.g. deleteUser).
 *
 * SERVER-ONLY. Never import this from a "use client" file or a browser
 * bundle would try to include the service role key. It's only referenced
 * from src/app/api/account/delete/route.ts, which Next.js never bundles
 * for the client — keep it that way.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (Project Settings → API → service_role
 * in the Supabase dashboard) — separate from NEXT_PUBLIC_SUPABASE_ANON_KEY,
 * and deliberately NOT prefixed with NEXT_PUBLIC_.
 */
export function getSupabaseAdmin(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
