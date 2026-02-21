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

export type SortableCampaignColumn = keyof CampaignRow;

export interface GetCampaignsParams {
  from: string;
  to: string;
  platform?: AdPlatform | 'all';
  status?: CampaignStatus | 'all';
  search?: string;
  page?: number;
  pageSize?: number;
  sortColumn?: SortableCampaignColumn;
  sortDirection?: 'asc' | 'desc';
}

export interface GetCampaignsResult {
  data: CampaignRow[];
  total: number;
  error: string | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUUID(id: string): boolean {
  return UUID_RE.test(id);
}

const VALID_STATUSES = new Set<CampaignStatus>(['active', 'paused', 'stopped', 'archived']);
function isValidStatus(s: string): s is CampaignStatus {
  return VALID_STATUSES.has(s as CampaignStatus);
}

async function getOrgId(): Promise<string | null> {
  const membership = await getUserOrganization();
  return membership?.organization.id ?? null;
}

export async function getCampaigns(params: GetCampaignsParams): Promise<GetCampaignsResult> {
  const orgId = await getOrgId();
  if (!orgId) return { data: [], total: 0, error: 'No organization found' };

  const {
    from, to, platform, status, search,
    page = 1, pageSize = 50,
    sortColumn = 'spend', sortDirection = 'desc',
  } = params;

  const supabase = await createClient();

  // Fetch campaigns with date-filtered metrics in a single query.
  // Nested date filters on campaign_metrics reduce payload without excluding
  // campaigns that have no metrics in the range (left-join semantics).
  // .limit(10_000) guards against the PostgREST default 1 000-row cap.
  let query = supabase
    .from('campaigns')
    .select(`
      id, name, platform, status, budget_limit, created_at,
      campaign_metrics(spend, impressions, clicks, conversions, revenue, date)
    `)
    .eq('organization_id', orgId)
    .gte('campaign_metrics.date', from)
    .lte('campaign_metrics.date', to)
    .limit(10_000);

  if (platform && platform !== 'all') query = query.eq('platform', platform);
  if (status && status !== 'all')     query = query.eq('status', status);
  if (search?.trim()) {
    // Escape PostgreSQL LIKE metacharacters so they match literally
    const escaped = search.trim().replace(/[%_\\]/g, '\\$&');
    query = query.ilike('name', `%${escaped}%`);
  }

  // No .order() here — JS-side sort below handles ordering before pagination
  const { data, error } = await query;
  if (error) return { data: [], total: 0, error: error.message };

  type RawRow = {
    id: string; name: string; platform: string; status: string;
    budget_limit: number; created_at: string;
    campaign_metrics: { spend: number; impressions: number; clicks: number; conversions: number; revenue: number; date: string }[];
  };

  // Aggregate pre-filtered metrics per campaign
  const rows: CampaignRow[] = ((data ?? []) as unknown as RawRow[]).map((row) => {
    const metrics = row.campaign_metrics ?? [];
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

  // Server-side sort before pagination
  rows.sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
    }
    return sortDirection === 'desc'
      ? String(bVal).localeCompare(String(aVal))
      : String(aVal).localeCompare(String(bVal));
  });

  const total = rows.length;
  const start = (page - 1) * pageSize;
  const paged = rows.slice(start, start + pageSize);

  return { data: paged, total, error: null };
}

export async function updateCampaignStatus(
  campaignId: string,
  newStatus: CampaignStatus,
): Promise<{ error: string | null }> {
  if (!isValidUUID(campaignId)) return { error: 'Invalid campaign ID' };
  if (!isValidStatus(newStatus)) return { error: 'Invalid status value' };

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

export async function updateCampaignBudget(
  campaignId: string,
  newBudget: number,
): Promise<{ error: string | null }> {
  if (!isValidUUID(campaignId)) return { error: 'Invalid campaign ID' };
  if (!Number.isFinite(newBudget) || newBudget <= 0) return { error: 'Budget must be greater than 0' };

  const orgId = await getOrgId();
  if (!orgId) return { error: 'No organization found' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('campaigns')
    .update({ budget_limit: newBudget, updated_at: new Date().toISOString() })
    .eq('id', campaignId)
    .eq('organization_id', orgId);

  return { error: error?.message ?? null };
}

export async function bulkUpdateCampaignStatus(
  campaignIds: string[],
  newStatus: CampaignStatus,
): Promise<{ error: string | null }> {
  if (!campaignIds.length) return { error: null };
  if (campaignIds.length > 500) return { error: 'Too many campaigns selected (max 500)' };
  if (!isValidStatus(newStatus)) return { error: 'Invalid status value' };

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
