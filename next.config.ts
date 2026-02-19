import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  outputFileTracingRoot: process.cwd(),
  async headers() {
    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "script-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https:",
      "object-src 'none'",
      "upgrade-insecure-requests"
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }
        ]
      }
    ];
  },
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
