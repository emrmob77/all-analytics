-- =============================================
-- Cleanup cron job setup
-- Deletes stale hourly_metrics (>7 days) and sync_logs (>90 days)
-- Runs daily at 03:00 UTC (low-traffic hours)
--
-- Prerequisites:
--   pg_cron, pg_net, and supabase_vault must be enabled.
--   Vault secrets must be pre-provisioned (same as sync_cron):
--     SELECT vault.create_secret('https://<ref>.supabase.co', 'app_supabase_url');
--     SELECT vault.create_secret('<service_role_key>', 'app_service_role_key');
--
-- The private.get_secret() helper is created by migration 20260220000011.
-- =============================================

-- Schedule the cleanup Edge Function at 03:00 UTC every day.
SELECT cron.schedule(
  'cleanup-old-data',
  '0 3 * * *',
  $$
    SELECT net.http_post(
      url     := private.get_secret('app_supabase_url') || '/functions/v1/cleanup-old-data',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || private.get_secret('app_service_role_key')
      ),
      body    := '{}'::jsonb
    ) AS request_id;
  $$
);
