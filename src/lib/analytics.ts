/**
 * Typed PostHog event helpers for AdsPulse.
 *
 * Usage:
 *   import { track } from '@/lib/analytics';
 *   track('campaign_status_changed', { campaignId, from: 'active', to: 'paused' });
 */

import posthog from 'posthog-js';

// ---------------------------------------------------------------------------
// Event catalogue
// ---------------------------------------------------------------------------

export type TrackingEvent =
  // Auth
  | 'login_attempted'
  | 'login_succeeded'
  | 'login_failed'
  | 'signup_succeeded'
  | 'logout'
  // Campaigns
  | 'campaign_status_changed'
  | 'campaign_budget_updated'
  | 'campaign_bulk_action'
  // Reports
  | 'report_generated'
  | 'report_exported'
  // Settings
  | 'ad_account_connected'
  | 'ad_account_disconnected'
  | 'member_invited'
  | 'member_removed'
  | 'notification_preference_changed'
  // Sync
  | 'manual_sync_triggered';

// ---------------------------------------------------------------------------
// track — safe wrapper that silently no-ops when PostHog is not configured
// ---------------------------------------------------------------------------

export function track(
  event: TrackingEvent,
  properties?: Record<string, unknown>,
): void {
  if (typeof window === 'undefined') return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.capture(event, properties);
}
