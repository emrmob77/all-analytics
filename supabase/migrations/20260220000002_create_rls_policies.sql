-- =============================================
-- RLS ETKİNLEŞTİR
-- =============================================
ALTER TABLE public.users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_accounts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hourly_metrics   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs        ENABLE ROW LEVEL SECURITY;

-- =============================================
-- YARDIMCI FONKSİYONLAR
-- =============================================
CREATE OR REPLACE FUNCTION public.get_user_org_role(org_id UUID)
RETURNS public.org_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.org_members
  WHERE organization_id = org_id AND user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE organization_id = org_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(org_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
$$;

-- =============================================
-- USERS
-- =============================================
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- =============================================
-- ORGANIZATIONS
-- =============================================
CREATE POLICY "orgs_select_member" ON public.organizations
  FOR SELECT USING (public.is_org_member(id));

CREATE POLICY "orgs_insert_authenticated" ON public.organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "orgs_update_admin" ON public.organizations
  FOR UPDATE USING (public.is_org_admin(id));

-- =============================================
-- ORG_MEMBERS
-- =============================================
CREATE POLICY "org_members_select_member" ON public.org_members
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "org_members_insert_admin" ON public.org_members
  FOR INSERT WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "org_members_update_owner" ON public.org_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE organization_id = org_members.organization_id
        AND user_id = auth.uid()
        AND role = 'owner'
    )
  );

CREATE POLICY "org_members_delete_admin" ON public.org_members
  FOR DELETE USING (
    public.is_org_admin(organization_id)
    AND user_id != auth.uid()
  );

-- =============================================
-- INVITATIONS
-- =============================================
CREATE POLICY "invitations_select_admin" ON public.invitations
  FOR SELECT USING (public.is_org_admin(organization_id));

CREATE POLICY "invitations_insert_admin" ON public.invitations
  FOR INSERT WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "invitations_delete_admin" ON public.invitations
  FOR DELETE USING (public.is_org_admin(organization_id));

-- =============================================
-- AD_ACCOUNTS
-- =============================================
CREATE POLICY "ad_accounts_select_member" ON public.ad_accounts
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "ad_accounts_insert_admin" ON public.ad_accounts
  FOR INSERT WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "ad_accounts_update_admin" ON public.ad_accounts
  FOR UPDATE USING (public.is_org_admin(organization_id));

CREATE POLICY "ad_accounts_delete_admin" ON public.ad_accounts
  FOR DELETE USING (public.is_org_admin(organization_id));

-- =============================================
-- CAMPAIGNS
-- =============================================
CREATE POLICY "campaigns_select_member" ON public.campaigns
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "campaigns_insert_admin" ON public.campaigns
  FOR INSERT WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "campaigns_update_admin" ON public.campaigns
  FOR UPDATE USING (public.is_org_admin(organization_id));

CREATE POLICY "campaigns_delete_admin" ON public.campaigns
  FOR DELETE USING (public.is_org_admin(organization_id));

-- =============================================
-- CAMPAIGN_METRICS
-- =============================================
CREATE POLICY "campaign_metrics_select_member" ON public.campaign_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_metrics.campaign_id
        AND public.is_org_member(c.organization_id)
    )
  );

CREATE POLICY "campaign_metrics_insert_admin" ON public.campaign_metrics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_metrics.campaign_id
        AND public.is_org_admin(c.organization_id)
    )
  );

CREATE POLICY "campaign_metrics_update_admin" ON public.campaign_metrics
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_metrics.campaign_id
        AND public.is_org_admin(c.organization_id)
    )
  );

-- =============================================
-- HOURLY_METRICS
-- =============================================
CREATE POLICY "hourly_metrics_select_member" ON public.hourly_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = hourly_metrics.campaign_id
        AND public.is_org_member(c.organization_id)
    )
  );

CREATE POLICY "hourly_metrics_insert_admin" ON public.hourly_metrics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = hourly_metrics.campaign_id
        AND public.is_org_admin(c.organization_id)
    )
  );

-- =============================================
-- SYNC_LOGS
-- =============================================
CREATE POLICY "sync_logs_select_member" ON public.sync_logs
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "sync_logs_insert_admin" ON public.sync_logs
  FOR INSERT WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "sync_logs_update_admin" ON public.sync_logs
  FOR UPDATE USING (public.is_org_admin(organization_id));
