'use client';

/**
 * Web Vitals reporter — sends LCP, INP, CLS, FCP, TTFB to PostHog and
 * flags values that exceed the performance budget targets:
 *   LCP  < 2.5 s
 *   INP  < 200 ms   (replaces FID in Core Web Vitals 2024)
 *   CLS  < 0.1
 */

import { useReportWebVitals } from 'next/web-vitals';
import posthog from 'posthog-js';

// Performance budget thresholds (requirements: LCP < 2.5 s, CLS < 0.1)
const THRESHOLDS: Record<string, number> = {
  LCP:  2500,
  INP:  200,
  CLS:  0.1,
  FCP:  1800,
  TTFB: 800,
};

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

    const threshold = THRESHOLDS[metric.name];
    const exceeds   = threshold !== undefined && metric.value > threshold;

    posthog.capture('web_vital', {
      metric_name:  metric.name,
      metric_value: metric.value,
      metric_rating: metric.rating,   // 'good' | 'needs-improvement' | 'poor'
      exceeds_budget: exceeds,
      page:         typeof window !== 'undefined' ? window.location.pathname : undefined,
    });

    // Log budget violations so Sentry/logger can pick them up separately
    if (exceeds && process.env.NODE_ENV === 'production') {
      console.warn(
        `[WebVitals] ${metric.name} ${metric.value.toFixed(1)} exceeds budget ${threshold}`,
      );
    }
  });

  return null;
}
