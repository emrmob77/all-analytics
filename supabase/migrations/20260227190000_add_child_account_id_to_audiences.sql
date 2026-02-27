ALTER TABLE public.audiences
  ADD COLUMN IF NOT EXISTS child_ad_account_id TEXT;

CREATE INDEX IF NOT EXISTS idx_audiences_child_ad_account_id
  ON public.audiences(child_ad_account_id);
