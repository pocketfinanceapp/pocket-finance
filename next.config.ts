import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /** Hides the circular Next.js "N" dev indicator during onboarding */
  devIndicators: false,
  async redirects() {
    return [
      {
        source: "/app",
        destination: "/home",
        permanent: true,
      },
      {
        source: "/app/:path*",
        destination: "/home/:path*",
        permanent: true,
      },
      // Bare tab names (no /home prefix) 404 instead of landing in the app —
      // seen live when a scroll/gesture edge case navigated to a bare
      // "/explore" URL. All in-app tabs live under /home/*, so catch the
      // bare forms defensively in case anything else constructs one too.
      {
        source: "/explore",
        destination: "/home/explore",
        permanent: true,
      },
      {
        source: "/saved",
        destination: "/home/saved",
        permanent: true,
      },
      {
        source: "/profile",
        destination: "/home/profile",
        permanent: true,
      },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "flagcdn.com",
        pathname: "/**",
      },
    ],
  },
  /** Stable transpilation for icon/chart packages (avoids broken vendor chunks) */
  transpilePackages: ["lucide-react", "recharts"],
  experimental: {
    /** Tree-shake lucide without fragile manual barrel paths */
    optimizePackageImports: ["lucide-react"],
  },
};

export default withSentryConfig(nextConfig, {
  org: "pocket-finance",
  project: "javascript-nextjs",

  // Only print Sentry's build-time logs in CI, not local dev builds.
  silent: !process.env.CI,

  // No SENTRY_AUTH_TOKEN is configured yet, so source map upload is
  // skipped automatically — stack traces will show minified code until
  // that's added. Safe to leave as-is; nothing breaks without it.
});
