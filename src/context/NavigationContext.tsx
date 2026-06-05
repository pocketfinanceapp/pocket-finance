"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type { NavTab } from "@/components/BottomNav";

type ShellTab = "home" | "markets" | "watchlist";

interface NavigationContextValue {
  activeTab: ShellTab;
  navTab: NavTab;
  navigate: (tab: NavTab) => void;
  registerCreateHandler: (handler: (() => void) | null) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

function shellTabFromPath(pathname: string): ShellTab {
  if (pathname === "/markets") return "markets";
  if (pathname === "/watchlist") return "watchlist";
  return "home";
}

function pathForTab(tab: NavTab): string {
  switch (tab) {
    case "markets":
      return "/markets";
    case "watchlist":
      return "/watchlist";
    case "profile":
      return "/?tab=profile";
    case "create":
      return "/?sheet=create";
    default:
      return "/";
  }
}

export function NavigationProvider({
  children,
  profileOpen,
}: {
  children: React.ReactNode;
  profileOpen?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const createHandlerRef = useRef<(() => void) | null>(null);

  const [activeTab, setActiveTab] = useState<ShellTab>(() =>
    shellTabFromPath(pathname)
  );

  useEffect(() => {
    setActiveTab(shellTabFromPath(pathname));
  }, [pathname]);

  useEffect(() => {
    router.prefetch("/");
    router.prefetch("/markets");
    router.prefetch("/watchlist");
  }, [router]);

  const navigate = useCallback(
    (tab: NavTab) => {
      if (tab === "create" && pathname === "/" && createHandlerRef.current) {
        createHandlerRef.current();
        return;
      }

      if (tab === "home" || tab === "profile" || tab === "create") {
        setActiveTab("home");
      } else if (tab === "markets") {
        setActiveTab("markets");
      } else if (tab === "watchlist") {
        setActiveTab("watchlist");
      }

      router.replace(pathForTab(tab), { scroll: false });
    },
    [pathname, router]
  );

  const registerCreateHandler = useCallback(
    (handler: (() => void) | null) => {
      createHandlerRef.current = handler;
    },
    []
  );

  const navTab: NavTab = profileOpen ? "profile" : activeTab;

  const value = useMemo(
    () => ({
      activeTab,
      navTab,
      navigate,
      registerCreateHandler,
    }),
    [activeTab, navTab, navigate, registerCreateHandler]
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
