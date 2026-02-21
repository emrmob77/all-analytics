'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserOrganization } from '@/lib/actions/organization';
import type { AdPlatform } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReportCampaignOption {
  id: string;
  name: string;
  platform: AdPlatform;
}

export interface ReportMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  avgCtr: number;
  avgRoas: number;
  generatedAt: string;
}

export interface ReportPlatformRow {
  platform: AdPlatform;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  roas: number;
  budgetShare: number;
}

export interface ReportCampaignRow {
  id: string;
  name: string;
  platform: AdPlatform;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  roas: number;
}

export interface ReportData {
  metrics: ReportMetrics;
  byPlatform: ReportPlatformRow[];
  campaigns: ReportCampaignRow[];
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getOrgId(): Promise<string | null> {
  const membership = await getUserOrganization();
  return membership?.organization.id ?? null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUUID(id: string): boolean {
  return UUID_RE.test(id);
}

// ---------------------------------------------------------------------------
// getReportCampaigns — for the campaign selector in the report builder
// ---------------------------------------------------------------------------

export async function getReportCampaigns(
  platform?: AdPlatform | 'all',
): Promise<{ data: ReportCampaignOption[]; error: string | null }> {
  const orgId = await getOrgId();
  if (!orgId) return { data: [], error: 'No organization found' };

  const supabase = await createClient();

  let query = supabase
    .from('campaigns')
    .select('id, name, platform')
    .eq('organization_id', orgId)
    .neq('status', 'archived')
    .order('name', { ascending: true });

  if (platform && platform !== 'all') {
    query = query.eq('platform', platform);
  }

  const { data, error } = await query;
  if (error) return { data: [], error: error.message };

  type Raw = { id: string; name: string; platform: string };
  const rows: ReportCampaignOption[] = ((data ?? []) as Raw[]).map((r) => ({
    id: r.id,
    name: r.name,
    platform: r.platform as AdPlatform,
  }));

  return { data: rows, error: null };
}

// ---------------------------------------------------------------------------
// getReportData — full report with metrics, platform breakdown, campaign list
// ---------------------------------------------------------------------------

export async function getReportData(params: {
  from: string;
  to: string;
  platform?: AdPlatform | 'all';
  campaignIds?: string[];
}): Promise<{ data: ReportData | null; error: string | null }> {
  const { from, to, platform, campaignIds } = params;

  const orgId = await getOrgId();
  if (!orgId) return { data: null, error: 'No organization found' };

  const supabase = await createClient();

  // Validate campaign IDs if provided
  const validCampaignIds = (campaignIds ?? []).filter(isValidUUID);

  // ─── Fetch campaigns with their metrics ───────────────────────────────────
  let query = supabase
    .from('campaigns')
    .select(`
      id, name, platform, status, budget_limit,
      campaign_metrics(spend, impressions, clicks, conversions, revenue, date)
    `)
    .eq('organization_id', orgId)
    .gte('campaign_metrics.date', from)
    .lte('campaign_metrics.date', to)
    .limit(10_000);

  if (platform && platform !== 'all') {
    query = query.eq('platform', platform);
  }

  if (validCampaignIds.length > 0) {
    query = query.in('id', validCampaignIds);
  }

  const { data, error } = await query;
  if (error) return { data: null, error: error.message };

  type RawCampaign = {
    id: string;
    name: string;
    platform: string;
    status: string;
    budget_limit: number;
    campaign_metrics: {
      spend: number;
      impressions: number;
      clicks: number;
      conversions: number;
      revenue: number;
    }[];
  };

  const rows = (data ?? []) as unknown as RawCampaign[];

  // ─── Aggregate per campaign ───────────────────────────────────────────────
  const campaigns: ReportCampaignRow[] = rows.map((row) => {
    const metrics     = row.campaign_metrics ?? [];
    const spend       = metrics.reduce((s, m) => s + (m.spend       ?? 0), 0);
    const impressions = metrics.reduce((s, m) => s + (m.impressions ?? 0), 0);
    const clicks      = metrics.reduce((s, m) => s + (m.clicks      ?? 0), 0);
    const conversions = metrics.reduce((s, m) => s + (m.conversions ?? 0), 0);
    const revenue     = metrics.reduce((s, m) => s + (m.revenue     ?? 0), 0);
    const ctr         = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const roas        = spend > 0       ? revenue / spend               : 0;

    return {
      id:          row.id,
      name:        row.name,
      platform:    row.platform as AdPlatform,
      status:      row.status,
      spend:       +spend.toFixed(2),
      impressions: Math.round(impressions),
      clicks:      Math.round(clicks),
      conversions: +conversions.toFixed(2),
      revenue:     +revenue.toFixed(2),
      ctr:         +ctr.toFixed(2),
      roas:        +roas.toFixed(2),
    };
  });

  // ─── Aggregate overall metrics ────────────────────────────────────────────
  const totalSpend       = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalClicks      = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);
  const totalRevenue     = campaigns.reduce((s, c) => s + c.revenue, 0);
  const avgCtr           = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgRoas          = totalSpend > 0       ? totalRevenue / totalSpend               : 0;

  const generatedAt = new Date().toISOString();

  const metrics: ReportMetrics = {
    totalSpend:       +totalSpend.toFixed(2),
    totalImpressions: Math.round(totalImpressions),
    totalClicks:      Math.round(totalClicks),
    totalConversions: +totalConversions.toFixed(2),
    totalRevenue:     +totalRevenue.toFixed(2),
    avgCtr:           +avgCtr.toFixed(2),
    avgRoas:          +avgRoas.toFixed(2),
    generatedAt,
  };

  // ─── Aggregate per platform ───────────────────────────────────────────────
  const platforms: AdPlatform[] = ['google', 'meta', 'tiktok', 'pinterest'];
  const platformMap = new Map<AdPlatform, ReportCampaignRow[]>(
    platforms.map(p => [p, []]),
  );

  for (const c of campaigns) {
    platformMap.get(c.platform)?.push(c);
  }

  const byPlatform: ReportPlatformRow[] = platforms.map(p => {
    const pCampaigns  = platformMap.get(p) ?? [];
    const pSpend       = pCampaigns.reduce((s, c) => s + c.spend, 0);
    const pImpressions = pCampaigns.reduce((s, c) => s + c.impressions, 0);
    const pClicks      = pCampaigns.reduce((s, c) => s + c.clicks, 0);
    const pConversions = pCampaigns.reduce((s, c) => s + c.conversions, 0);
    const pRevenue     = pCampaigns.reduce((s, c) => s + c.revenue, 0);
    const pCtr         = pImpressions > 0 ? (pClicks / pImpressions) * 100 : 0;
    const pRoas        = pSpend > 0       ? pRevenue / pSpend               : 0;
    const budgetShare  = totalSpend > 0   ? (pSpend / totalSpend) * 100      : 0;

    return {
      platform:    p,
      spend:       +pSpend.toFixed(2),
      impressions: Math.round(pImpressions),
      clicks:      Math.round(pClicks),
      conversions: +pConversions.toFixed(2),
      revenue:     +pRevenue.toFixed(2),
      ctr:         +pCtr.toFixed(2),
      roas:        +pRoas.toFixed(2),
      budgetShare: +budgetShare.toFixed(1),
    };
  });

  // Sort campaigns by spend desc
  campaigns.sort((a, b) => b.spend - a.spend);

  return {
    data: { metrics, byPlatform, campaigns, generatedAt },
    error: null,
  };
}
