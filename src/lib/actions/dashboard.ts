'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserOrganization } from '@/lib/actions/organization';
import type { AdPlatform } from '@/types';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface DashboardMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  avgCtr: number;
  avgRoas: number;
  // period-over-period change (percentage points, null if no prior data)
  spendChange: number | null;
  impressionsChange: number | null;
  clicksChange: number | null;
  conversionsChange: number | null;
  ctrChange: number | null;
  roasChange: number | null;
}

export interface DashboardCampaign {
  id: string;
  name: string;
  platform: AdPlatform;
  status: string;
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  roas: number;
}

export interface DashboardChartPoint {
  day: string; // ISO date "YYYY-MM-DD"
  google: number;
  meta: number;
  tiktok: number;
  pinterest: number;
}

export interface DashboardHourlyPoint {
  h: string; // "0h" … "23h"
  ctr: number;
}

export interface DashboardPlatformSummary {
  platform: AdPlatform;
  spend: number;
  impressions: number;
  conversions: number;
  roas: number;
  budgetShare: number; // 0-100
}

// ---------------------------------------------------------------------------
// Helper — get org for current user
// ---------------------------------------------------------------------------

async function getOrgId(): Promise<string | null> {
  const membership = await getUserOrganization();
  return membership?.organization.id ?? null;
}

// ---------------------------------------------------------------------------
// getDashboardMetrics
// ---------------------------------------------------------------------------

