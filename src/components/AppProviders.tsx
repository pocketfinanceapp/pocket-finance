"use client";

import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>{children}</AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
