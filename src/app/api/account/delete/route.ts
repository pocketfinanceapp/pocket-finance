import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const DELETED_COMMENT_TEXT = "This comment was deleted";
const DELETED_USER_LABEL = "Deleted user";

/**
 * Permanently deletes the calling user's account.
 *
 * The client sends its current Supabase access token; we verify it
 * server-side (via the service role client) to resolve the real user id —
 * never trust a client-supplied id for a destructive operation like this.
 *
 * Order matters: comments are anonymized *before* the auth user is deleted,
 * because deleting the auth user cascades and would otherwise wipe the raw
 * comment text along with it before we get a chance to preserve the thread
 * shell for other users' replies. See migration 006 for the FK behavior
 * this relies on (comments.user_id → SET NULL, not CASCADE).
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (err) {
    console.error("[account/delete] admin client unavailable:", err);
    return NextResponse.json(
      { error: "Account deletion isn't available right now" },
      { status: 503 }
    );
  }

  const { data: userData, error: userError } =
    await supabaseAdmin.auth.getUser(token);

  if (userError || !userData.user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const userId = userData.user.id;

  const { error: anonymizeError } = await supabaseAdmin
    .from("comments")
    .update({
      comment_text: DELETED_COMMENT_TEXT,
      display_name: DELETED_USER_LABEL,
      deleted_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (anonymizeError) {
    console.error(
      "[account/delete] failed to anonymize comments:",
      anonymizeError.message
    );
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }

  const { error: deleteError } =
    await supabaseAdmin.auth.admin.deleteUser(userId);

  if (deleteError) {
    console.error(
      "[account/delete] failed to delete auth user:",
      deleteError.message
    );
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
