import type { User } from "@supabase/supabase-js";
import { loadProfileAvatar } from "./profileStorage";

export function getUserDisplayName(user: User | null | undefined): string {
  if (!user) return "Investor";
  const name = user.user_metadata?.display_name as string | undefined;
  if (name?.trim()) return name.trim();
  return user.email?.split("@")[0] ?? "Investor";
}

export function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "PF";
}

export function getUserAvatarUrl(userId: string | undefined | null): string | null {
  if (!userId) return null;
  return loadProfileAvatar(userId);
}
