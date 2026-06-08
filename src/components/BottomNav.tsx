"use client";

import { usePathname, useRouter } from "next/navigation";
import { BarChart2, Bookmark, User } from "lucide-react";
import { useNavigationOptional } from "@/context/NavigationContext";
import { BOTTOM_NAV_HEIGHT } from "@/lib/layout";

export type NavTab = "home" | "markets" | "watchlist" | "profile";

interface BottomNavProps {
  active: NavTab;
}

function tabFromPath(pathname: string): NavTab {
  if (pathname === "/markets") return "markets";
  if (pathname === "/watchlist") return "watchlist";
  return "home";
}

export function BottomNav({ active }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const navigation = useNavigationOptional();
  const resolvedActive = active ?? navigation?.navTab ?? tabFromPath(pathname);

  const homeActive = resolvedActive === "home";
  const marketsActive = resolvedActive === "markets";
  const watchlistActive = resolvedActive === "watchlist";
  const profileActive = resolvedActive === "profile";

  const navigate = (tab: NavTab) => {
    if (navigation) {
      navigation.navigate(tab);
      return;
    }

    switch (tab) {
      case "home":
        router.replace("/", { scroll: false });
        break;
      case "markets":
        router.replace("/markets", { scroll: false });
        break;
      case "watchlist":
        router.replace("/watchlist", { scroll: false });
        break;
      case "profile":
        router.replace("/?tab=profile", { scroll: false });
        break;
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex flex-col justify-end border-t border-white/[0.06] bg-black"
      data-no-drag
      data-interactive
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: BOTTOM_NAV_HEIGHT,
      }}
    >
      <div className="grid h-full w-full grid-cols-4 items-end pb-1">
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
      className="flex flex-col items-center justify-end gap-0.5 pb-0.5 transition-opacity active:opacity-70"
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
