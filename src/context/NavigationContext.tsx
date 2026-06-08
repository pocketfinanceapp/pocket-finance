"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type { NavTab } from "@/components/BottomNav";
import { APP_BASE, appPath } from "@/lib/appPaths";

type ShellTab = NavTab;

interface NavigationContextValue {
  activeTab: ShellTab;
  navTab: NavTab;
  navigate: (tab: NavTab) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

function shellTabFromPath(pathname: string): ShellTab {
  if (!pathname.startsWith(APP_BASE)) return "home";
  if (pathname.startsWith(appPath("browse"))) return "browse";
  if (pathname === appPath("markets")) return "markets";
  if (pathname === appPath("watchlist")) return "watchlist";
  if (pathname === appPath("profile")) return "profile";
  return "home";
}

function pathForTab(tab: NavTab): string {
  switch (tab) {
    case "browse":
      return appPath("browse");
    case "markets":
      return appPath("markets");
    case "watchlist":
      return appPath("watchlist");
    case "profile":
      return appPath("profile");
    default:
      return APP_BASE;
  }
}

export function NavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ShellTab>(() =>
    shellTabFromPath(pathname)
  );

  useEffect(() => {
    setActiveTab(shellTabFromPath(pathname));
  }, [pathname]);

  useEffect(() => {
    router.prefetch(APP_BASE);
    router.prefetch(appPath("markets"));
    router.prefetch(appPath("watchlist"));
    router.prefetch(appPath("profile"));
    router.prefetch(appPath("browse"));
  }, [router]);

  const navigate = useCallback(
    (tab: NavTab) => {
      setActiveTab(tab);
      router.replace(pathForTab(tab), { scroll: false });
    },
    [router]
  );

  const navTab: NavTab = activeTab;

  const value = useMemo(
    () => ({
      activeTab,
      navTab,
      navigate,
    }),
    [activeTab, navTab, navigate]
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return ctx;
}

export function useNavigationOptional() {
  return useContext(NavigationContext);
}
