import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  /* config options here */
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
