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
            className="h-[22px] w-[22px]"
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
            className="h-[22px] w-[22px]"
            strokeWidth={watchlistActive ? 2.5 : 2}
          />
        </NavItem>

        <NavItem
          label="Profile"
          active={profileActive}
          onClick={() => onNavigate("profile")}
        >
          <User
            className="h-[22px] w-[22px]"
            strokeWidth={profileActive ? 2.5 : 2}
          />
        </NavItem>
      </div>
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      className="h-[22px] w-[22px] shrink-0 text-white"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={active ? 0 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {active ? (
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" />
      ) : (
        <>
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </>
      )}
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
      className={`flex min-w-[56px] flex-col items-center gap-0.5 pb-0.5 transition-opacity active:opacity-70 ${
        active ? "text-white" : "text-white/45"
      }`}
    >
      {children}
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </button>
  );
}
