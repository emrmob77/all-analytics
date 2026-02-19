-- =============================================
-- USERS (auth.users mirror)
-- =============================================
CREATE TABLE public.users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL UNIQUE,
  full_name  TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- ORGANIZATIONS
-- =============================================
CREATE TABLE public.organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- ORG_MEMBERS
-- =============================================
CREATE TYPE public.org_role AS ENUM ('owner', 'admin', 'member', 'viewer');

CREATE TABLE public.org_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role            public.org_role NOT NULL DEFAULT 'member',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE INDEX idx_org_members_org_id  ON public.org_members(organization_id);
CREATE INDEX idx_org_members_user_id ON public.org_members(user_id);

-- =============================================
-- INVITATIONS
-- =============================================
CREATE TABLE public.invitations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invited_by      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  role            public.org_role NOT NULL DEFAULT 'member',
  token           TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  accepted_at     TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invitations_token   ON public.invitations(token);
CREATE INDEX idx_invitations_email   ON public.invitations(email);
CREATE INDEX idx_invitations_org_id  ON public.invitations(organization_id);

-- =============================================
-- AD_ACCOUNTS
-- =============================================
CREATE TYPE public.ad_platform AS ENUM ('google', 'meta', 'tiktok', 'pinterest');

CREATE TABLE public.ad_accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  platform            public.ad_platform NOT NULL,
  external_account_id TEXT NOT NULL,
  account_name        TEXT NOT NULL,
  access_token        TEXT,
  refresh_token       TEXT,
  token_expires_at    TIMESTAMPTZ,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  last_synced_at      TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, platform, external_account_id)
);

CREATE INDEX idx_ad_accounts_org_id   ON public.ad_accounts(organization_id);
CREATE INDEX idx_ad_accounts_platform ON public.ad_accounts(platform);

-- =============================================
-- CAMPAIGNS
-- =============================================
CREATE TYPE public.campaign_status AS ENUM ('active', 'paused', 'stopped', 'archived');

CREATE TABLE public.campaigns (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  ad_account_id        UUID NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE,
  platform             public.ad_platform NOT NULL,
  external_campaign_id TEXT NOT NULL,
  name                 TEXT NOT NULL,
  status               public.campaign_status NOT NULL DEFAULT 'active',
  budget_limit         NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (budget_limit >= 0),
  budget_used          NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (budget_used >= 0),
  currency             CHAR(3) NOT NULL DEFAULT 'USD',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ad_account_id, external_campaign_id)
);

CREATE INDEX idx_campaigns_org_id     ON public.campaigns(organization_id);
CREATE INDEX idx_campaigns_ad_account ON public.campaigns(ad_account_id);
CREATE INDEX idx_campaigns_platform   ON public.campaigns(platform);
CREATE INDEX idx_campaigns_status     ON public.campaigns(status);

-- =============================================
-- CAMPAIGN_METRICS (daily)
-- =============================================
CREATE TABLE public.campaign_metrics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  spend       NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (spend >= 0),
  impressions BIGINT NOT NULL DEFAULT 0 CHECK (impressions >= 0),
  clicks      BIGINT NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  conversions NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (conversions >= 0),
  revenue     NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (revenue >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, date)
);

CREATE INDEX idx_campaign_metrics_campaign_id ON public.campaign_metrics(campaign_id);
CREATE INDEX idx_campaign_metrics_date        ON public.campaign_metrics(date);

-- =============================================
-- HOURLY_METRICS (last 7 days)
-- =============================================
CREATE TABLE public.hourly_metrics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  hour        TIMESTAMPTZ NOT NULL,
  spend       NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (spend >= 0),
  impressions BIGINT NOT NULL DEFAULT 0 CHECK (impressions >= 0),
  clicks      BIGINT NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  conversions NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (conversions >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, hour)
);

CREATE INDEX idx_hourly_metrics_campaign_id ON public.hourly_metrics(campaign_id);
CREATE INDEX idx_hourly_metrics_hour        ON public.hourly_metrics(hour);

-- =============================================
-- SYNC_LOGS
-- =============================================
CREATE TYPE public.sync_status AS ENUM ('in_progress', 'completed', 'failed');

CREATE TABLE public.sync_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  ad_account_id   UUID REFERENCES public.ad_accounts(id) ON DELETE SET NULL,
  status          public.sync_status NOT NULL DEFAULT 'in_progress',
  triggered_by    TEXT NOT NULL DEFAULT 'scheduled' CHECK (triggered_by IN ('scheduled', 'manual')),
  error_message   TEXT,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sync_logs_org_id        ON public.sync_logs(organization_id);
CREATE INDEX idx_sync_logs_ad_account_id ON public.sync_logs(ad_account_id);
CREATE INDEX idx_sync_logs_status        ON public.sync_logs(status);
CREATE INDEX idx_sync_logs_started_at    ON public.sync_logs(started_at);

-- =============================================
-- updated_at trigger
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_org_members_updated_at
  BEFORE UPDATE ON public.org_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_ad_accounts_updated_at
  BEFORE UPDATE ON public.ad_accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_campaign_metrics_updated_at
  BEFORE UPDATE ON public.campaign_metrics
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- auth.users → public.users otomatik sync
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
