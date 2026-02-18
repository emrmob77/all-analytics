import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/designs/dashboard-overview.html" }
      ]
    };
  }
};

export default nextConfig;
