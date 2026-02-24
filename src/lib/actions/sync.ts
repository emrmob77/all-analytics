'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getUserOrganization } from '@/lib/actions/organization';

export interface SyncLog {
  id: string;
  organization_id: string;
  ad_account_id: string | null;
  status: 'in_progress' | 'completed' | 'failed';
  triggered_by: 'scheduled' | 'manual';
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  ad_accounts?: { platform: string; account_name: string } | null;
}

// ---------------------------------------------------------------------------
// getRecentSyncLogs — last 10 sync logs for the caller's org (any member)
// ---------------------------------------------------------------------------

export async function getRecentSyncLogs(): Promise<{
  logs: SyncLog[];
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { logs: [], error: 'Not authenticated' };

  const membership = await getUserOrganization();
  if (!membership) return { logs: [], error: 'No organization found' };

  const { data, error } = await supabase
    .from('sync_logs')
    .select('*, ad_accounts(platform, account_name)')
    .eq('organization_id', membership.organization.id)
    .order('started_at', { ascending: false })
    .limit(10);

  if (error) return { logs: [], error: error.message };
  return { logs: (data ?? []) as SyncLog[], error: null };
}

// ---------------------------------------------------------------------------
// triggerManualSync — invoke the sync Edge Function (admin+, 120s timeout)
// ---------------------------------------------------------------------------

export async function triggerManualSync(
  adAccountId?: string
): Promise<{ syncLogId: string | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { syncLogId: null, error: 'Not authenticated' };

  const membership = await getUserOrganization();
  if (!membership) return { syncLogId: null, error: 'No organization found' };
  if (!['owner', 'admin'].includes(membership.role)) {
    return { syncLogId: null, error: 'Only admins can trigger manual sync' };
  }

  // If no specific account given, pick the first active account for the org.
  // If an account ID is provided, verify it belongs to the caller's organization
  // before passing it to the Edge Function (which uses a service-role client
  // that bypasses RLS).
  let targetAccountId = adAccountId;
  if (!targetAccountId) {
    const { data: accounts } = await supabase
      .from('ad_accounts')
      .select('id')
      .eq('organization_id', membership.organization.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    targetAccountId = accounts?.id ?? undefined;
  } else {
    const { data: ownedAccount } = await supabase
      .from('ad_accounts')
      .select('id')
      .eq('id', targetAccountId)
      .eq('organization_id', membership.organization.id)
      .eq('is_active', true)
      .maybeSingle();
    if (!ownedAccount) {
      return { syncLogId: null, error: 'Ad account not found or not owned by your organization' };
    }
  }

  if (!targetAccountId) {
    return { syncLogId: null, error: 'No active ad accounts found. Connect an ad account first.' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const syncSecret = process.env.OAUTH_TOKEN_SECRET;

  if (!supabaseUrl || !serviceKey) {
    return { syncLogId: null, error: 'Sync service is not configured' };
  }

  try {
    // Use functions.invoke() — handles Authorization header automatically
    const adminClient = createAdminClient(supabaseUrl, serviceKey);
    const invokeHeaders: Record<string, string> = {};
    if (syncSecret) invokeHeaders['x-sync-secret'] = syncSecret;

    const { data, error: fnError } = await adminClient.functions.invoke(
      'sync-ad-platform-data',
      {
        body: { ad_account_id: targetAccountId, triggered_by: 'manual' },
        headers: invokeHeaders,
      }
    );

    if (fnError) {
      let message = fnError.message;
      const context = (fnError as { context?: Response }).context;
      if (context) {
        try {
          const text = await context.text();
          if (text) {
            const parsed = JSON.parse(text) as { error?: string };
            message = parsed.error ?? text;
          }
        } catch {
          // Keep the default SDK error message when response parsing fails.
        }
      }

      // SDK occasionally returns only a generic non-2xx message.
      // In that case, fetch the latest sync log error so UI can show the real cause.
      if (
        message.includes('Edge Function returned a non-2xx status code')
        && targetAccountId
      ) {
        const { data: latestLog } = await adminClient
          .from('sync_logs')
          .select('error_message')
          .eq('organization_id', membership.organization.id)
          .eq('ad_account_id', targetAccountId)
          .order('started_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (latestLog?.error_message) {
          message = latestLog.error_message;
        }
      }
      return { syncLogId: null, error: message };
    }

    const body = data as { sync_log_id?: string; error?: string } | null;
    if (body?.error) {
      return { syncLogId: body.sync_log_id ?? null, error: body.error };
    }

    return { syncLogId: body?.sync_log_id ?? null, error: null };
  } catch (err) {
    return {
      syncLogId: null,
      error: err instanceof Error ? err.message : 'Unexpected sync error',
    };
  }
}
