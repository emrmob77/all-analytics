'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserOrganization } from '@/lib/actions/organization';
import { formatCurrencySymbol } from '@/lib/format';
import { getConnectedGoogleAdsAccount } from '@/lib/actions/google-ads';
import type { AdPlatform } from '@/types';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface DashboardMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  avgCtr: number;
  avgRoas: number;
  // period-over-period change (percentage points, null if no prior data)
  spendChange: number | null;
  impressionsChange: number | null;
  clicksChange: number | null;
  conversionsChange: number | null;
  ctrChange: number | null;
  roasChange: number | null;
  currencyCode?: string;
  currencySymbol?: string;
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
  currency?: string;
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
  currency?: string;
}

// ---------------------------------------------------------------------------
// Helper — get org for current user
// ---------------------------------------------------------------------------

async function getOrgId(): Promise<string | null> {
  const membership = await getUserOrganization();
  return membership?.organization.id ?? null;
}

// ---------------------------------------------------------------------------
// Helper — aggregate raw metric rows
// ---------------------------------------------------------------------------

type RawMetricRow = {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
};

type RawMetricWithCampaignRow = RawMetricRow & {
  campaigns?: {
    currency?: string | null;
  } | null;
};

function aggregateMetrics(rows: RawMetricRow[]) {
  const agg = rows.reduce(
    (acc, r) => ({
      spend: acc.spend + (r.spend ?? 0),
      impressions: acc.impressions + (r.impressions ?? 0),
      clicks: acc.clicks + (r.clicks ?? 0),
      conversions: acc.conversions + (r.conversions ?? 0),
      revenue: acc.revenue + (r.revenue ?? 0),
    }),
    { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 },
  );

  const ctr = agg.impressions > 0 ? (agg.clicks / agg.impressions) * 100 : 0;
  const roas = agg.spend > 0 ? agg.revenue / agg.spend : 0;

  return { ...agg, ctr, roas };
}

