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
    /**
     * Serializes static-page generation to 1 worker at build time. The
     * shared /home layout fetches Marketaux data, and it re-executes once
     * per statically generated /home/* route (7 routes) — with full
     * concurrency, that fired ~14 identical Marketaux requests at once,
     * before Next's fetch cache could populate and dedupe them, causing
     * some to time out. Serializing means the first request populates the
     * cache before the next route's layout render fires, so duplicates hit
     * cache instead of the network.
     */
    cpus: 1,
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
