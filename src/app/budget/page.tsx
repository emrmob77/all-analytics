'use client';

import { useQuery } from '@tanstack/react-query';
import { getBudgetData } from '@/lib/actions/budget';
import { PlatformIcon } from '@/components/ui/platform-icons';
import { formatCurrency } from '@/lib/format';

const PLATFORM_LABELS: Record<string, string> = {
  google: 'Google Ads',
  meta: 'Meta Ads',
  tiktok: 'TikTok Ads',
  pinterest: 'Pinterest Ads',
};

const STATUS_COLORS: Record<string, string> = {
  active:   'bg-[#E6F4EA] text-[#137333]',
  paused:   'bg-[#FEF3CD] text-[#92640D]',
  stopped:  'bg-[#FCE8E6] text-[#C5221F]',
  archived: 'bg-[#F1F3F4] text-[#5F6368]',
};

function UtilBar({ pct }: { pct: number }) {
  const color =
    pct >= 90 ? '#C5221F' : pct >= 70 ? '#E37400' : '#1A73E8';
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 rounded-full bg-[#E3E8EF] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(pct, 100)}%`, background: color }}
        />
      </div>
      <span
        className="text-[11px] font-semibold tabular-nums w-8 text-right"
        style={{ color }}
      >
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#E3E8EF] bg-white px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9AA0A6] mb-1">
        {label}
      </p>
      <p
        className={`text-[24px] font-bold leading-none ${
          accent ? 'text-[#137333]' : 'text-[#202124]'
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-[11px] text-[#9AA0A6]">{sub}</p>}
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
  const totalSpend  = budget?.totalSpend  ?? 0;
  const remaining   = Math.max(totalBudget - totalSpend, 0);
  const avgUtil     = totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0;
  const currency    = budget?.currency ?? 'USD';

  return (
    <div className="w-full px-6 py-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#202124] tracking-tight">Budget</h1>
        <p className="text-sm text-[#5F6368] mt-0.5">
          Track ad spend, campaign budgets and utilisation across all platforms
        </p>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Budget"
          value={isLoading ? '—' : formatCurrency(totalBudget, currency)}
          sub="across all campaigns"
        />
        <StatCard
          label="Total Spend"
          value={isLoading ? '—' : formatCurrency(totalSpend, currency)}
          sub={`${avgUtil.toFixed(0)}% utilised`}
        />
        <StatCard
          label="Remaining"
          value={isLoading ? '—' : formatCurrency(remaining, currency)}
          sub="budget left"
          accent={remaining > 0}
        />
        <StatCard
          label="Campaigns"
          value={isLoading ? '—' : String(budget?.campaigns.length ?? 0)}
          sub={`${budget?.platformSummaries.length ?? 0} platform${(budget?.platformSummaries.length ?? 0) !== 1 ? 's' : ''}`}
        />
      </div>

      {/* Platform breakdown */}
      {(budget?.platformSummaries.length ?? 0) > 0 && (
        <div className="mb-6">
          <h2 className="text-[12px] font-semibold uppercase tracking-wide text-[#9AA0A6] mb-3">
            Platform Breakdown
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {budget!.platformSummaries.map((p) => {
              const utilColor =
                p.utilization >= 90
                  ? '#C5221F'
                  : p.utilization >= 70
                  ? '#E37400'
                  : '#137333';
              return (
                <div
                  key={p.platform}
                  className="rounded-xl border border-[#E3E8EF] bg-white px-5 py-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <PlatformIcon platform={p.platform} size={15} />
                      <span className="text-[13px] font-semibold text-[#202124]">
                        {PLATFORM_LABELS[p.platform] ?? p.platform}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#9AA0A6]">
                      {p.campaignCount} campaign{p.campaignCount !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-2">
                    <div>
                      <p className="text-[10px] text-[#9AA0A6] uppercase tracking-wide mb-0.5">Spent</p>
                      <p className="text-[15px] font-bold text-[#202124] tabular-nums">
                        {formatCurrency(p.totalSpend, 'USD')}
                      </p>
                    </div>
                    <div className="text-[#E3E8EF]">/</div>
                    <div>
                      <p className="text-[10px] text-[#9AA0A6] uppercase tracking-wide mb-0.5">Budget</p>
                      <p className="text-[15px] font-bold text-[#5F6368] tabular-nums">
                        {formatCurrency(p.totalBudget, 'USD')}
                      </p>
                    </div>
                    <div
                      className="ml-auto text-[20px] font-bold tabular-nums"
                      style={{ color: utilColor }}
                    >
                      {p.utilization.toFixed(0)}%
                    </div>
                  </div>

                  <div className="h-2 rounded-full bg-[#E3E8EF] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(p.utilization, 100)}%`,
                        background: utilColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Campaign spend table */}
      <div>
        <h2 className="text-[12px] font-semibold uppercase tracking-wide text-[#9AA0A6] mb-3">
          Campaign Spend
        </h2>
        <div className="rounded-xl border border-[#E3E8EF] bg-white overflow-hidden">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-[#9AA0A6]">Loading…</div>
          ) : (budget?.campaigns.length ?? 0) === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[13px] font-medium text-[#5F6368] mb-1">No campaigns found</p>
              <p className="text-[12px] text-[#9AA0A6]">
                Connect an ad account to start tracking your budgets.
              </p>
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
                  <th className="px-4 py-2.5 text-right font-semibold text-[#5F6368]">Remaining</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-[#5F6368] w-36">
                    Utilisation
                  </th>
                </tr>
              </thead>
              <tbody>
                {budget!.campaigns.map((c, i) => {
                  const rem = Math.max(c.budgetLimit - c.budgetUsed, 0);
                  return (
                    <tr
                      key={c.id}
                      className={`border-b border-[#F1F3F4] last:border-0 transition-colors hover:bg-[#F8F9FA] ${
                        i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-[#202124] max-w-[200px] truncate">
                        {c.name}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <PlatformIcon platform={c.platform} size={12} />
                          <span className="text-[#5F6368]">
                            {PLATFORM_LABELS[c.platform]?.split(' ')[0] ?? c.platform}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded px-1.5 py-0.5 text-[10.5px] font-semibold capitalize ${
                            STATUS_COLORS[c.status] ?? STATUS_COLORS.archived
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-[#202124] tabular-nums">
                        {formatCurrency(c.budgetLimit, c.currency)}
                      </td>
                      <td className="px-4 py-3 text-right text-[#202124] tabular-nums">
                        {formatCurrency(c.budgetUsed, c.currency)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className={rem === 0 ? 'text-[#C5221F] font-semibold' : 'text-[#137333]'}>
                          {formatCurrency(rem, c.currency)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <UtilBar pct={c.utilization} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Footer totals */}
              {(budget?.campaigns.length ?? 0) > 1 && (
                <tfoot>
                  <tr className="border-t border-[#E3E8EF] bg-[#FAFAFA]">
                    <td colSpan={3} className="px-4 py-2.5 text-[11.5px] font-semibold text-[#5F6368]">
                      Total ({budget!.campaigns.length} campaigns)
                    </td>
                    <td className="px-4 py-2.5 text-right text-[11.5px] font-semibold text-[#202124] tabular-nums">
                      {formatCurrency(totalBudget, currency)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[11.5px] font-semibold text-[#202124] tabular-nums">
                      {formatCurrency(totalSpend, currency)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[11.5px] font-semibold tabular-nums">
                      <span className={remaining === 0 ? 'text-[#C5221F]' : 'text-[#137333]'}>
                        {formatCurrency(remaining, currency)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <UtilBar pct={avgUtil} />
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
