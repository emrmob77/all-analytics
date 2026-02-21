'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserOrganization } from '@/lib/actions/organization';

export type OrgPlan = 'free' | 'pro' | 'enterprise';

export interface BillingUsage {
  campaigns: number;
  adAccounts: number;
  members: number;
}

export interface BillingInfo {
  plan: OrgPlan;
  planRenewalAt: string | null;
  stripeCustomerId: string | null;
  orgName: string;
  orgSlug: string;
  createdAt: string;
  usage: BillingUsage;
}

export async function getBillingInfo(): Promise<{ data: BillingInfo | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const org = await getUserOrganization();
    if (!org) return { data: null, error: 'No organization found' };

    const orgId = org.organization.id;

    // Fetch org plan details + usage counts in parallel
    const [orgResult, campaignCount, adAccountCount, memberCount] = await Promise.all([
      supabase
        .from('organizations')
        .select('name, slug, plan, plan_renewal_at, stripe_customer_id, created_at')
        .eq('id', orgId)
        .single(),
      supabase
        .from('campaigns')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
      supabase
        .from('ad_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
      supabase
        .from('org_members')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ]);

    if (orgResult.error) return { data: null, error: orgResult.error.message };

    const o = orgResult.data;

    return {
      data: {
        plan: (o.plan ?? 'free') as OrgPlan,
        planRenewalAt: o.plan_renewal_at ?? null,
        stripeCustomerId: o.stripe_customer_id ?? null,
        orgName: o.name,
        orgSlug: o.slug,
        createdAt: o.created_at,
        usage: {
          campaigns:  campaignCount.count  ?? 0,
          adAccounts: adAccountCount.count ?? 0,
          members:    memberCount.count    ?? 0,
        },
      },
      error: null,
    };
  } catch (e) {
    return { data: null, error: String(e) };
  }
}
