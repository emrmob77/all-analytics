'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserOrganization } from './organization';
import { getConnectedGoogleAdsAccount } from '@/lib/actions/google-ads';
import type { AdPlatform } from '@/types';

export interface AdGroupRow {
    id: string;
    name: string;
    platform: AdPlatform;
    status: string;
    impressions: number;
    clicks: number;
    ctr: number;
    spend: number;
    currency: string;
    campaignName: string;
}

export interface GetAdGroupsParams {
    from: string; // YYYY-MM-DD
    to: string; // YYYY-MM-DD
    platform?: AdPlatform | 'all';
    search?: string;
    page?: number;
    pageSize?: number;
}

export async function getAdGroups({
    from,
    to,
    platform = 'all',
    search,
    page = 1,
    pageSize = 50,
}: GetAdGroupsParams): Promise<{ data: AdGroupRow[]; total: number; error?: string }> {
    try {
        const membership = await getUserOrganization();
        if (!membership) throw new Error('Unauthorized');

        const supabase = await createClient();

        let query = supabase
            .from('adgroups')
            .select('*, campaigns!inner(name, currency)', { count: 'exact' })
            .eq('organization_id', membership.organization.id);

        if (platform !== 'all') {
            query = query.eq('platform', platform);
        }

        if (search) {
            const escaped = search.trim().replace(/[%_\\]/g, '\\$&');
            query = query.ilike('name', `%${escaped}%`);
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

        // Pagination
        const fromRow = (page - 1) * pageSize;
        const toRow = fromRow + pageSize - 1;
        query = query.range(fromRow, toRow);

        const { data: adgroups, count, error: agError } = await query;
        if (agError) throw agError;
        if (!adgroups || adgroups.length === 0) {
            return { data: [], total: count ?? 0 };
        }

        const adgroupIds = adgroups.map((ag) => ag.id);

        const { data: metrics, error: metricsError } = await supabase
            .from('adgroup_metrics')
            .select('adgroup_id, spend, impressions, clicks')
            .in('adgroup_id', adgroupIds)
            .gte('date', from)
            .lte('date', to)
            .limit(10_000);

        if (metricsError) throw metricsError;

        const aggMap = new Map<string, { spend: number; impressions: number; clicks: number }>();
        for (const m of metrics ?? []) {
            const id = m.adgroup_id;
            if (!aggMap.has(id)) {
                aggMap.set(id, { spend: 0, impressions: 0, clicks: 0 });
            }
            const state = aggMap.get(id)!;
            state.spend += Number(m.spend);
            state.impressions += Number(m.impressions);
            state.clicks += Number(m.clicks);
        }

        const rows: AdGroupRow[] = adgroups.map((ag) => {
            const m = aggMap.get(ag.id) ?? { spend: 0, impressions: 0, clicks: 0 };
            const ctr = m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0;

            return {
                id: ag.id,
                name: ag.name,
                platform: ag.platform,
                status: ag.status,
                impressions: m.impressions,
                clicks: m.clicks,
                ctr,
                spend: m.spend,
                campaignName: Array.isArray(ag.campaigns)
                    ? (ag.campaigns[0] as unknown as { name: string })?.name || ''
                    : (ag.campaigns as unknown as { name: string })?.name || '',
                currency: (Array.isArray(ag.campaigns)
                    ? (ag.campaigns[0] as unknown as { currency: string })?.currency
                    : (ag.campaigns as unknown as { currency: string })?.currency
                )?.trim() || 'USD',
            };
        });

        return { data: rows, total: count ?? 0 };
    } catch (err) {
        console.error('getAdGroups error:', err);
        return { data: [], total: 0, error: err instanceof Error ? err.message : String(err) };
    }
}
