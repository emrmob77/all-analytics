-- =============================================
-- Sync cron job setup
-- Requires: pg_cron, pg_net, and supabase_vault extensions
-- (Enable all three in Supabase dashboard → Database → Extensions)
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ---------------------------------------------------------------------------
-- Secure secret retrieval via Supabase Vault
--
-- Store secrets once (run in Supabase SQL editor or seed.sql):
--   SELECT vault.create_secret('https://<ref>.supabase.co', 'app_supabase_url');
--   SELECT vault.create_secret('<service_role_key>', 'app_service_role_key');
--
-- Using Vault instead of plain database GUCs prevents the service_role_key
-- (which bypasses all RLS) from being exposed via SHOW or pg_settings to any
-- database role that can query those views.
-- ---------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.get_secret(secret_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  secret_value text;
BEGIN
  SELECT decrypted_secret INTO secret_value
    FROM vault.decrypted_secrets
   WHERE name = secret_name
   LIMIT 1;
  RETURN secret_value;
END;
$$;

-- Revoke direct access; only the cron job (running as postgres) uses this.
REVOKE ALL ON FUNCTION private.get_secret(text) FROM PUBLIC;

-- Schedule the scheduled-sync Edge Function every 15 minutes.
SELECT cron.schedule(
  'sync-all-ad-accounts',
  '*/15 * * * *',
  $$
    SELECT net.http_post(
      url     := private.get_secret('app_supabase_url') || '/functions/v1/scheduled-sync',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || private.get_secret('app_service_role_key')
      ),
      body    := '{}'::jsonb
    ) AS request_id;
  $$
);
