'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserOrganization } from '@/lib/actions/organization';
import type { AdPlatform, CampaignStatus } from '@/types';

export interface CampaignRow {
  id: string;
  name: string;
  platform: AdPlatform;
  status: CampaignStatus;
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  roas: number;
  createdAt: string;
}

export interface GetCampaignsParams {
  from: string;
  to: string;
  platform?: AdPlatform | 'all';
  status?: CampaignStatus | 'all';
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface GetCampaignsResult {
  data: CampaignRow[];
  total: number;
  error: string | null;
}

async function getOrgId(): Promise<string | null> {
  const membership = await getUserOrganization();
  return membership?.organization.id ?? null;
}

export async function getCampaigns(params: GetCampaignsParams): Promise<GetCampaignsResult> {
  const orgId = await getOrgId();
  if (!orgId) return { data: [], total: 0, error: 'No organization found' };

  const { from, to, platform, status, search, page = 1, pageSize = 50 } = params;

  const supabase = await createClient();

  // Build campaigns query with optional metrics join
  let query = supabase
    .from('campaigns')
    .select(`
      id, name, platform, status, budget_limit, created_at,
      campaign_metrics(spend, impressions, clicks, conversions, revenue, date)
    `)
    .eq('organization_id', orgId);

  if (platform && platform !== 'all') query = query.eq('platform', platform);
  if (status && status !== 'all')     query = query.eq('status', status);
  if (search?.trim())                  query = query.ilike('name', `%${search.trim()}%`);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return { data: [], total: 0, error: error.message };

  type RawRow = {
    id: string; name: string; platform: string; status: string;
    budget_limit: number; created_at: string;
    campaign_metrics: { spend: number; impressions: number; clicks: number; conversions: number; revenue: number; date: string }[];
  };

  // Aggregate metrics within the selected date range
  const rows: CampaignRow[] = ((data ?? []) as unknown as RawRow[]).map((row) => {
    const metrics = (row.campaign_metrics ?? []).filter(
      (m) => m.date >= from && m.date <= to,
    );
    const spend       = metrics.reduce((s, m) => s + (m.spend       ?? 0), 0);
    const impressions = metrics.reduce((s, m) => s + (m.impressions  ?? 0), 0);
    const clicks      = metrics.reduce((s, m) => s + (m.clicks       ?? 0), 0);
    const conversions = metrics.reduce((s, m) => s + (m.conversions  ?? 0), 0);
    const revenue     = metrics.reduce((s, m) => s + (m.revenue      ?? 0), 0);
    const ctr         = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const roas        = spend > 0       ? revenue / spend               : 0;

    return {
      id:          row.id,
      name:        row.name,
      platform:    row.platform as AdPlatform,
      status:      row.status as CampaignStatus,
      budget:      row.budget_limit ?? 0,
      spend:       +spend.toFixed(2),
      impressions: Math.round(impressions),
      clicks:      Math.round(clicks),
      conversions: +conversions.toFixed(2),
      ctr:         +ctr.toFixed(2),
      roas:        +roas.toFixed(2),
      createdAt:   row.created_at,
    };
  });

  // Client-side pagination (Supabase range() can't be combined with nested select easily)
  const total = rows.length;
  const start = (page - 1) * pageSize;
  const paged = rows.slice(start, start + pageSize);

  return { data: paged, total, error: null };
}

export async function updateCampaignStatus(
  campaignId: string,
  newStatus: CampaignStatus,
): Promise<{ error: string | null }> {
  const orgId = await getOrgId();
  if (!orgId) return { error: 'No organization found' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('campaigns')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', campaignId)
    .eq('organization_id', orgId);

  return { error: error?.message ?? null };
}

export async function bulkUpdateCampaignStatus(
  campaignIds: string[],
  newStatus: CampaignStatus,
): Promise<{ error: string | null }> {
  const orgId = await getOrgId();
  if (!orgId) return { error: 'No organization found' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('campaigns')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .in('id', campaignIds)
    .eq('organization_id', orgId);

  return { error: error?.message ?? null };
}
