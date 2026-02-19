-- Bug Fix: OAuth token'ları ad_accounts'tan ayrı bir tabloya taşı.
-- Böylece viewer/member rolündeki kullanıcılar token'lara erişemez,
-- yalnızca admin+ rolü erişebilir.

-- 1. Token'ları ayrı tabloya taşı
CREATE TABLE public.ad_account_tokens (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id    UUID NOT NULL UNIQUE REFERENCES public.ad_accounts(id) ON DELETE CASCADE,
  access_token     TEXT,
  refresh_token    TEXT,
  token_expires_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_ad_account_tokens_updated_at
  BEFORE UPDATE ON public.ad_account_tokens
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. RLS: sadece admin+ erişebilir
ALTER TABLE public.ad_account_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ad_account_tokens_select_admin" ON public.ad_account_tokens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ad_accounts a
      WHERE a.id = ad_account_tokens.ad_account_id
        AND public.is_org_admin(a.organization_id)
    )
  );

CREATE POLICY "ad_account_tokens_insert_admin" ON public.ad_account_tokens
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ad_accounts a
      WHERE a.id = ad_account_tokens.ad_account_id
        AND public.is_org_admin(a.organization_id)
    )
  );

CREATE POLICY "ad_account_tokens_update_admin" ON public.ad_account_tokens
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.ad_accounts a
      WHERE a.id = ad_account_tokens.ad_account_id
        AND public.is_org_admin(a.organization_id)
    )
  );

CREATE POLICY "ad_account_tokens_delete_admin" ON public.ad_account_tokens
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.ad_accounts a
      WHERE a.id = ad_account_tokens.ad_account_id
        AND public.is_org_admin(a.organization_id)
    )
  );

-- 3. ad_accounts tablosundan token kolonlarını kaldır
ALTER TABLE public.ad_accounts
  DROP COLUMN IF EXISTS access_token,
  DROP COLUMN IF EXISTS refresh_token,
  DROP COLUMN IF EXISTS token_expires_at;
