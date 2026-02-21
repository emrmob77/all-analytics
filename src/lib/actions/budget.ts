'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserOrganization } from '@/lib/actions/organization';
import type { AdPlatform } from '@/types';

export interface BudgetCampaignRow {
  id: string;
  name: string;
  platform: AdPlatform;
  status: string;
  budgetLimit: number;
  budgetUsed: number;
  currency: string;
  utilization: number; // budgetUsed / budgetLimit * 100
}

export interface PlatformBudgetSummary {
  platform: AdPlatform;
  totalBudget: number;
  totalSpend: number;
  utilization: number;
  campaignCount: number;
}

export interface BudgetData {
  campaigns: BudgetCampaignRow[];
  platformSummaries: PlatformBudgetSummary[];
  totalBudget: number;
  totalSpend: number;
  currency: string;
}

export async function getBudgetData(): Promise<{ data: BudgetData | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const org = await getUserOrganization();
    if (!org) return { data: null, error: 'No organization found' };

    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('id, name, platform, status, budget_limit, budget_used, currency')
      .eq('organization_id', org.organization.id)
      .order('budget_limit', { ascending: false });

    if (error) return { data: null, error: error.message };

    const rows: BudgetCampaignRow[] = (campaigns ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      platform: c.platform as AdPlatform,
      status: c.status,
      budgetLimit: Number(c.budget_limit ?? 0),
      budgetUsed: Number(c.budget_used ?? 0),
      currency: c.currency ?? 'USD',
      utilization: c.budget_limit > 0 ? Math.min((Number(c.budget_used) / Number(c.budget_limit)) * 100, 100) : 0,
    }));

    // Aggregate by platform
    const platformMap = new Map<AdPlatform, PlatformBudgetSummary>();
    for (const r of rows) {
      const existing = platformMap.get(r.platform);
      if (existing) {
        existing.totalBudget += r.budgetLimit;
        existing.totalSpend += r.budgetUsed;
        existing.campaignCount += 1;
        existing.utilization = existing.totalBudget > 0
          ? (existing.totalSpend / existing.totalBudget) * 100
          : 0;
      } else {
        platformMap.set(r.platform, {
          platform: r.platform,
          totalBudget: r.budgetLimit,
          totalSpend: r.budgetUsed,
          utilization: r.budgetLimit > 0 ? (r.budgetUsed / r.budgetLimit) * 100 : 0,
          campaignCount: 1,
        });
      }
    }

    const totalBudget = rows.reduce((s, r) => s + r.budgetLimit, 0);
    const totalSpend = rows.reduce((s, r) => s + r.budgetUsed, 0);

    return {
      data: {
        campaigns: rows,
        platformSummaries: Array.from(platformMap.values()),
        totalBudget,
        totalSpend,
        currency: rows[0]?.currency ?? 'USD',
      },
      error: null,
    };
  } catch (e) {
    return { data: null, error: String(e) };
  }
}
