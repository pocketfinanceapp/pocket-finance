"use client";

import { usePathname, useRouter } from "next/navigation";
import { BarChart2, Bookmark, Plus, User } from "lucide-react";
import { BOTTOM_NAV_HEIGHT } from "@/lib/layout";

export type NavTab = "home" | "markets" | "create" | "watchlist" | "profile";

interface BottomNavProps {
  active: NavTab;
  onCreate?: () => void;
}

function tabFromPath(pathname: string): NavTab {
  if (pathname === "/markets") return "markets";
  if (pathname === "/watchlist") return "watchlist";
  return "home";
}

export function BottomNav({ active, onCreate }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const resolvedActive = active ?? tabFromPath(pathname);

  const homeActive = resolvedActive === "home";
  const marketsActive = resolvedActive === "markets";
  const watchlistActive = resolvedActive === "watchlist";
  const profileActive = resolvedActive === "profile";

  const navigate = (tab: NavTab) => {
    switch (tab) {
      case "home":
        router.push("/");
        break;
      case "markets":
        router.push("/markets");
        break;
      case "watchlist":
        router.push("/watchlist");
        break;
      case "profile":
        router.push("/?tab=profile");
        break;
      case "create":
        if (pathname === "/" && onCreate) {
          onCreate();
        } else {
          router.push("/?sheet=create");
        }
        break;
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-mobile -translate-x-1/2 flex-col justify-end border-t border-white/[0.06] bg-black"
      data-no-drag
      data-interactive
      style={{ height: BOTTOM_NAV_HEIGHT }}
    >
      <div className="relative flex h-full items-end justify-around px-2 pb-1">
        <NavItem
          label="Home"
          active={homeActive}
          onClick={() => navigate("home")}
        >
          <HomeIcon active={homeActive} />
        </NavItem>

        <NavItem
          label="Markets"
          active={marketsActive}
          onClick={() => navigate("markets")}
        >
          <BarChart2
            className={`h-[22px] w-[22px] ${marketsActive ? "text-[#00C6C6]" : "text-white/45"}`}
            strokeWidth={marketsActive ? 2.5 : 2}
          />
        </NavItem>

        <button
          type="button"
          aria-label="Create"
          data-no-drag
          onClick={() => navigate("create")}
          className="relative -top-3 flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-white text-black shadow-[0_4px_24px_rgba(255,255,255,0.18)] transition-transform active:scale-95"
        >
          <Plus className="h-7 w-7" strokeWidth={2.25} />
        </button>

        <NavItem
          label="Watchlist"
          active={watchlistActive}
          onClick={() => navigate("watchlist")}
        >
          <Bookmark
            className={`h-[22px] w-[22px] ${watchlistActive ? "text-[#00C6C6]" : "text-white/45"}`}
            strokeWidth={watchlistActive ? 2.5 : 2}
          />
        </NavItem>

        <NavItem
          label="Profile"
          active={profileActive}
          onClick={() => navigate("profile")}
        >
          <User
            className={`h-[22px] w-[22px] ${profileActive ? "text-[#00C6C6]" : "text-white/45"}`}
            strokeWidth={profileActive ? 2.5 : 2}
          />
        </NavItem>
      </div>
    </nav>
  );
}

/** Simple inline house icon — no external icon libraries */
function HomeIcon({ active }: { active: boolean }) {
  const stroke = active ? "#00C6C6" : "rgba(255,255,255,0.45)";
  const fill = active ? "#3B6EF5" : "none";

  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 01-1.5 1.5H15v-7.5H9V21.5H4.5A1.5 1.5 0 013 20V10.5z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NavItem({
  children,
  label,
  active,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-no-drag
      onClick={onClick}
      className="flex min-w-[56px] flex-col items-center gap-0.5 pb-0.5 transition-opacity active:opacity-70"
    >
      {children}
      <span
        className={`text-[10px] font-medium tracking-wide ${
          active
            ? "bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] bg-clip-text text-transparent"
            : "text-white/45"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
