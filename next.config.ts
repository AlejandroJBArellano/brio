import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async redirects() {
    return [
      {
        source: "/calendar",
        destination: "/today",
        permanent: false,
      },
      {
        source: "/analytics",
        destination: "/today",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
