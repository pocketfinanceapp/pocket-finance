import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.pocketfinance.app",
  appName: "Pocket Finance",
  // Loads the live production site inside the native shell instead of bundling
  // a static export — the app depends on Next.js API routes (Marketaux proxy,
  // AI briefing, comments, etc.) and Supabase cookie-based auth, neither of
  // which work from a fully offline static bundle. This also means shipping a
  // content/UI update doesn't require a new store submission in most cases —
  // only native-shell changes (icon, splash, plugins) do.
  server: {
    url: "https://www.pocketfinance.app",
    cleartext: false,
  },
  backgroundColor: "#0a0a0a",
  ios: {
    contentInset: "always",
    backgroundColor: "#0a0a0a",
  },
  android: {
    backgroundColor: "#0a0a0a",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: "#0a0a0a",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      // "Light" = light-colored status bar text/icons, which is what you want
      // on a dark background (#0a0a0a) — "Dark" would render dark-on-dark and
      // be unreadable. Naming is content-color, not background-color.
      style: "LIGHT",
      backgroundColor: "#0a0a0a",
    },
  },
};

export default config;
