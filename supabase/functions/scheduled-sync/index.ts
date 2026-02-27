import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * scheduled-sync — Invoked by pg_cron every 15 minutes.
 *
 * Setup (run once in Supabase SQL editor):
 * ─────────────────────────────────────────
 * SELECT cron.schedule(
 *   'sync-all-ad-accounts',
 *   '<every-15-minutes-cron>',
 *   $$
 *     SELECT net.http_post(
 *       url    := current_setting('app.supabase_url') || '/functions/v1/scheduled-sync',
 *       headers := jsonb_build_object(
 *         'Content-Type',  'application/json',
 *         'Authorization', 'Bearer ' || current_setting('app.service_role_key')
 *       ),
 *       body   := '{}'::jsonb
 *     ) AS request_id;
 *   $$
 * );
 *
 * Required extensions: pg_cron, pg_net
 * Required GUC: app.supabase_url, app.service_role_key (set via ALTER DATABASE)
 */

const SYNC_FUNCTION_URL_SUFFIX = '/functions/v1/sync-ad-platform-data';
/** Milliseconds to wait between account syncs to respect rate limits. */
const RATE_LIMIT_DELAY_MS = 500;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function hasServiceRoleCredential(
  token: string | null,
  supabaseUrl: string
): Promise<boolean> {
  if (!token) return false;
  try {
    // Auth admin endpoint only accepts service-role credentials.
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=1&per_page=1`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: token,
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

Deno.serve(async (req: Request) => {
  // Accept both POST (pg_net) and GET (manual trigger from dashboard)
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const syncSecret = Deno.env.get('SYNC_SHARED_SECRET');
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Supabase env not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Authorize caller using either a valid service-role credential or the shared sync secret.
  const bearerToken = req.headers.get('Authorization')?.replace('Bearer ', '');
  const apiKey = req.headers.get('apikey');
  const inboundSyncSecret = req.headers.get('x-sync-secret');
  const keyCandidates = Array.from(new Set([bearerToken, apiKey].filter(Boolean) as string[]));
  let hasValidServiceKey = false;
  for (const token of keyCandidates) {
    if (await hasServiceRoleCredential(token, supabaseUrl)) {
      hasValidServiceKey = true;
      break;
    }
  }
  const authorized = hasValidServiceKey
    || (syncSecret != null && syncSecret !== '' && inboundSyncSecret === syncSecret);

  if (!authorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Fetch all active ad accounts that have a token stored
  const { data: accounts, error } = await supabase
    .from('ad_accounts')
    .select('id, organization_id, platform')
    .eq('is_active', true)
    .not('id', 'is', null); // ensure we only get real rows

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!accounts || accounts.length === 0) {
    return new Response(
      JSON.stringify({ message: 'No active ad accounts to sync', synced: 0 }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Filter to accounts that actually have a token
  const { data: tokenedAccountIds } = await supabase
    .from('ad_account_tokens')
    .select('ad_account_id')
    .in('ad_account_id', accounts.map(a => a.id))
    .not('access_token', 'is', null);

  const validIds = new Set((tokenedAccountIds ?? []).map(t => t.ad_account_id as string));
  const accountsToSync = accounts.filter(a => validIds.has(a.id as string));

  const syncFnUrl = `${supabaseUrl}${SYNC_FUNCTION_URL_SUFFIX}`;
  const results: Array<{ ad_account_id: string; status: 'ok' | 'error' | 'timeout' | 'skipped'; sync_log_id?: string }> = [];

  for (let i = 0; i < accountsToSync.length; i++) {
    const account = accountsToSync[i];
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000); // 30 s per account
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      };
      if (syncSecret) headers['x-sync-secret'] = syncSecret;

      const res = await fetch(syncFnUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ad_account_id: account.id,
          triggered_by: 'scheduled',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const body = await res.json() as { sync_log_id?: string; error?: string; success?: boolean };
      // sync-ad-platform-data returns HTTP 200 even on sync failures (so that
      // functions.invoke() propagates the error body instead of throwing).
      // Check body.error in addition to res.ok to correctly detect failures.
      const isAlreadyRunning = typeof body.error === 'string'
        && body.error.toLowerCase().includes('already in progress');
      results.push({
        ad_account_id: account.id as string,
        status: (res.ok && (!body.error || isAlreadyRunning))
          ? (isAlreadyRunning ? 'skipped' : 'ok')
          : 'error',
        sync_log_id: body.sync_log_id,
      });
    } catch (err) {
      results.push({
        ad_account_id: account.id as string,
        status: err instanceof Error && err.name === 'AbortError' ? 'timeout' : 'error',
      });
      console.error(`Sync failed for account ${account.id}:`, err);
    }

    // Rate-limit: pause between accounts
    if (i < accountsToSync.length - 1) {
      await delay(RATE_LIMIT_DELAY_MS);
    }
  }

  const succeeded = results.filter(r => r.status === 'ok').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const failed = results.filter(r => r.status === 'error' || r.status === 'timeout').length;

  return new Response(
    JSON.stringify({ synced: succeeded, skipped, failed, results }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
