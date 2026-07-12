"use client";

import { getUserInitials } from "@/lib/userIdentity";

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  avatarColor?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "h-8 w-8 text-[10px]",
  md: "h-9 w-9 text-[11px]",
  lg: "h-11 w-11 text-[13px]",
} as const;

export function UserAvatar({
  name,
  avatarUrl,
  avatarColor = "#3B6EF5",
  size = "md",
  className = "",
}: UserAvatarProps) {
  const sizeClass = SIZES[size];
  const initials = getUserInitials(name);

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        className={`relative z-[1] shrink-0 rounded-full object-cover ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`relative z-[1] flex shrink-0 items-center justify-center rounded-full font-bold text-white ${sizeClass} ${className}`}
      style={{ backgroundColor: avatarColor }}
    >
      {initials}
    </div>
  );
}
