'use server';

import { createClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NotificationPreferences {
  budgetAlerts: boolean;
  syncFailureAlerts: boolean;
  tokenRefreshAlerts: boolean;
}

// ---------------------------------------------------------------------------
// getNotificationPreferences
// Returns the user's preferences, falling back to all-true defaults if no
// row exists yet.
// ---------------------------------------------------------------------------

export async function getNotificationPreferences(): Promise<{
  data: NotificationPreferences | null;
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('budget_alerts, sync_failure_alerts, token_refresh_alerts')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };

  // No row yet — return defaults
  if (!data) {
    return {
      data: { budgetAlerts: true, syncFailureAlerts: true, tokenRefreshAlerts: true },
      error: null,
    };
  }

  type Raw = { budget_alerts: boolean; sync_failure_alerts: boolean; token_refresh_alerts: boolean };
  const row = data as unknown as Raw;

  return {
    data: {
      budgetAlerts:       row.budget_alerts,
      syncFailureAlerts:  row.sync_failure_alerts,
      tokenRefreshAlerts: row.token_refresh_alerts,
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// updateNotificationPreferences — upsert the user's preferences
// ---------------------------------------------------------------------------

export async function updateNotificationPreferences(
  prefs: NotificationPreferences,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('notification_preferences')
    .upsert(
      {
        user_id:              user.id,
        budget_alerts:        prefs.budgetAlerts,
        sync_failure_alerts:  prefs.syncFailureAlerts,
        token_refresh_alerts: prefs.tokenRefreshAlerts,
        updated_at:           new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

  return { error: error?.message ?? null };
}
