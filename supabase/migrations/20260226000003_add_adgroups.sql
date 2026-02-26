-- =============================================
-- ADGROUPS
-- =============================================

CREATE TABLE public.adgroups (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  ad_account_id        UUID NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE,
  campaign_id          UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  platform             public.ad_platform NOT NULL,
  external_adgroup_id  TEXT NOT NULL,
  name                 TEXT NOT NULL,
  status               TEXT NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ad_account_id, external_adgroup_id)
);

CREATE INDEX idx_adgroups_org_id     ON public.adgroups(organization_id);
CREATE INDEX idx_adgroups_ad_account ON public.adgroups(ad_account_id);
CREATE INDEX idx_adgroups_campaign   ON public.adgroups(campaign_id);
CREATE INDEX idx_adgroups_platform   ON public.adgroups(platform);

CREATE TRIGGER trg_adgroups_updated_at
  BEFORE UPDATE ON public.adgroups
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.adgroups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's adgroups"
  ON public.adgroups FOR SELECT
  USING (organization_id IN (
    SELECT o.organization_id FROM public.org_members o WHERE o.user_id = auth.uid()
  ));

CREATE POLICY "Admins/Owners can insert adgroups"
  ON public.adgroups FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT o.organization_id FROM public.org_members o WHERE o.user_id = auth.uid() AND o.role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins/Owners can update adgroups"
  ON public.adgroups FOR UPDATE
  USING (organization_id IN (
    SELECT o.organization_id FROM public.org_members o WHERE o.user_id = auth.uid() AND o.role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins/Owners can delete adgroups"
  ON public.adgroups FOR DELETE
  USING (organization_id IN (
    SELECT o.organization_id FROM public.org_members o WHERE o.user_id = auth.uid() AND o.role IN ('owner', 'admin')
  ));

-- =============================================
-- ADGROUP_METRICS (daily)
-- =============================================

CREATE TABLE public.adgroup_metrics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adgroup_id      UUID NOT NULL REFERENCES public.adgroups(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  spend           NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (spend >= 0),
  impressions     BIGINT NOT NULL DEFAULT 0 CHECK (impressions >= 0),
  clicks          BIGINT NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  conversions     NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (conversions >= 0),
  revenue         NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (revenue >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (adgroup_id, date)
);

CREATE INDEX idx_adgroup_metrics_adgroup_id ON public.adgroup_metrics(adgroup_id);
CREATE INDEX idx_adgroup_metrics_date        ON public.adgroup_metrics(date);

CREATE TRIGGER trg_adgroup_metrics_updated_at
  BEFORE UPDATE ON public.adgroup_metrics
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.adgroup_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their adgroup metrics"
  ON public.adgroup_metrics FOR SELECT
  USING (adgroup_id IN (
    SELECT k.id FROM public.adgroups k
    JOIN public.org_members o ON o.organization_id = k.organization_id
    WHERE o.user_id = auth.uid()
  ));

CREATE POLICY "Admins/Owners can insert adgroup metrics"
  ON public.adgroup_metrics FOR INSERT
  WITH CHECK (adgroup_id IN (
    SELECT k.id FROM public.adgroups k
    JOIN public.org_members o ON o.organization_id = k.organization_id
    WHERE o.user_id = auth.uid() AND o.role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins/Owners can update adgroup metrics"
  ON public.adgroup_metrics FOR UPDATE
  USING (adgroup_id IN (
    SELECT k.id FROM public.adgroups k
    JOIN public.org_members o ON o.organization_id = k.organization_id
    WHERE o.user_id = auth.uid() AND o.role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins/Owners can delete adgroup metrics"
  ON public.adgroup_metrics FOR DELETE
  USING (adgroup_id IN (
    SELECT k.id FROM public.adgroups k
    JOIN public.org_members o ON o.organization_id = k.organization_id
    WHERE o.user_id = auth.uid() AND o.role IN ('owner', 'admin')
  ));
