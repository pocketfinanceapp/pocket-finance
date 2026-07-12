import type { NextConfig } from "next";

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
  },
};

export default nextConfig;
