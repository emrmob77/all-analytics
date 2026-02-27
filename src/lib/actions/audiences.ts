'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserOrganization } from './organization';
import { getConnectedGoogleAdsAccount } from '@/lib/actions/google-ads';
import type { AdPlatform } from '@/types';

export type AudienceType = 'Lookalike' | 'Remarketing' | 'Interest' | 'Custom';

export interface AudienceRow {
    id: string;
    name: string;
    type: AudienceType;
    platform: AdPlatform;
    size: number;
    sizeLabel: string;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    spend: number;
    ctr: number;
    cvr: number;
}

export interface GetAudiencesParams {
    from: string; // YYYY-MM-DD
    to: string; // YYYY-MM-DD
    platform?: AdPlatform | 'all';
    type?: AudienceType | 'all';
    search?: string;
}

function formatSize(size: number): string {
    if (size >= 1_000_000) return `${(size / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (size >= 1_000) return `${(size / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    return size.toString();
}

export async function getAudiences({
    from,
    to,
    platform = 'all',
    type = 'all',
    search,
}: GetAudiencesParams): Promise<{ data: AudienceRow[]; error?: string }> {
    try {
        const membership = await getUserOrganization();
        if (!membership) throw new Error('Unauthorized');

        const supabase = await createClient();

        let query = supabase
            .from('audiences')
            .select('id, name, type, size, platform')
            .eq('organization_id', membership.organization.id);

        if (platform !== 'all') {
            query = query.eq('platform', platform);
        }

        if (type !== 'all') {
            query = query.eq('type', type);
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

        const { data: audiences, error: audError } = await query;
        if (audError) throw audError;
        if (!audiences || audiences.length === 0) {
            return { data: [] };
        }

        const audienceIds = audiences.map((a) => a.id);

        const { data: metrics, error: metricsError } = await supabase
            .from('audience_metrics')
            .select('audience_id, spend, impressions, clicks, conversions, revenue')
            .in('audience_id', audienceIds)
            .gte('date', from)
            .lte('date', to)
            .limit(10_000);

        if (metricsError) throw metricsError;

        const aggMap = new Map<string, { spend: number; impressions: number; clicks: number; conversions: number; revenue: number }>();
        for (const m of metrics ?? []) {
            const id = m.audience_id;
            if (!aggMap.has(id)) {
                aggMap.set(id, { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 });
            }
            const state = aggMap.get(id)!;
            state.spend += Number(m.spend);
            state.impressions += Number(m.impressions);
            state.clicks += Number(m.clicks);
            state.conversions += Number(m.conversions);
            state.revenue += Number(m.revenue);
        }

        const rows: AudienceRow[] = audiences.map((aud) => {
            const m = aggMap.get(aud.id) ?? { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 };
            const ctr = m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0;
            const cvr = m.clicks > 0 ? (m.conversions / m.clicks) * 100 : 0;

            return {
                id: aud.id,
                name: aud.name,
                type: aud.type as AudienceType,
                platform: aud.platform,
                size: Number(aud.size),
                sizeLabel: formatSize(Number(aud.size)),
                impressions: m.impressions,
                clicks: m.clicks,
                conversions: m.conversions,
                spend: m.spend,
                revenue: m.revenue,
                ctr,
                cvr,
            };
        });

        return { data: rows };
    } catch (err) {
        console.error('getAudiences error:', err);
        return { data: [], error: err instanceof Error ? err.message : String(err) };
    }
}