export async function getDashboardMetrics(
  from: string,
  to: string,
  platform?: AdPlatform | 'all',
): Promise<{ data: DashboardMetrics | null; error: string | null }> {
  const orgId = await getOrgId();
  if (!orgId) return { data: null, error: 'No organization found' };

  const supabase = await createClient();

  // Current period query
  let query = supabase
    .from('campaign_metrics')
    .select('spend, impressions, clicks, conversions, ctr, roas')
    .eq('org_id', orgId)
    .gte('date', from)
    .lte('date', to);

  if (platform && platform !== 'all') {
    query = query.eq('platform', platform);
  }

  const { data: current, error } = await query;
  if (error) return { data: null, error: error.message };
  if (!current || current.length === 0) {
    return {
      data: {
        totalSpend: 0, totalImpressions: 0, totalClicks: 0,
        totalConversions: 0, avgCtr: 0, avgRoas: 0,
        spendChange: null, impressionsChange: null, clicksChange: null,
        conversionsChange: null, ctrChange: null, roasChange: null,
      },
      error: null,
    };
  }

  // Aggregate current period
  const agg = current.reduce(
    (acc, r) => ({
      spend:       acc.spend       + (r.spend       ?? 0),
      impressions: acc.impressions + (r.impressions  ?? 0),
      clicks:      acc.clicks      + (r.clicks       ?? 0),
      conversions: acc.conversions + (r.conversions  ?? 0),
      ctrSum:      acc.ctrSum      + (r.ctr          ?? 0),
      roasSum:     acc.roasSum     + (r.roas         ?? 0),
      count:       acc.count       + 1,
    }),
    { spend: 0, impressions: 0, clicks: 0, conversions: 0, ctrSum: 0, roasSum: 0, count: 0 },
  );

  const avgCtr  = agg.count > 0 ? agg.ctrSum  / agg.count : 0;
  const avgRoas = agg.count > 0 ? agg.roasSum / agg.count : 0;

  // Prior period — same length window ending the day before `from`
  const fromDate = new Date(from);
  const toDate   = new Date(to);
  const windowMs = toDate.getTime() - fromDate.getTime();
  const priorTo  = new Date(fromDate.getTime() - 86_400_000);
  const priorFrom = new Date(priorTo.getTime() - windowMs);
  const priorFromStr = priorFrom.toISOString().slice(0, 10);
  const priorToStr   = priorTo.toISOString().slice(0, 10);

  let priorQuery = supabase
    .from('campaign_metrics')
    .select('spend, impressions, clicks, conversions, ctr, roas')
    .eq('org_id', orgId)
    .gte('date', priorFromStr)
    .lte('date', priorToStr);

  if (platform && platform !== 'all') {
    priorQuery = priorQuery.eq('platform', platform);
  }

  const { data: prior } = await priorQuery;
  const priorAgg = (prior ?? []).reduce(
    (acc, r) => ({
      spend:       acc.spend       + (r.spend       ?? 0),
      impressions: acc.impressions + (r.impressions  ?? 0),
      clicks:      acc.clicks      + (r.clicks       ?? 0),
      conversions: acc.conversions + (r.conversions  ?? 0),
      ctrSum:      acc.ctrSum      + (r.ctr          ?? 0),
      roasSum:     acc.roasSum     + (r.roas         ?? 0),
      count:       acc.count       + 1,
    }),
    { spend: 0, impressions: 0, clicks: 0, conversions: 0, ctrSum: 0, roasSum: 0, count: 0 },
  );

  function pctChange(curr: number, prev: number): number | null {
    if (prev === 0) return null;
    return +((curr - prev) / prev * 100).toFixed(1);
  }

  const priorAvgCtr  = priorAgg.count > 0 ? priorAgg.ctrSum  / priorAgg.count : 0;
  const priorAvgRoas = priorAgg.count > 0 ? priorAgg.roasSum / priorAgg.count : 0;

  return {
    data: {
      totalSpend:       agg.spend,
      totalImpressions: agg.impressions,
      totalClicks:      agg.clicks,
      totalConversions: agg.conversions,
      avgCtr,
      avgRoas,
      spendChange:       pctChange(agg.spend,       priorAgg.spend),
      impressionsChange: pctChange(agg.impressions,  priorAgg.impressions),
      clicksChange:      pctChange(agg.clicks,       priorAgg.clicks),
      conversionsChange: pctChange(agg.conversions,  priorAgg.conversions),
      ctrChange:         pctChange(avgCtr,            priorAvgCtr),
      roasChange:        pctChange(avgRoas,           priorAvgRoas),
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// getDashboardCampaigns
// ---------------------------------------------------------------------------

export async function getDashboardCampaigns(
  from: string,
  to: string,
  platform?: AdPlatform | 'all',
): Promise<{ data: DashboardCampaign[]; error: string | null }> {
  const orgId = await getOrgId();
  if (!orgId) return { data: [], error: 'No organization found' };

  const supabase = await createClient();

  // Join campaigns with aggregated metrics for the date range
  let query = supabase
    .from('campaigns')
    .select(`
      id, name, platform, status, budget,
      campaign_metrics!inner(
        spend, impressions, clicks, conversions, ctr, roas, date
      )
    `)
    .eq('org_id', orgId)
    .eq('campaign_metrics.org_id', orgId)
    .gte('campaign_metrics.date', from)
    .lte('campaign_metrics.date', to)
    .neq('status', 'deleted');

  if (platform && platform !== 'all') {
    query = query.eq('platform', platform);
  }

  const { data, error } = await query;
  if (error) return { data: [], error: error.message };

  // Aggregate metrics per campaign
  type RawRow = {
    id: string; name: string; platform: string; status: string; budget: number;
    campaign_metrics: { spend: number; impressions: number; clicks: number; conversions: number; ctr: number; roas: number }[];
  };

  const campaigns: DashboardCampaign[] = ((data ?? []) as unknown as RawRow[]).map((row) => {
    const metrics = row.campaign_metrics ?? [];
    const spend       = metrics.reduce((s, m) => s + (m.spend       ?? 0), 0);
    const impressions = metrics.reduce((s, m) => s + (m.impressions  ?? 0), 0);
    const clicks      = metrics.reduce((s, m) => s + (m.clicks       ?? 0), 0);
    const conversions = metrics.reduce((s, m) => s + (m.conversions  ?? 0), 0);
    const avgCtr  = metrics.length > 0 ? metrics.reduce((s, m) => s + (m.ctr  ?? 0), 0) / metrics.length : 0;
    const avgRoas = metrics.length > 0 ? metrics.reduce((s, m) => s + (m.roas ?? 0), 0) / metrics.length : 0;

    return {
      id:          row.id,
      name:        row.name,
      platform:    row.platform as AdPlatform,
      status:      row.status,
      budget:      row.budget ?? 0,
      spend:       +spend.toFixed(2),
      impressions: Math.round(impressions),
      clicks:      Math.round(clicks),
      conversions: Math.round(conversions),
      ctr:         +avgCtr.toFixed(2),
      roas:        +avgRoas.toFixed(2),
    };
  });

  return { data: campaigns, error: null };
}

// ---------------------------------------------------------------------------
// getDashboardChartData
// ---------------------------------------------------------------------------

export async function getDashboardChartData(
  from: string,
  to: string,
): Promise<{ data: DashboardChartPoint[]; error: string | null }> {
  const orgId = await getOrgId();
  if (!orgId) return { data: [], error: 'No organization found' };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('campaign_metrics')
    .select('date, platform, impressions')
    .eq('org_id', orgId)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: true });

  if (error) return { data: [], error: error.message };

  // Group by date × platform, sum impressions
  const map = new Map<string, DashboardChartPoint>();

  for (const row of data ?? []) {
    const day = row.date as string;
    if (!map.has(day)) {
      map.set(day, { day, google: 0, meta: 0, tiktok: 0, pinterest: 0 });
    }
    const point = map.get(day)!;
    const platform = row.platform as AdPlatform;
    if (platform in point) {
      (point as Record<string, number>)[platform] += row.impressions ?? 0;
    }
  }

  return { data: Array.from(map.values()), error: null };
}

// ---------------------------------------------------------------------------
// getDashboardHourlyData
// ---------------------------------------------------------------------------

export async function getDashboardHourlyData(): Promise<{
  data: DashboardHourlyPoint[];
  error: string | null;
}> {
  const orgId = await getOrgId();
  if (!orgId) return { data: [], error: 'No organization found' };

  const supabase = await createClient();

  // Last 7 days of hourly data
  const since = new Date();
  since.setDate(since.getDate() - 6);
  const sinceStr = since.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('hourly_metrics')
    .select('hour, clicks, impressions')
    .eq('org_id', orgId)
    .gte('date', sinceStr)
    .order('hour', { ascending: true });

  if (error) return { data: [], error: error.message };

  // Average CTR per hour across all platforms / days
  const hourMap = new Map<number, { clicks: number; impressions: number }>();
  for (const row of data ?? []) {
    const h = row.hour as number;
    const prev = hourMap.get(h) ?? { clicks: 0, impressions: 0 };
    hourMap.set(h, {
      clicks:      prev.clicks      + (row.clicks      ?? 0),
      impressions: prev.impressions  + (row.impressions  ?? 0),
    });
  }

  const result: DashboardHourlyPoint[] = Array.from({ length: 24 }, (_, h) => {
    const agg = hourMap.get(h) ?? { clicks: 0, impressions: 0 };
    const ctr = agg.impressions > 0
      ? +((agg.clicks / agg.impressions) * 100).toFixed(2)
      : 0;
    return { h: `${h}h`, ctr };
  });

  return { data: result, error: null };
}

// ---------------------------------------------------------------------------
// getDashboardPlatformSummary
// ---------------------------------------------------------------------------

export async function getDashboardPlatformSummary(
  from: string,
  to: string,
): Promise<{ data: DashboardPlatformSummary[]; error: string | null }> {
  const orgId = await getOrgId();
  if (!orgId) return { data: [], error: 'No organization found' };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('campaign_metrics')
    .select('platform, spend, impressions, conversions, roas')
    .eq('org_id', orgId)
    .gte('date', from)
    .lte('date', to);

  if (error) return { data: [], error: error.message };

  const platforms: AdPlatform[] = ['google', 'meta', 'tiktok', 'pinterest'];
  const platformMap = new Map<AdPlatform, { spend: number; impressions: number; conversions: number; roasSum: number; count: number }>(
    platforms.map(p => [p, { spend: 0, impressions: 0, conversions: 0, roasSum: 0, count: 0 }]),
  );

  for (const row of data ?? []) {
    const p = row.platform as AdPlatform;
    if (!platformMap.has(p)) continue;
    const prev = platformMap.get(p)!;
    platformMap.set(p, {
      spend:       prev.spend       + (row.spend       ?? 0),
      impressions: prev.impressions  + (row.impressions  ?? 0),
      conversions: prev.conversions  + (row.conversions  ?? 0),
      roasSum:     prev.roasSum      + (row.roas         ?? 0),
      count:       prev.count        + 1,
    });
  }

  const totalSpend = Array.from(platformMap.values()).reduce((s, p) => s + p.spend, 0);

  const result: DashboardPlatformSummary[] = platforms.map(p => {
    const agg = platformMap.get(p)!;
    return {
      platform:    p,
      spend:       +agg.spend.toFixed(2),
      impressions: Math.round(agg.impressions),
      conversions: Math.round(agg.conversions),
      roas:        agg.count > 0 ? +(agg.roasSum / agg.count).toFixed(2) : 0,
      budgetShare: totalSpend > 0 ? Math.round((agg.spend / totalSpend) * 100) : 0,
    };
  });

  return { data: result, error: null };
}
