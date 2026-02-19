import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net"
      }
    ]
  },
  experimental: {
    optimizePackageImports: ["lucide-react"]
  },
  webpack(config, { isServer }) {
    if (!isServer && config.optimization?.splitChunks) {
      config.optimization.splitChunks.cacheGroups = {
        ...(config.optimization.splitChunks.cacheGroups ?? {}),
        reactVendor: {
          test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
          name: "react-vendor",
          chunks: "all",
          priority: 30
        },
        uiVendor: {
          test: /[\\/]node_modules[\\/](@radix-ui|framer-motion|lucide-react|class-variance-authority|clsx|tailwind-merge)[\\/]/,
          name: "ui-vendor",
          chunks: "all",
          priority: 20
        },
        dataVendor: {
          test: /[\\/]node_modules[\\/](@tanstack|@supabase|zustand)[\\/]/,
          name: "data-vendor",
          chunks: "all",
          priority: 10
        }
      };
    }

    return config;
  }
};

export default nextConfig;
