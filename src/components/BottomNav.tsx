"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BarChart2, Bookmark, Compass } from "lucide-react";
import { useNavigationOptional } from "@/context/NavigationContext";
import { APP_BASE, appPath } from "@/lib/appPaths";
import { BOTTOM_NAV_HEIGHT } from "@/lib/layout";
import { getProgressionState } from "@/lib/progression";
import { ProfileNavIcon } from "@/components/icons/ProfileNavIcon";

export type NavTab = "home" | "markets" | "browse" | "watchlist" | "profile";

interface BottomNavProps {
  active: NavTab;
}

function tabFromPath(pathname: string): NavTab {
  if (!pathname.startsWith(APP_BASE)) return "home";
  if (pathname.startsWith(appPath("browse"))) return "browse";
  if (pathname === appPath("markets")) return "markets";
  if (pathname === appPath("watchlist")) return "watchlist";
  if (pathname === appPath("profile")) return "profile";
  return "home";
}

export function BottomNav({ active }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const navigation = useNavigationOptional();
  const [profileLevel, setProfileLevel] = useState(1);

  useEffect(() => {
    const sync = () => setProfileLevel(getProgressionState().level);
    sync();
    window.addEventListener("pf-progression-updated", sync);
    return () => window.removeEventListener("pf-progression-updated", sync);
  }, []);

  const resolvedActive = active ?? navigation?.navTab ?? tabFromPath(pathname);

  const homeActive = resolvedActive === "home";
  const marketsActive = resolvedActive === "markets";
  const browseActive = resolvedActive === "browse";
  const watchlistActive = resolvedActive === "watchlist";
  const profileActive = resolvedActive === "profile";

  const navigate = (tab: NavTab) => {
    if (navigation) {
      navigation.navigate(tab);
      return;
    }

    switch (tab) {
      case "home":
        router.replace(APP_BASE, { scroll: false });
        break;
      case "markets":
        router.replace(appPath("markets"), { scroll: false });
        break;
      case "browse":
        router.replace(appPath("browse"), { scroll: false });
        break;
      case "watchlist":
        router.replace(appPath("watchlist"), { scroll: false });
        break;
      case "profile":
        router.replace(appPath("profile"), { scroll: false });
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
      <div className="grid h-full w-full grid-cols-5 items-end pb-1">
        <NavItem
          label="Markets"
          active={marketsActive}
          onClick={() => navigate("markets")}
        >
          <BarChart2
            className={`h-[26px] w-[26px] ${marketsActive ? "text-[#00C6C6]" : "text-white/45"}`}
            strokeWidth={marketsActive ? 2.5 : 2}
          />
        </NavItem>

        <NavItem
          label="Watchlist"
          active={watchlistActive}
          onClick={() => navigate("watchlist")}
        >
          <Bookmark
            className={`h-[26px] w-[26px] ${watchlistActive ? "text-[#00C6C6]" : "text-white/45"}`}
            strokeWidth={watchlistActive ? 2.5 : 2}
          />
        </NavItem>

        <NavItem
          label="Home"
          active={homeActive}
          onClick={() => navigate("home")}
        >
          <HomeIcon active={homeActive} />
        </NavItem>

        <NavItem
          label="Explore"
          active={browseActive}
          onClick={() => navigate("browse")}
        >
          <Compass
            className={`h-[26px] w-[26px] ${browseActive ? "text-[#00C6C6]" : "text-white/45"}`}
            strokeWidth={browseActive ? 2.5 : 2}
          />
        </NavItem>

        <NavItem
          label="Profile"
          active={profileActive}
          onClick={() => navigate("profile")}
        >
          <ProfileNavIcon active={profileActive} level={profileLevel} />
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
      width="26"
      height="26"
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
