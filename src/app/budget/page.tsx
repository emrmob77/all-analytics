'use client';

import { useQuery } from '@tanstack/react-query';
import { getBudgetData } from '@/lib/actions/budget';
import { PlatformIcon } from '@/components/ui/platform-icons';
import { formatCurrency } from '@/lib/format';

const STATUS_COLORS: Record<string, string> = {
  active:   'bg-[#E6F4EA] text-[#137333]',
  paused:   'bg-[#FEF3CD] text-[#92640D]',
  stopped:  'bg-[#FCE8E6] text-[#C5221F]',
  archived: 'bg-[#F1F3F4] text-[#5F6368]',
};

const PLATFORM_LABELS: Record<string, string> = {
  google: 'Google', meta: 'Meta', tiktok: 'TikTok', pinterest: 'Pinterest',
};

function UtilizationBar({ pct }: { pct: number }) {
  const color = pct >= 90 ? '#C5221F' : pct >= 70 ? '#E37400' : '#137333';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[#E3E8EF] overflow-hidden">
        <div style={{ width: `${Math.min(pct, 100)}%`, background: color }} className="h-full rounded-full transition-all" />
      </div>
      <span className="text-[11px] font-medium tabular-nums" style={{ color }}>{pct.toFixed(0)}%</span>
    </div>
  );
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-[#E3E8EF] bg-white px-5 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[#9AA0A6] mb-1">{label}</div>
      <div className="text-2xl font-bold text-[#202124]">{value}</div>
      {sub && <div className="text-[11px] text-[#5F6368] mt-0.5">{sub}</div>}
    </div>
  );
}

export default function BudgetPage() {
  const { data: result, isLoading } = useQuery({
    queryKey: ['budget'],
    queryFn: () => getBudgetData(),
    staleTime: 60_000,
  });

  const budget = result?.data;
  const totalBudget = budget?.totalBudget ?? 0;
  const totalSpend = budget?.totalSpend ?? 0;
  const avgUtil = totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0;
  const currency = budget?.currency ?? 'USD';

  return (
    <div className="flex-1 px-6 py-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#202124] tracking-tight">Budget & Billing</h1>
        <p className="text-sm text-[#5F6368] mt-0.5">Track spend and budget utilisation across all campaigns</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Total Budget" value={formatCurrency(totalBudget, currency)} sub="across all campaigns" />
        <SummaryCard label="Total Spend" value={formatCurrency(totalSpend, currency)} sub={`${avgUtil.toFixed(0)}% of total budget`} />
        <SummaryCard label="Campaigns" value={String(budget?.campaigns.length ?? 0)} sub={`${budget?.platformSummaries.length ?? 0} platforms`} />
      </div>

      {/* Platform summary row */}
      {(budget?.platformSummaries.length ?? 0) > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {budget!.platformSummaries.map((p) => (
            <div key={p.platform} className="rounded-xl border border-[#E3E8EF] bg-white px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <PlatformIcon platform={p.platform} size={14} />
                <span className="text-[12.5px] font-semibold text-[#202124]">{PLATFORM_LABELS[p.platform] ?? p.platform}</span>
                <span className="ml-auto text-[11px] text-[#9AA0A6]">{p.campaignCount} campaign{p.campaignCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center justify-between text-[11.5px] text-[#5F6368] mb-1.5">
                <span>{formatCurrency(p.totalSpend, 'USD')} spent</span>
                <span>{formatCurrency(p.totalBudget, 'USD')} budget</span>
              </div>
              <UtilizationBar pct={p.utilization} />
            </div>
          ))}
        </div>
      )}

      {/* Campaign table */}
      <div className="rounded-xl border border-[#E3E8EF] bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E3E8EF]">
          <span className="text-[13px] font-semibold text-[#202124]">All Campaigns</span>
        </div>
        {isLoading ? (
          <div className="py-12 text-center text-sm text-[#9AA0A6]">Loading&hellip;</div>
        ) : (budget?.campaigns.length ?? 0) === 0 ? (
          <div className="py-12 text-center text-sm text-[#9AA0A6]">
            No campaigns found. Connect an ad account to get started.
          </div>
        ) : (
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-[#E3E8EF] bg-[#FAFAFA]">
                <th className="px-4 py-2.5 text-left font-semibold text-[#5F6368]">Campaign</th>
                <th className="px-4 py-2.5 text-left font-semibold text-[#5F6368]">Platform</th>
                <th className="px-4 py-2.5 text-left font-semibold text-[#5F6368]">Status</th>
                <th className="px-4 py-2.5 text-right font-semibold text-[#5F6368]">Budget</th>
                <th className="px-4 py-2.5 text-right font-semibold text-[#5F6368]">Spent</th>
                <th className="px-4 py-2.5 text-left font-semibold text-[#5F6368] w-36">Utilisation</th>
              </tr>
            </thead>
            <tbody>
              {budget!.campaigns.map((c, i) => (
                <tr key={c.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}>
                  <td className="px-4 py-2.5 font-medium text-[#202124] max-w-[200px] truncate">{c.name}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <PlatformIcon platform={c.platform} size={12} />
                      <span className="text-[#5F6368]">{PLATFORM_LABELS[c.platform] ?? c.platform}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex rounded px-1.5 py-0.5 text-[10.5px] font-semibold capitalize ${STATUS_COLORS[c.status] ?? STATUS_COLORS.archived}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-[#202124] tabular-nums">{formatCurrency(c.budgetLimit, c.currency)}</td>
                  <td className="px-4 py-2.5 text-right text-[#202124] tabular-nums">{formatCurrency(c.budgetUsed, c.currency)}</td>
                  <td className="px-4 py-2.5"><UtilizationBar pct={c.utilization} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
