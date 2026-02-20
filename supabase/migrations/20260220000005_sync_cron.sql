-- =============================================
-- Sync cron job setup
-- Requires: pg_cron and pg_net extensions
-- (Enable both in Supabase dashboard → Database → Extensions)
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the scheduled-sync Edge Function every 15 minutes.
-- Replace <PROJECT_REF> and <SERVICE_ROLE_KEY> with your actual values,
-- or set them as database GUCs via:
--   ALTER DATABASE postgres SET app.supabase_url = 'https://<ref>.supabase.co';
--   ALTER DATABASE postgres SET app.service_role_key = '<key>';
SELECT cron.schedule(
  'sync-all-ad-accounts',
  '*/15 * * * *',
  $$
    SELECT net.http_post(
      url     := current_setting('app.supabase_url') || '/functions/v1/scheduled-sync',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body    := '{}'::jsonb
    ) AS request_id;
  $$
);
