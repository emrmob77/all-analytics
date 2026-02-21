'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserOrganization } from '@/lib/actions/organization';
import type { AdPlatform, CampaignStatus } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CampaignDetail {
  id: string;
  name: string;
  platform: AdPlatform;
  status: CampaignStatus;
  budget: number;
  createdAt: string;
  // Aggregated over the requested date range
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  roas: number;
}

export interface DailyMetricRow {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  roas: number;
}

export interface HourlyMetricRow {
  hour: number;   // 0-23
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getOrgId(): Promise<string | null> {
  const membership = await getUserOrganization();
  return membership?.organization.id ?? null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---------------------------------------------------------------------------
// getCampaignDetail
// ---------------------------------------------------------------------------

export async function getCampaignDetail(
  campaignId: string,
  from: string,
  to: string,
): Promise<{ data: CampaignDetail | null; error: string | null }> {
  if (!UUID_RE.test(campaignId)) return { data: null, error: 'Invalid campaign ID' };

  const orgId = await getOrgId();
  if (!orgId) return { data: null, error: 'No organization found' };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      id, name, platform, status, budget_limit, created_at,
      campaign_metrics(spend, impressions, clicks, conversions, revenue, date)
    `)
    .eq('id', campaignId)
    .eq('organization_id', orgId)
    .gte('campaign_metrics.date', from)
    .lte('campaign_metrics.date', to)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data)  return { data: null, error: 'Campaign not found' };

  type Raw = {
    id: string; name: string; platform: string; status: string;
    budget_limit: number; created_at: string;
    campaign_metrics: { spend: number; impressions: number; clicks: number; conversions: number; revenue: number }[];
  };
  const row = data as unknown as Raw;
  const metrics = row.campaign_metrics ?? [];

  const spend       = metrics.reduce((s, m) => s + (m.spend       ?? 0), 0);
  const impressions = metrics.reduce((s, m) => s + (m.impressions ?? 0), 0);
  const clicks      = metrics.reduce((s, m) => s + (m.clicks      ?? 0), 0);
  const conversions = metrics.reduce((s, m) => s + (m.conversions ?? 0), 0);
  const revenue     = metrics.reduce((s, m) => s + (m.revenue     ?? 0), 0);
  const ctr         = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const roas        = spend > 0       ? revenue / spend               : 0;

  return {
    data: {
      id:          row.id,
      name:        row.name,
      platform:    row.platform as AdPlatform,
      status:      row.status as CampaignStatus,
      budget:      row.budget_limit ?? 0,
      createdAt:   row.created_at,
      spend:       +spend.toFixed(2),
      impressions: Math.round(impressions),
      clicks:      Math.round(clicks),
      conversions: +conversions.toFixed(2),
      revenue:     +revenue.toFixed(2),
      ctr:         +ctr.toFixed(2),
      roas:        +roas.toFixed(2),
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// getCampaignDailyMetrics
// ---------------------------------------------------------------------------

export async function getCampaignDailyMetrics(
  campaignId: string,
  from: string,
  to: string,
): Promise<{ data: DailyMetricRow[]; error: string | null }> {
  if (!UUID_RE.test(campaignId)) return { data: [], error: 'Invalid campaign ID' };

  const orgId = await getOrgId();
  if (!orgId) return { data: [], error: 'No organization found' };

  const supabase = await createClient();

  // Verify campaign belongs to this org, then fetch daily rows
  const { data, error } = await supabase
    .from('campaign_metrics')
    .select('date, spend, impressions, clicks, conversions, revenue, campaigns!inner(organization_id)')
    .eq('campaign_id', campaignId)
    .eq('campaigns.organization_id', orgId)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: true });

  if (error) return { data: [], error: error.message };

  type Raw = {
    date: string; spend: number; impressions: number;
    clicks: number; conversions: number; revenue: number;
  };

  const rows: DailyMetricRow[] = ((data ?? []) as unknown as Raw[]).map((m) => {
    const ctr  = m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0;
    const roas = m.spend > 0       ? m.revenue / m.spend               : 0;
    return {
      date:        m.date,
      spend:       +m.spend.toFixed(2),
      impressions: Math.round(m.impressions),
      clicks:      Math.round(m.clicks),
      conversions: +m.conversions.toFixed(2),
      revenue:     +m.revenue.toFixed(2),
      ctr:         +ctr.toFixed(2),
      roas:        +roas.toFixed(2),
    };
  });

  return { data: rows, error: null };
}

// ---------------------------------------------------------------------------
// getCampaignHourlyMetrics — last 7 days
// ---------------------------------------------------------------------------

export async function getCampaignHourlyMetrics(
  campaignId: string,
): Promise<{ data: HourlyMetricRow[]; error: string | null }> {
  if (!UUID_RE.test(campaignId)) return { data: [], error: 'Invalid campaign ID' };

  const orgId = await getOrgId();
  if (!orgId) return { data: [], error: 'No organization found' };

  const supabase = await createClient();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('hourly_metrics')
    .select('hour, spend, impressions, clicks, conversions, campaigns!inner(organization_id)')
    .eq('campaign_id', campaignId)
    .eq('campaigns.organization_id', orgId)
    .gte('hour', sevenDaysAgo.toISOString())
    .order('hour', { ascending: true });

  if (error) return { data: [], error: error.message };

  // Aggregate by hour-of-day (0–23) across all 7 days
  const byHour: Record<number, HourlyMetricRow> = {};
  for (let h = 0; h < 24; h++) {
    byHour[h] = { hour: h, spend: 0, impressions: 0, clicks: 0, conversions: 0 };
  }

  type Raw = { hour: string; spend: number; impressions: number; clicks: number; conversions: number };
  for (const m of (data ?? []) as unknown as Raw[]) {
    const h = new Date(m.hour).getUTCHours();
    byHour[h].spend       += m.spend       ?? 0;
    byHour[h].impressions += m.impressions ?? 0;
    byHour[h].clicks      += m.clicks      ?? 0;
    byHour[h].conversions += m.conversions ?? 0;
  }

  return {
    data: Object.values(byHour).map((r) => ({
      ...r,
      spend:       +r.spend.toFixed(2),
      impressions: Math.round(r.impressions),
      clicks:      Math.round(r.clicks),
      conversions: +r.conversions.toFixed(2),
    })),
    error: null,
  };
}
