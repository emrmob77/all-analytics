'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DateRangePicker, DateRange } from '@/components/ui/date-range-picker';
import { PlatformFilter } from '@/components/ui/platform-filter';
import {
  getReportData,
  getReportCampaigns,
  type ReportData,
  type ReportCampaignOption,
} from '@/lib/actions/reports';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRoas,
} from '@/lib/format';
import type { AdPlatform } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Uses local year/month/date (not UTC) to avoid off-by-one for users
// east of UTC — toISOString() converts to UTC first so midnight local time
// in UTC+5 would yield the previous day's date string.
function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function defaultRange(): DateRange {
  const to = new Date();
  to.setHours(0, 0, 0, 0);
  const from = new Date(to);
  from.setDate(from.getDate() - 29);
  return { from, to };
}

const PLATFORM_LABELS: Record<AdPlatform, string> = {
  google: 'Google Ads',
  meta: 'Meta Ads',
  tiktok: 'TikTok Ads',
  pinterest: 'Pinterest',
};

const PLATFORM_COLORS: Record<AdPlatform, string> = {
  google: '#1A73E8',
  meta: '#0866FF',
  tiktok: '#161823',
  pinterest: '#E60023',
};

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-[#E3E8EF] bg-white p-4">
      <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[#9AA0A6]">
        {label}
      </div>
      <div className="text-[22px] font-bold text-[#202124]">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-[#9AA0A6]">{sub}</div>}
    </div>
  );
}

function PlatformBar({ share, platform }: { share: number; platform: AdPlatform }) {
  const color = PLATFORM_COLORS[platform];
  return (
    <div className="h-1.5 w-full rounded-full bg-[#F1F3F4]">
      <div
        className="h-1.5 rounded-full transition-all duration-500"
        style={{ width: `${Math.min(share, 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}

// Campaign checkbox list
function CampaignSelector({
  campaigns,
  selected,
  onToggle,
  onSelectAll,
}: {
  campaigns: ReportCampaignOption[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
}) {
  const allSelected = selected.size === 0; // empty = all

  return (
    <div className="rounded-xl border border-[#E3E8EF] bg-white">
      <div className="flex items-center justify-between border-b border-[#F1F3F4] px-4 py-3">
        <span className="text-[12px] font-semibold text-[#202124]">
          Campaigns
          {selected.size > 0 && (
            <span className="ml-1.5 rounded-full bg-[#E8F0FE] px-2 py-0.5 text-[10px] font-bold text-[#1A73E8]">
              {selected.size} selected
            </span>
          )}
        </span>
        <button
          onClick={onSelectAll}
          className="text-[11px] font-medium text-[#1A73E8] hover:underline"
        >
          {allSelected ? 'All included' : 'Select all'}
        </button>
      </div>
      <div className="max-h-[220px] overflow-y-auto p-2">
        {campaigns.length === 0 ? (
          <div className="py-4 text-center text-[12px] text-[#9AA0A6]">No campaigns found</div>
        ) : (
          campaigns.map((c) => {
            const isSelected = selected.size === 0 || selected.has(c.id);
            return (
              <label
                key={c.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-[#F8F9FA]"
              >
                <input
                  type="checkbox"
                  checked={selected.size === 0 || selected.has(c.id)}
                  onChange={() => onToggle(c.id)}
                  className="h-3.5 w-3.5 rounded border-[#D0D3D6] accent-[#1A73E8]"
                />
                <div
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: PLATFORM_COLORS[c.platform] }}
                />
                <span
                  className={cn(
                    'flex-1 truncate text-[12px]',
                    isSelected ? 'text-[#202124]' : 'text-[#9AA0A6]',
                  )}
                >
                  {c.name}
                </span>
                <span className="text-[10px] capitalize text-[#9AA0A6]">{c.platform}</span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}

// Export format button
function ExportButton({
  label,
  icon,
  loading,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 rounded-lg border border-[#E3E8EF] bg-white px-4 py-2.5 text-[12px] font-medium text-[#5F6368] transition-colors hover:border-[#1A73E8] hover:text-[#1A73E8] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {icon}
      {loading ? 'Generating…' : label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange>(defaultRange);
  const [platform, setPlatform] = useState<AdPlatform | 'all'>('all');
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState<'csv' | 'excel' | 'pdf' | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const from = toDateString(dateRange.from);
  const to   = toDateString(dateRange.to);

  // Campaign options (for selector)
  const { data: campaignOptions = [] } = useQuery<ReportCampaignOption[]>({
    queryKey: ['report-campaigns', platform],
    queryFn: () =>
      getReportCampaigns(platform).then((res) => {
        if (res.error) throw new Error(res.error);
        return res.data;
      }),
    staleTime: 60_000,
  });

  // Reset campaign selection when platform changes
  useEffect(() => {
    setSelectedCampaigns(new Set());
  }, [platform]);

  // Report data (only fetched when user clicks "Generate")
  const [reportParams, setReportParams] = useState<{
    from: string;
    to: string;
    platform: AdPlatform | 'all';
    campaignIds: string[];
  } | null>(null);

  const {
    data: reportData,
    isFetching: reportLoading,
    error: reportError,
  } = useQuery<ReportData | null>({
    queryKey: ['report-data', reportParams],
    queryFn: () => {
      if (!reportParams) return Promise.resolve(null);
      return getReportData(reportParams).then((res) => {
        if (res.error) throw new Error(res.error);
        return res.data;
      });
    },
    enabled: !!reportParams,
    staleTime: 30_000,
  });

  const handleGenerate = useCallback(() => {
    setReportParams({
      from,
      to,
      platform,
      campaignIds: selectedCampaigns.size > 0 ? Array.from(selectedCampaigns) : [],
    });
    setHasGenerated(true);
  }, [from, to, platform, selectedCampaigns]);

  const handleToggleCampaign = useCallback((id: string) => {
    setSelectedCampaigns((prev) => {
      const next = new Set(prev);
      if (prev.size === 0) {
        // None selected = all included; clicking one = exclude all others
        campaignOptions.forEach((c) => {
          if (c.id !== id) next.add(c.id);
        });
      } else if (next.has(id)) {
        next.delete(id);
        if (next.size === campaignOptions.length) {
          // All individually selected = same as "all" — normalize
          return new Set();
        }
      } else {
        next.add(id);
        if (next.size === campaignOptions.length) return new Set();
      }
      return next;
    });
  }, [campaignOptions]);

  const handleSelectAll = useCallback(() => {
    setSelectedCampaigns(new Set());
  }, []);

  const handleExport = useCallback(async (format: 'csv' | 'excel' | 'pdf') => {
    setExporting(format);
    try {
      const res = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to,
          format,
          platform,
          campaignIds: selectedCampaigns.size > 0 ? Array.from(selectedCampaigns) : [],
        }),
        signal: AbortSignal.timeout(31_000),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Export failed' }));
        throw new Error(err.error ?? 'Export failed');
      }

      if (format === 'pdf') {
        // Open HTML in new tab for print-to-PDF
        const html = await res.text();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } else {
        const blob = await res.blob();
        const ext = format === 'excel' ? 'xls' : 'csv';
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `adspulse-report-${from}_${to}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(null);
    }
  }, [from, to, platform, selectedCampaigns]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E3E8EF] bg-white px-6 py-4">
        <div>
          <h1 className="text-[17px] font-bold text-[#202124]">Reports</h1>
          <p className="mt-0.5 text-[12px] text-[#9AA0A6]">
            Build and export performance reports across all platforms
          </p>
        </div>

        {/* Export buttons — shown only after a report is generated */}
        {hasGenerated && reportData && (
          <div className="flex items-center gap-2">
            <ExportButton
              label="Export CSV"
              loading={exporting === 'csv'}
              onClick={() => handleExport('csv')}
              icon={
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 10h9M6.5 2v8M4 8l2.5 2.5L9 8" />
                </svg>
              }
            />
            <ExportButton
              label="Export Excel"
              loading={exporting === 'excel'}
              onClick={() => handleExport('excel')}
              icon={
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="9" height="10" rx="1" />
                  <path d="M4 5h5M4 7.5h5M4 10h3" />
                </svg>
              }
            />
            <ExportButton
              label="Export PDF"
              loading={exporting === 'pdf'}
              onClick={() => handleExport('pdf')}
              icon={
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="1" width="9" height="11" rx="1" />
                  <path d="M4 4h5M4 6.5h5M4 9h3" />
                </svg>
              }
            />
          </div>
        )}
      </div>

      <div className="flex flex-1 gap-0 overflow-hidden">
        {/* ── Left panel: Report builder ── */}
        <aside className="flex w-[280px] flex-shrink-0 flex-col gap-4 overflow-y-auto border-r border-[#E3E8EF] bg-[#FAFAFA] p-4">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[#9AA0A6]">
            Report Builder
          </div>

          {/* Date range */}
          <div>
            <label className="mb-1.5 block text-[11.5px] font-medium text-[#5F6368]">
              Date Range
            </label>
            <DateRangePicker value={dateRange} onChange={setDateRange} maxDays={365} />
          </div>

          {/* Platform filter */}
          <div>
            <label className="mb-1.5 block text-[11.5px] font-medium text-[#5F6368]">
              Platform
            </label>
            <PlatformFilter selected={platform} onChange={setPlatform} />
          </div>

          {/* Campaign selector */}
          <div>
            <label className="mb-1.5 block text-[11.5px] font-medium text-[#5F6368]">
              Campaigns
            </label>
            <CampaignSelector
              campaigns={campaignOptions}
              selected={selectedCampaigns}
              onToggle={handleToggleCampaign}
              onSelectAll={handleSelectAll}
            />
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={reportLoading}
            className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg bg-[#1A73E8] py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {reportLoading ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                  <path d="M7 2a5 5 0 015 5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Generating…
              </>
            ) : (
              'Generate Report'
            )}
          </button>
        </aside>

        {/* ── Right panel: Report preview ── */}
        <main className="flex-1 overflow-y-auto p-6">
          {!hasGenerated && !reportLoading && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F0FE]">
                <svg width="24" height="24" fill="none" stroke="#1A73E8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 17H5a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3" />
                  <path d="M13 21l9-9-3-3-9 9v3h3z" />
                </svg>
              </div>
              <h3 className="text-[14px] font-semibold text-[#202124]">Build your report</h3>
              <p className="mt-1 max-w-[300px] text-[12px] text-[#9AA0A6]">
                Select a date range, platform, and campaigns, then click Generate Report to preview and export your data.
              </p>
            </div>
          )}

          {reportLoading && (
            <div className="flex h-full items-center justify-center">
              <div className="flex items-center gap-3 text-[13px] text-[#9AA0A6]">
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="7" stroke="#E3E8EF" strokeWidth="2.5" />
                  <path d="M9 2a7 7 0 017 7" stroke="#1A73E8" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                Generating report…
              </div>
            </div>
          )}

          {reportError && (
            <div className="rounded-xl border border-[#FDDCDA] bg-[#FEF0EF] p-4 text-[12px] text-[#C5221F]">
              {reportError instanceof Error ? reportError.message : 'Failed to load report'}
            </div>
          )}

          {!reportLoading && reportData && (
            <ReportPreview data={reportData} />
          )}
        </main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ReportPreview
