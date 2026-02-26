'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserOrganization } from './organization';
import type { AdPlatform } from '@/types';

export type KeywordStatus = 'enabled' | 'paused' | 'removed';
export type KeywordMatchType = 'exact' | 'phrase' | 'broad';

export interface KeywordRow {
  id: string;
  keyword: string;
  matchType: KeywordMatchType;
  status: KeywordStatus;
  impressions: number;
  clicks: number;
  ctr: number;
  avgCpc: number;
  qualityScore: number;
  campaignName: string;
  currency: string;
  platform: AdPlatform;
}

export interface GetKeywordsParams {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  platform?: AdPlatform | 'all';
  status?: KeywordStatus | 'all';
  matchType?: KeywordMatchType | 'all';
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function getKeywords({
  from,
  to,
  platform = 'all',
  status = 'all',
  matchType = 'all',
  search,
  page = 1,
  pageSize = 50,
}: GetKeywordsParams): Promise<{ data: KeywordRow[]; total: number; error?: string }> {
  try {
    const membership = await getUserOrganization();
    if (!membership) throw new Error('Unauthorized');

    const supabase = await createClient();

    // 1. Get base keywords query
    let query = supabase
      .from('keywords')
      .select('*, campaigns!inner(name, currency)', { count: 'exact' })
      .eq('organization_id', membership.organization.id);

    if (platform !== 'all') {
      query = query.eq('platform', platform);
    }

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (matchType !== 'all') {
      query = query.eq('match_type', matchType);
    }

    if (search) {
      const escaped = search.trim().replace(/[%_\\]/g, '\\$&');
      query = query.ilike('text', `%${escaped}%`);
    }

    // Pagination
    const fromRow = (page - 1) * pageSize;
    const toRow = fromRow + pageSize - 1;
    query = query.range(fromRow, toRow);

    const { data: keywords, count, error: kwError } = await query;
    if (kwError) throw kwError;
    if (!keywords || keywords.length === 0) {
      return { data: [], total: count ?? 0 };
    }

    const keywordIds = keywords.map((k) => k.id);

    // 2. Fetch metrics
    const { data: metrics, error: metricsError } = await supabase
      .from('keyword_metrics')
      .select('keyword_id, spend, impressions, clicks')
      .in('keyword_id', keywordIds)
      .gte('date', from)
      .lte('date', to)
      .limit(10_000);

    if (metricsError) throw metricsError;

    // 3. Aggregate metrics
    const aggMap = new Map<string, { spend: number; impressions: number; clicks: number }>();
    for (const m of metrics ?? []) {
      const id = m.keyword_id;
      if (!aggMap.has(id)) {
        aggMap.set(id, { spend: 0, impressions: 0, clicks: 0 });
      }
      const state = aggMap.get(id)!;
      state.spend += Number(m.spend);
      state.impressions += Number(m.impressions);
      state.clicks += Number(m.clicks);
    }

    // 4. Map to KeywordRow
    const rows: KeywordRow[] = keywords.map((kw) => {
      const m = aggMap.get(kw.id) ?? { spend: 0, impressions: 0, clicks: 0 };
      const ctr = m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0;
      const avgCpc = m.clicks > 0 ? m.spend / m.clicks : 0;

      return {
        id: kw.id,
        keyword: kw.text,
        matchType: kw.match_type,
        status: kw.status,
        impressions: m.impressions,
        clicks: m.clicks,
        ctr,
        avgCpc,
        qualityScore: kw.quality_score ?? 5, // fallback
        campaignName: Array.isArray(kw.campaigns)
          ? (kw.campaigns[0] as unknown as { name: string })?.name || ''
          : (kw.campaigns as unknown as { name: string })?.name || '',
        currency: (Array.isArray(kw.campaigns)
          ? (kw.campaigns[0] as unknown as { currency: string })?.currency
          : (kw.campaigns as unknown as { currency: string })?.currency
        )?.trim() || 'USD',
        platform: kw.platform
      };
    });

    return { data: rows, total: count ?? 0 };
  } catch (err) {
    console.error('getKeywords error:', err);
    return { data: [], total: 0, error: err instanceof Error ? err.message : String(err) };
  }
}
