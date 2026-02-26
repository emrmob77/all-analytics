-- =============================================
-- AUDIENCES
-- =============================================

CREATE TABLE public.audiences (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  ad_account_id        UUID NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE,
  platform             public.ad_platform NOT NULL,
  external_audience_id TEXT NOT NULL,
  name                 TEXT NOT NULL,
  type                 TEXT NOT NULL,
  size                 BIGINT NOT NULL DEFAULT 0 CHECK (size >= 0),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ad_account_id, external_audience_id)
);

CREATE INDEX idx_audiences_org_id     ON public.audiences(organization_id);
CREATE INDEX idx_audiences_ad_account ON public.audiences(ad_account_id);
CREATE INDEX idx_audiences_platform   ON public.audiences(platform);

CREATE TRIGGER trg_audiences_updated_at
  BEFORE UPDATE ON public.audiences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.audiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's audiences"
  ON public.audiences FOR SELECT
  USING (organization_id IN (
    SELECT o.organization_id FROM public.org_members o WHERE o.user_id = auth.uid()
  ));

CREATE POLICY "Admins/Owners can insert audiences"
  ON public.audiences FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT o.organization_id FROM public.org_members o WHERE o.user_id = auth.uid() AND o.role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins/Owners can update audiences"
  ON public.audiences FOR UPDATE
  USING (organization_id IN (
    SELECT o.organization_id FROM public.org_members o WHERE o.user_id = auth.uid() AND o.role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins/Owners can delete audiences"
  ON public.audiences FOR DELETE
  USING (organization_id IN (
    SELECT o.organization_id FROM public.org_members o WHERE o.user_id = auth.uid() AND o.role IN ('owner', 'admin')
  ));

-- =============================================
-- AUDIENCE_METRICS (daily)
-- =============================================

CREATE TABLE public.audience_metrics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audience_id     UUID NOT NULL REFERENCES public.audiences(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  spend           NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (spend >= 0),
  impressions     BIGINT NOT NULL DEFAULT 0 CHECK (impressions >= 0),
  clicks          BIGINT NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  conversions     NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (conversions >= 0),
  revenue         NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (revenue >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (audience_id, date)
);

CREATE INDEX idx_audience_metrics_audience_id ON public.audience_metrics(audience_id);
CREATE INDEX idx_audience_metrics_date        ON public.audience_metrics(date);

CREATE TRIGGER trg_audience_metrics_updated_at
  BEFORE UPDATE ON public.audience_metrics
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.audience_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their audience metrics"
  ON public.audience_metrics FOR SELECT
  USING (audience_id IN (
    SELECT k.id FROM public.audiences k
    JOIN public.org_members o ON o.organization_id = k.organization_id
    WHERE o.user_id = auth.uid()
  ));

CREATE POLICY "Admins/Owners can insert audience metrics"
  ON public.audience_metrics FOR INSERT
  WITH CHECK (audience_id IN (
    SELECT k.id FROM public.audiences k
    JOIN public.org_members o ON o.organization_id = k.organization_id
    WHERE o.user_id = auth.uid() AND o.role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins/Owners can update audience metrics"
  ON public.audience_metrics FOR UPDATE
  USING (audience_id IN (
    SELECT k.id FROM public.audiences k
    JOIN public.org_members o ON o.organization_id = k.organization_id
    WHERE o.user_id = auth.uid() AND o.role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins/Owners can delete audience metrics"
  ON public.audience_metrics FOR DELETE
  USING (audience_id IN (
    SELECT k.id FROM public.audiences k
    JOIN public.org_members o ON o.organization_id = k.organization_id
    WHERE o.user_id = auth.uid() AND o.role IN ('owner', 'admin')
  ));
