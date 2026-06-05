import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Hides the circular Next.js "N" dev indicator during onboarding */
  devIndicators: false,
  images: {
    unoptimized: true,
  },
  /** Stable transpilation for icon/chart packages (avoids broken vendor chunks) */
  transpilePackages: ["lucide-react", "recharts"],
  experimental: {
    /** Tree-shake lucide without fragile manual barrel paths */
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
