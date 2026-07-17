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
  transitionKey: number;
  navigate: (tab: NavTab) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

function shellTabFromPath(pathname: string): ShellTab {
  if (!pathname.startsWith(APP_BASE)) return "home";
  if (pathname === appPath("explore")) return "explore";
  if (pathname === appPath("saved")) return "saved";
  if (pathname === appPath("profile")) return "profile";
  return "home";
}

function pathForTab(tab: NavTab): string {
  switch (tab) {
    case "explore":
      return appPath("explore");
    case "saved":
      return appPath("saved");
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
  const [transitionKey, setTransitionKey] = useState(0);

  useEffect(() => {
    setActiveTab(shellTabFromPath(pathname));
    setTransitionKey((key) => key + 1);
  }, [pathname]);

  useEffect(() => {
    router.prefetch(APP_BASE);
    router.prefetch(appPath("explore"));
    router.prefetch(appPath("saved"));
    router.prefetch(appPath("profile"));
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
      transitionKey,
      navigate,
    }),
    [activeTab, navTab, transitionKey, navigate]
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
