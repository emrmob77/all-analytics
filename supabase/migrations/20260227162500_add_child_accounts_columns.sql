ALTER TABLE public.campaigns ADD COLUMN child_ad_account_id TEXT;
ALTER TABLE public.adgroups ADD COLUMN child_ad_account_id TEXT;
ALTER TABLE public.keywords ADD COLUMN child_ad_account_id TEXT;
-- Add indices for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_child_ad_account_id ON public.campaigns(child_ad_account_id);
CREATE INDEX IF NOT EXISTS idx_adgroups_child_ad_account_id ON public.adgroups(child_ad_account_id);
CREATE INDEX IF NOT EXISTS idx_keywords_child_ad_account_id ON public.keywords(child_ad_account_id);
