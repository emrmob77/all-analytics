-- Keyword Type
CREATE TYPE public.keyword_match_type AS ENUM ('exact', 'phrase', 'broad');
CREATE TYPE public.keyword_status AS ENUM ('enabled', 'paused', 'removed');

-- Keywords Table
CREATE TABLE public.keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  ad_account_id UUID NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  platform public.ad_platform NOT NULL,
  external_keyword_id TEXT NOT NULL,
  text TEXT NOT NULL,
  match_type public.keyword_match_type NOT NULL,
  status public.keyword_status NOT NULL DEFAULT 'enabled',
  quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ad_account_id, external_keyword_id)
);

CREATE INDEX idx_keywords_org_id ON public.keywords(organization_id);
CREATE INDEX idx_keywords_ad_account ON public.keywords(ad_account_id);
CREATE INDEX idx_keywords_campaign ON public.keywords(campaign_id);

-- Keyword Metrics Table
CREATE TABLE public.keyword_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID NOT NULL REFERENCES public.keywords(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  spend NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (spend >= 0),
  impressions BIGINT NOT NULL DEFAULT 0 CHECK (impressions >= 0),
  clicks BIGINT NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  conversions NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (conversions >= 0),
  revenue NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (revenue >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (keyword_id, date)
);

CREATE INDEX idx_keyword_metrics_keyword_id ON public.keyword_metrics(keyword_id);
CREATE INDEX idx_keyword_metrics_date ON public.keyword_metrics(date);

-- Trigger for updated_at
CREATE TRIGGER trg_keywords_updated_at
  BEFORE UPDATE ON public.keywords
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_keyword_metrics_updated_at
  BEFORE UPDATE ON public.keyword_metrics
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS Policies for keywords
ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view keywords in their org"
  ON public.keywords FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.org_members 
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Members can update keywords in their org"
  ON public.keywords FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.org_members 
      WHERE user_id = (SELECT auth.uid()) 
      AND role IN ('owner', 'admin', 'member')
    )
  );

-- RLS Policies for keyword metrics
ALTER TABLE public.keyword_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view keyword metrics in their org"
  ON public.keyword_metrics FOR SELECT
  USING (
    keyword_id IN (
      SELECT id FROM public.keywords
      WHERE organization_id IN (
        SELECT organization_id FROM public.org_members
        WHERE user_id = (SELECT auth.uid())
      )
    )
  );