// ---------------------------------------------------------------------------

function ReportPreview({ data }: { data: ReportData }) {
  const { metrics, byPlatform, campaigns, generatedAt } = data;

  const activePlatforms = byPlatform.filter(p => p.spend > 0);

  return (
    <div className="space-y-6">
      {/* Generation timestamp */}
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-[#202124]">Report Preview</h2>
        <div className="text-[11px] text-[#9AA0A6]">
          Generated {new Date(generatedAt).toLocaleString()}
        </div>
      </div>

      {/* Summary metric cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <MetricCard label="Total Spend" value={formatCurrency(metrics.totalSpend)} />
        <MetricCard label="Impressions" value={formatNumber(metrics.totalImpressions)} />
        <MetricCard label="Clicks" value={formatNumber(metrics.totalClicks)} />
        <MetricCard label="Conversions" value={metrics.totalConversions.toFixed(0)} />
        <MetricCard label="Revenue" value={formatCurrency(metrics.totalRevenue)} />
        <MetricCard label="Avg CTR" value={formatPercent(metrics.avgCtr)} />
        <MetricCard label="Avg ROAS" value={formatRoas(metrics.avgRoas)} />
        <MetricCard
          label="Campaigns"
          value={String(campaigns.length)}
          sub="in this report"
        />
      </div>

      {/* Platform breakdown */}
      <div className="rounded-xl border border-[#E3E8EF] bg-white">
        <div className="border-b border-[#F1F3F4] px-5 py-3.5">
          <h3 className="text-[13px] font-semibold text-[#202124]">Platform Breakdown</h3>
        </div>
        {activePlatforms.length === 0 ? (
          <div className="py-8 text-center text-[12px] text-[#9AA0A6]">No data for selected filters</div>
        ) : (
          <div className="divide-y divide-[#F1F3F4]">
            {byPlatform.map((p) => (
              <div
                key={p.platform}
                className={cn(
                  'grid grid-cols-[140px_1fr_80px_80px_80px_80px_70px_70px] items-center gap-4 px-5 py-3',
                  p.spend === 0 && 'opacity-40',
                )}
              >
                {/* Platform name + bar */}
                <div>
                  <div className="mb-1 flex items-center gap-1.5">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: PLATFORM_COLORS[p.platform] }}
                    />
                    <span className="text-[12px] font-medium text-[#202124]">
                      {PLATFORM_LABELS[p.platform]}
                    </span>
                  </div>
                  <PlatformBar share={p.budgetShare} platform={p.platform} />
                  <div className="mt-0.5 text-[10px] text-[#9AA0A6]">{p.budgetShare.toFixed(1)}% of spend</div>
                </div>

                <div className="text-center">
                  <div className="text-[12px] font-semibold text-[#202124]">{formatCurrency(p.spend)}</div>
                  <div className="text-[10px] text-[#9AA0A6]">spend</div>
                </div>
                <div className="text-center">
                  <div className="text-[12px] font-semibold text-[#202124]">{formatNumber(p.impressions)}</div>
                  <div className="text-[10px] text-[#9AA0A6]">impr.</div>
                </div>
                <div className="text-center">
                  <div className="text-[12px] font-semibold text-[#202124]">{formatNumber(p.clicks)}</div>
                  <div className="text-[10px] text-[#9AA0A6]">clicks</div>
                </div>
                <div className="text-center">
                  <div className="text-[12px] font-semibold text-[#202124]">{p.conversions.toFixed(0)}</div>
                  <div className="text-[10px] text-[#9AA0A6]">conv.</div>
                </div>
                <div className="text-center">
                  <div className="text-[12px] font-semibold text-[#202124]">{formatCurrency(p.revenue)}</div>
                  <div className="text-[10px] text-[#9AA0A6]">revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-[12px] font-semibold text-[#202124]">{formatPercent(p.ctr)}</div>
                  <div className="text-[10px] text-[#9AA0A6]">CTR</div>
                </div>
                <div className="text-center">
                  <div className="text-[12px] font-semibold text-[#202124]">{formatRoas(p.roas)}</div>
                  <div className="text-[10px] text-[#9AA0A6]">ROAS</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Campaign table */}
      <div className="rounded-xl border border-[#E3E8EF] bg-white">
        <div className="border-b border-[#F1F3F4] px-5 py-3.5">
          <h3 className="text-[13px] font-semibold text-[#202124]">
            Campaigns
            <span className="ml-1.5 text-[11px] font-normal text-[#9AA0A6]">
              ({campaigns.length})
            </span>
          </h3>
        </div>

        {campaigns.length === 0 ? (
          <div className="py-8 text-center text-[12px] text-[#9AA0A6]">No campaign data for selected filters</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[#F1F3F4] bg-[#FAFAFA]">
                  {['Campaign', 'Platform', 'Status', 'Spend', 'Impressions', 'Clicks', 'Conversions', 'Revenue', 'CTR', 'ROAS'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-[#9AA0A6]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c, i) => (
                  <tr
                    key={c.id}
                    className={cn(
                      'border-b border-[#F1F3F4] last:border-0',
                      i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]',
                    )}
                  >
                    <td className="max-w-[180px] truncate px-4 py-2.5 font-medium text-[#202124]">
                      {c.name}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: PLATFORM_COLORS[c.platform] }}
                        />
                        <span className="capitalize text-[#5F6368]">{c.platform}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-medium capitalize',
                          c.status === 'active'
                            ? 'bg-[#E6F4EA] text-[#137333]'
                            : c.status === 'paused'
                            ? 'bg-[#FEF7E0] text-[#B06000]'
                            : 'bg-[#F1F3F4] text-[#5F6368]',
                        )}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[#202124]">{formatCurrency(c.spend)}</td>
                    <td className="px-4 py-2.5 text-[#5F6368]">{formatNumber(c.impressions)}</td>
                    <td className="px-4 py-2.5 text-[#5F6368]">{formatNumber(c.clicks)}</td>
                    <td className="px-4 py-2.5 text-[#5F6368]">{c.conversions.toFixed(0)}</td>
                    <td className="px-4 py-2.5 text-[#5F6368]">{formatCurrency(c.revenue)}</td>
                    <td className="px-4 py-2.5 text-[#5F6368]">{formatPercent(c.ctr)}</td>
                    <td className="px-4 py-2.5 text-[#5F6368]">{formatRoas(c.roas)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
