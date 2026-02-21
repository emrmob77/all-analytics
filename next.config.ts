import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  // WebP / AVIF image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        // Allow Supabase Storage avatar images
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Tree-shake large packages at build time
  experimental: {
    optimizePackageImports: ['recharts', 'lucide-react', 'radix-ui'],
  },

  // Cache headers
  async headers() {
    return [
      {
        // Next.js immutable static assets — cache 1 year
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Public folder image assets — cache 24 hours
        // Use 'image/.*' so only actual image requests (Accept: image/avif,…)
        // match — not HTML navigations which also contain 'image' in Accept.
        source: '/:path((?!_next).*)',
        has: [{ type: 'header', key: 'accept', value: 'image/.*' }],
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=3600',
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Sentry organisation & project (set in CI env or .env.local)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Auth token for source-map upload (SENTRY_AUTH_TOKEN env var)
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Suppress Sentry build output in CI logs
  silent: !process.env.CI,

  // Upload source maps only in production builds
  sourcemaps: {
    disable: process.env.NODE_ENV !== 'production',
  },

  // Automatically tree-shake Sentry logger statements
  disableLogger: true,

  // Tunnel Sentry requests through /monitoring to avoid ad-blockers
  tunnelRoute: '/monitoring',
});
