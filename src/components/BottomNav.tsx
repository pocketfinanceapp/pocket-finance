"use client";

import { BarChart2, Bookmark, Plus, User } from "lucide-react";

export type NavTab = "home" | "markets" | "create" | "watchlist" | "profile";

interface BottomNavProps {
  active: NavTab;
  onNavigate: (tab: NavTab) => void;
}

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  const homeActive = active === "home";
  const marketsActive = active === "markets";
  const watchlistActive = active === "watchlist";
  const profileActive = active === "profile";

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-mobile -translate-x-1/2 border-t border-white/[0.06] bg-[#0a0a0a]/95 backdrop-blur-xl"
      data-no-drag
      data-interactive
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <div className="relative flex h-[58px] items-end justify-around px-2 pb-1">
        <NavItem
          label="Home"
          active={homeActive}
          onClick={() => onNavigate("home")}
        >
          <HomeIcon active={homeActive} />
        </NavItem>

        <NavItem
          label="Markets"
          active={marketsActive}
          onClick={() => onNavigate("markets")}
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
          onClick={() => onNavigate("create")}
          className="relative -top-3 flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-white text-black shadow-[0_4px_24px_rgba(255,255,255,0.18)] transition-transform active:scale-95"
        >
          <Plus className="h-7 w-7" strokeWidth={2.25} />
        </button>

        <NavItem
          label="Watchlist"
          active={watchlistActive}
          onClick={() => onNavigate("watchlist")}
        >
          <Bookmark
            className={`h-[22px] w-[22px] ${watchlistActive ? "text-[#00C6C6]" : "text-white/45"}`}
            strokeWidth={watchlistActive ? 2.5 : 2}
          />
        </NavItem>

        <NavItem
          label="Profile"
          active={profileActive}
          onClick={() => onNavigate("profile")}
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