function pctChange(curr: number, prev: number): number | null {
  if (prev === 0) return null;
  return +((curr - prev) / prev * 100).toFixed(1);
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

  let query = supabase
    .from('campaign_metrics')
    .select('spend, impressions, clicks, conversions, revenue, campaigns!inner(organization_id, platform, currency)')
    .eq('campaigns.organization_id', orgId)
    .gte('date', from)
    .lte('date', to);

  if (platform && platform !== 'all') {
    query = query.eq('campaigns.platform', platform);
  }

  // Filter Google campaigns by active child account if applicable
  if (!platform || platform === 'all' || platform === 'google') {
    const googleAccount = await getConnectedGoogleAdsAccount();
    if (googleAccount?.selected_child_account_id) {
      if (platform === 'google') {
        query = query.eq('campaigns.child_ad_account_id', googleAccount.selected_child_account_id);
      } else {
        query = query.or(`platform.neq.google,and(platform.eq.google,child_ad_account_id.eq.${googleAccount.selected_child_account_id})`, { foreignTable: 'campaigns' });
      }
    }
  }

  const { data: current, error } = await query;
  if (error) return { data: null, error: error.message };

  if (!current || current.length === 0) {
    return {
      data: {
        totalSpend: 0, totalImpressions: 0, totalClicks: 0,
        totalConversions: 0, totalRevenue: 0, avgCtr: 0, avgRoas: 0,
        spendChange: null, impressionsChange: null, clicksChange: null,
        conversionsChange: null, ctrChange: null, roasChange: null,
        currencyCode: 'USD', currencySymbol: '$',
      },
      error: null,
    };
  }

  const currentRows = (current ?? []) as unknown as RawMetricWithCampaignRow[];
  const currAgg = aggregateMetrics(currentRows);

  // Prior period — same length window ending the day before `from`
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const windowMs = toDate.getTime() - fromDate.getTime();
  const priorTo = new Date(fromDate.getTime() - 86_400_000);
  const priorFrom = new Date(priorTo.getTime() - windowMs);
  const priorFromStr = priorFrom.toISOString().slice(0, 10);
  const priorToStr = priorTo.toISOString().slice(0, 10);

  let priorQuery = supabase
    .from('campaign_metrics')
    .select('spend, impressions, clicks, conversions, revenue, campaigns!inner(organization_id, platform)')
    .eq('campaigns.organization_id', orgId)
    .gte('date', priorFromStr)
    .lte('date', priorToStr);

  if (platform && platform !== 'all') {
    priorQuery = priorQuery.eq('campaigns.platform', platform);
  }

  // Same logic for PriorQuery
  if (!platform || platform === 'all' || platform === 'google') {
    const googleAccount = await getConnectedGoogleAdsAccount();
    if (googleAccount?.selected_child_account_id) {
      if (platform === 'google') {
        priorQuery = priorQuery.eq('campaigns.child_ad_account_id', googleAccount.selected_child_account_id);
      } else {
        priorQuery = priorQuery.or(`platform.neq.google,and(platform.eq.google,child_ad_account_id.eq.${googleAccount.selected_child_account_id})`, { foreignTable: 'campaigns' });
      }
    }
  }

  const { data: prior } = await priorQuery;
  const priorAgg = aggregateMetrics((prior ?? []) as unknown as RawMetricRow[]);

  return {
    data: {
      totalSpend: +currAgg.spend.toFixed(2),
      totalImpressions: Math.round(currAgg.impressions),
      totalClicks: Math.round(currAgg.clicks),
      totalConversions: +currAgg.conversions.toFixed(2),
      totalRevenue: +currAgg.revenue.toFixed(2),
      avgCtr: +currAgg.ctr.toFixed(2),
      avgRoas: +currAgg.roas.toFixed(2),
      spendChange: pctChange(currAgg.spend, priorAgg.spend),
      impressionsChange: pctChange(currAgg.impressions, priorAgg.impressions),
      clicksChange: pctChange(currAgg.clicks, priorAgg.clicks),
      conversionsChange: pctChange(currAgg.conversions, priorAgg.conversions),
      ctrChange: pctChange(currAgg.ctr, priorAgg.ctr),
      roasChange: pctChange(currAgg.roas, priorAgg.roas),
      currencyCode: currentRows[0]?.campaigns?.currency ?? 'USD',
      currencySymbol: formatCurrencySymbol(currentRows[0]?.campaigns?.currency ?? 'USD'),
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

  let query = supabase
    .from('campaigns')
    .select(`
      id, name, platform, status, budget_limit, currency,
      campaign_metrics!inner(
        spend, impressions, clicks, conversions, revenue, date
      )
    `)
    .eq('organization_id', orgId)
    .gte('campaign_metrics.date', from)
    .lte('campaign_metrics.date', to)
    .neq('status', 'archived');

  if (platform && platform !== 'all') {
    query = query.eq('platform', platform);
  }

  if (!platform || platform === 'all' || platform === 'google') {
    const googleAccount = await getConnectedGoogleAdsAccount();
    if (googleAccount?.selected_child_account_id) {
      if (platform === 'google') {
        query = query.eq('child_ad_account_id', googleAccount.selected_child_account_id);
      } else {
        query = query.or(`platform.neq.google,and(platform.eq.google,child_ad_account_id.eq.${googleAccount.selected_child_account_id})`);
      }
    }
  }

  const { data, error } = await query;
  if (error) return { data: [], error: error.message };

  type RawRow = {
    id: string;
    name: string;
    platform: string;
    status: string;
    budget_limit: number;
    currency: string;
    campaign_metrics: {
      spend: number;
      impressions: number;
      clicks: number;
      conversions: number;
      revenue: number;
    }[];
  };

  const campaigns: DashboardCampaign[] = ((data ?? []) as unknown as RawRow[]).map((row) => {
    const metrics = row.campaign_metrics ?? [];
    const spend = metrics.reduce((s, m) => s + (m.spend ?? 0), 0);
    const impressions = metrics.reduce((s, m) => s + (m.impressions ?? 0), 0);
    const clicks = metrics.reduce((s, m) => s + (m.clicks ?? 0), 0);
    const conversions = metrics.reduce((s, m) => s + (m.conversions ?? 0), 0);
    const revenue = metrics.reduce((s, m) => s + (m.revenue ?? 0), 0);
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const roas = spend > 0 ? revenue / spend : 0;

    return {
      id: row.id,
      name: row.name,
      platform: row.platform as AdPlatform,
      status: row.status,
      budget: row.budget_limit ?? 0,
      spend: +spend.toFixed(2),
      impressions: Math.round(impressions),
      clicks: Math.round(clicks),
      conversions: +conversions.toFixed(2),
      ctr: +ctr.toFixed(2),
      roas: +roas.toFixed(2),
      currency: row.currency ?? 'USD',
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

  let query = supabase
    .from('campaign_metrics')
    .select('date, impressions, campaigns!inner(organization_id, platform)')
    .eq('campaigns.organization_id', orgId)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: true });

  const googleAccount = await getConnectedGoogleAdsAccount();
  if (googleAccount?.selected_child_account_id) {
    query = query.or(`platform.neq.google,and(platform.eq.google,child_ad_account_id.eq.${googleAccount.selected_child_account_id})`, { foreignTable: 'campaigns' });
  }

  const { data, error } = await query;

  if (error) return { data: [], error: error.message };

  type RawChartRow = {
    date: string;
    impressions: number;
    campaigns: { organization_id: string; platform: string };
  };

  const map = new Map<string, DashboardChartPoint>();

  for (const row of (data ?? []) as unknown as RawChartRow[]) {
    const day = row.date as string;
    const platform = row.campaigns?.platform as string;
    if (!map.has(day)) {
      map.set(day, { day, google: 0, meta: 0, tiktok: 0, pinterest: 0 });
    }
    const point = map.get(day)!;
    if (platform in point) {
      (point as unknown as Record<string, number>)[platform] += row.impressions ?? 0;
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

  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);
  const sinceStr = since.toISOString();

  let query = supabase
    .from('hourly_metrics')
    .select('hour, clicks, impressions, campaigns!inner(organization_id, platform)')
    .eq('campaigns.organization_id', orgId)
    .gte('hour', sinceStr)
    .order('hour', { ascending: true });

  const googleAccount = await getConnectedGoogleAdsAccount();
  if (googleAccount?.selected_child_account_id) {
    query = query.or(`platform.neq.google,and(platform.eq.google,child_ad_account_id.eq.${googleAccount.selected_child_account_id})`, { foreignTable: 'campaigns' });
  }

  const { data, error } = await query;

  if (error) return { data: [], error: error.message };

  type RawHourlyRow = {
    hour: string; // TIMESTAMPTZ string
    clicks: number;
    impressions: number;
  };

  // Average CTR per hour-of-day (0-23) across all platforms / days
  const hourMap = new Map<number, { clicks: number; impressions: number }>();
  for (const row of (data ?? []) as unknown as RawHourlyRow[]) {
    const h = new Date(row.hour).getUTCHours();
    const prev = hourMap.get(h) ?? { clicks: 0, impressions: 0 };
    hourMap.set(h, {
      clicks: prev.clicks + (row.clicks ?? 0),
      impressions: prev.impressions + (row.impressions ?? 0),
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

  let query = supabase
    .from('campaign_metrics')
    .select('spend, impressions, conversions, revenue, campaigns!inner(organization_id, platform, currency)')
    .eq('campaigns.organization_id', orgId)
    .gte('date', from)
    .lte('date', to);

  const googleAccount = await getConnectedGoogleAdsAccount();
  if (googleAccount?.selected_child_account_id) {
    query = query.or(`platform.neq.google,and(platform.eq.google,child_ad_account_id.eq.${googleAccount.selected_child_account_id})`, { foreignTable: 'campaigns' });
  }

  const { data, error } = await query;

  if (error) return { data: [], error: error.message };

  type RawSummaryRow = {
    spend: number;
    impressions: number;
    conversions: number;
    revenue: number;
    campaigns: { organization_id: string; platform: string; currency: string };
  };

  const platforms: AdPlatform[] = ['google', 'meta', 'tiktok', 'pinterest'];
  const platformMap = new Map<AdPlatform, { spend: number; impressions: number; conversions: number; revenue: number; currency: string }>(
    platforms.map(p => [p, { spend: 0, impressions: 0, conversions: 0, revenue: 0, currency: 'USD' }]),
  );

  for (const row of (data ?? []) as unknown as RawSummaryRow[]) {
    const p = row.campaigns?.platform as AdPlatform;
    if (!platformMap.has(p)) continue;
    const prev = platformMap.get(p)!;
    platformMap.set(p, {
      spend: prev.spend + (row.spend ?? 0),
      impressions: prev.impressions + (row.impressions ?? 0),
      conversions: prev.conversions + (row.conversions ?? 0),
      revenue: prev.revenue + (row.revenue ?? 0),
      currency: row.campaigns?.currency || prev.currency,
    });
  }

  const totalSpend = Array.from(platformMap.values()).reduce((s, p) => s + p.spend, 0);

  const result: DashboardPlatformSummary[] = platforms.map(p => {
    const agg = platformMap.get(p)!;
    const roas = agg.spend > 0 ? agg.revenue / agg.spend : 0;
    return {
      platform: p,
      spend: +agg.spend.toFixed(2),
      impressions: Math.round(agg.impressions),
      conversions: +agg.conversions.toFixed(2),
      roas: +roas.toFixed(2),
      budgetShare: totalSpend > 0 ? Math.round((agg.spend / totalSpend) * 100) : 0,
      currency: agg.currency,
    };
  });

  return { data: result, error: null };
}
