import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * cleanup-old-data — Removes stale rows to keep the database lean.
 *
 * Retention policy:
 *   - hourly_metrics : 7 days  (requirement 19.1)
 *   - sync_logs      : 90 days (requirement 19.2)
 *
 * Invoked daily at 03:00 UTC via pg_cron (see migration 20260220000012).
 * Can also be triggered manually via GET/POST with the service-role key.
 */

const HOURLY_METRICS_RETENTION_DAYS = 7;
const SYNC_LOGS_RETENTION_DAYS = 90;

Deno.serve(async (req: Request) => {
  // Accept POST (pg_net) and GET (manual trigger from dashboard)
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Supabase env not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Require service-role bearer token to prevent unauthorized access
  const bearerToken = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (bearerToken !== serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const now = new Date();

  const hourlyMetricsCutoff = new Date(
    now.getTime() - HOURLY_METRICS_RETENTION_DAYS * 24 * 3_600_000
  ).toISOString();

  const syncLogsCutoff = new Date(
    now.getTime() - SYNC_LOGS_RETENTION_DAYS * 24 * 3_600_000
  ).toISOString();

  // Delete hourly_metrics older than 7 days
  const { error: hourlyErr, count: hourlyDeleted } = await supabase
    .from('hourly_metrics')
    .delete({ count: 'exact' })
    .lt('hour', hourlyMetricsCutoff);

  if (hourlyErr) {
    console.error('[cleanup] hourly_metrics delete failed:', hourlyErr.message);
  }

  // Delete sync_logs older than 90 days
  const { error: syncErr, count: syncDeleted } = await supabase
    .from('sync_logs')
    .delete({ count: 'exact' })
    .lt('started_at', syncLogsCutoff);

  if (syncErr) {
    console.error('[cleanup] sync_logs delete failed:', syncErr.message);
  }

  const hasError = !!hourlyErr || !!syncErr;

  return new Response(
    JSON.stringify({
      success: !hasError,
      deleted: {
        hourly_metrics: hourlyDeleted ?? 0,
        sync_logs: syncDeleted ?? 0,
      },
      cutoffs: {
        hourly_metrics: hourlyMetricsCutoff,
        sync_logs: syncLogsCutoff,
      },
      ...(hourlyErr && { hourly_metrics_error: hourlyErr.message }),
      ...(syncErr && { sync_logs_error: syncErr.message }),
    }),
    {
      status: hasError ? 207 : 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
});
