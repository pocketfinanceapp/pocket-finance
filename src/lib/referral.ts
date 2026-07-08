import { getSiteUrl } from "@/lib/authRedirect";
import { getSupabase } from "@/lib/supabase";

const PENDING_REF_KEY = "pf-pending-referral";
const INTRO_SEEN_PREFIX = "pf-referral-intro-seen";

/** Deterministic short code from user id (fallback when DB row missing). */
export function deriveReferralCode(userId: string): string {
  return userId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function storePendingReferralCode(code: string): void {
  try {
    localStorage.setItem(PENDING_REF_KEY, code.trim().toUpperCase());
  } catch {
    /* ignore */
  }
}

export function getPendingReferralCode(): string | null {
  try {
    return localStorage.getItem(PENDING_REF_KEY);
  } catch {
    return null;
  }
}

export function clearPendingReferralCode(): void {
  try {
    localStorage.removeItem(PENDING_REF_KEY);
  } catch {
    /* ignore */
  }
}

export function captureReferralFromUrl(): void {
  if (typeof window === "undefined") return;
  const ref = new URLSearchParams(window.location.search).get("ref");
  if (ref?.trim()) {
    storePendingReferralCode(ref.trim());
    const url = new URL(window.location.href);
    url.searchParams.delete("ref");
    const search = url.searchParams.toString();
    window.history.replaceState(
      {},
      "",
      url.pathname + (search ? `?${search}` : "")
    );
  }
}

export function hasSeenReferralIntro(userId: string): boolean {
  try {
    return localStorage.getItem(`${INTRO_SEEN_PREFIX}-${userId}`) === "1";
  } catch {
    return true;
  }
}

export function markReferralIntroSeen(userId: string): void {
  try {
    localStorage.setItem(`${INTRO_SEEN_PREFIX}-${userId}`, "1");
  } catch {
    /* ignore */
  }
}

export function getReferralLink(code: string): string {
  return `${getSiteUrl()}/app?ref=${encodeURIComponent(code)}`;
}

export async function ensureReferralCode(userId: string): Promise<string> {
  const supabase = getSupabase();
  const fallback = deriveReferralCode(userId);

  const { data: existing } = await supabase
    .from("referral_codes")
    .select("code")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.code) return existing.code;

  const { data: inserted, error } = await supabase
    .from("referral_codes")
    .insert({ user_id: userId, code: fallback })
    .select("code")
    .maybeSingle();

  if (!error && inserted?.code) return inserted.code;

  return fallback;
}

export async function getReferralCount(userId: string): Promise<number> {
  const supabase = getSupabase();
  const { count, error } = await supabase
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("referrer_id", userId);

  if (error || count == null) return 0;
  return count;
}

/** Record referral after signup when a valid pending code exists. */
export async function recordReferralIfPending(
  newUserId: string
): Promise<void> {
  const pending = getPendingReferralCode();
  if (!pending) return;

  const supabase = getSupabase();

  const { data: referrer } = await supabase
    .from("referral_codes")
    .select("user_id")
    .eq("code", pending.toUpperCase())
    .maybeSingle();

  clearPendingReferralCode();

  if (!referrer?.user_id || referrer.user_id === newUserId) return;

  await supabase.from("referrals").insert({
    referrer_id: referrer.user_id,
    referred_id: newUserId,
  });
}

export async function copyReferralLink(code: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(getReferralLink(code));
    return true;
  } catch {
    return false;
  }
}
