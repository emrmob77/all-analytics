'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { addDays } from '@/lib/date';
import { formatCurrency, formatNumber, formatInteger, formatPercent } from '@/lib/format';
import { PLATFORMS, STATUS_STYLES } from '@/types';
import { PlatformIcon } from '@/components/ui/platform-icons';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  useCampaignDetail,
  useCampaignDailyMetrics,
  useCampaignHourlyMetrics,
} from '@/hooks/useCampaignDetail';
import type { DateRange } from '@/components/ui/date-range-picker';
import type { DailyMetricRow } from '@/lib/actions/campaign-detail';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function defaultRange(): DateRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return { from: addDays(today, -29), to: today };
}

function toISO(d: Date): string {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-[#F1F3F4] ${className ?? ''}`} />;
}

// ---------------------------------------------------------------------------
// Metric summary card
// ---------------------------------------------------------------------------

interface SummaryCardProps {
  label: string;
  value: string;
  loading: boolean;
}

function SummaryCard({ label, value, loading }: SummaryCardProps) {
  return (
    <div className="rounded-[10px] border border-[#E3E8EF] bg-white px-5 py-4">
      <div className="mb-1 text-[11.5px] font-medium text-[#9AA0A6]">{label}</div>
      {loading ? (
        <Skeleton className="h-6 w-24" />
      ) : (
        <div className="text-[20px] font-bold tracking-tight text-[#202124]">{value}</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Performance trend chart (area)
// ---------------------------------------------------------------------------

interface TrendChartProps {
  title: string;
  data: { date: string; value: number }[];
  color: string;
  formatter: (v: number) => string;
  loading: boolean;
}

function TrendChart({ title, data, color, formatter, loading }: TrendChartProps) {
  return (
    <div className="rounded-[10px] border border-[#E3E8EF] bg-white p-5">
      <div className="mb-4 text-[13px] font-semibold text-[#202124]">{title}</div>
      {loading ? (
        <Skeleton className="h-[140px] w-full" />
      ) : (
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.18} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F4" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={fmtDate}
              tick={{ fontSize: 10, fill: '#9AA0A6' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v) => formatter(v)}
              tick={{ fontSize: 10, fill: '#9AA0A6' }}
              tickLine={false}
              axisLine={false}
              width={52}
            />
            <Tooltip
              formatter={(v: number | undefined) => [formatter(v ?? 0), title]}
              labelFormatter={(label) => fmtDate(String(label))}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E3E8EF' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${title})`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hourly chart (bar)
// ---------------------------------------------------------------------------

interface HourlyChartProps {
  data: { hour: number; clicks: number }[];
  loading: boolean;
}

function HourlyChart({ data, loading }: HourlyChartProps) {
  return (
    <div className="rounded-[10px] border border-[#E3E8EF] bg-white p-5">
      <div className="mb-1 text-[13px] font-semibold text-[#202124]">Hourly Clicks</div>
      <div className="mb-4 text-[11.5px] text-[#9AA0A6]">Last 7 days · aggregated by hour of day</div>
      {loading ? (
        <Skeleton className="h-[160px] w-full" />
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F4" vertical={false} />
            <XAxis
              dataKey="hour"
              tickFormatter={(h) => `${h}h`}
              tick={{ fontSize: 10, fill: '#9AA0A6' }}
              tickLine={false}
              axisLine={false}
              interval={3}
            />
            <YAxis
              tickFormatter={(v) => formatNumber(v)}
              tick={{ fontSize: 10, fill: '#9AA0A6' }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              formatter={(v: number | undefined) => [formatInteger(v ?? 0), 'Clicks']}
              labelFormatter={(h) => `${h}:00`}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E3E8EF' }}
            />
            <Bar dataKey="clicks" fill="#1A73E8" radius={[3, 3, 0, 0]} maxBarSize={14} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Daily metrics table
// ---------------------------------------------------------------------------

interface DailyTableProps {
  rows: DailyMetricRow[];
  loading: boolean;
}

function DailyTable({ rows, loading }: DailyTableProps) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-[#E3E8EF] bg-white">
      <div className="border-b border-[#E3E8EF] px-5 py-3.5">
        <span className="text-[13px] font-semibold text-[#202124]">Daily Breakdown</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="bg-[#F8F9FA]">
              {['Date', 'Spend', 'Impressions', 'Clicks', 'CTR', 'Conversions', 'ROAS'].map((h) => (
                <th
                  key={h}
                  className="border-b border-[#E3E8EF] px-4 py-[9px] text-left text-[11px] font-medium text-[#5F6368]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="border-b border-[#F1F3F4] px-4 py-[10px]">
                      <Skeleton className="h-3 w-16" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#9AA0A6]">
                  No data for this date range.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const roasColor = row.roas >= 5 ? '#137333' : row.roas >= 3 ? '#B06000' : '#C5221F';
                return (
                  <tr key={row.date} className="hover:bg-[#F8FBFF]">
                    <td className="border-b border-[#F1F3F4] px-4 py-[10px] font-medium text-[#202124]">
                      {fmtDate(row.date)}
                    </td>
                    <td className="border-b border-[#F1F3F4] px-4 py-[10px] text-[#5F6368]">
                      {row.spend > 0 ? formatCurrency(row.spend) : '—'}
                    </td>
                    <td className="border-b border-[#F1F3F4] px-4 py-[10px] text-[#5F6368]">
                      {row.impressions > 0 ? formatNumber(row.impressions) : '—'}
                    </td>
                    <td className="border-b border-[#F1F3F4] px-4 py-[10px] text-[#5F6368]">
                      {row.clicks > 0 ? formatInteger(row.clicks) : '—'}
                    </td>
                    <td className="border-b border-[#F1F3F4] px-4 py-[10px] text-[#5F6368]">
                      {row.ctr > 0 ? formatPercent(row.ctr) : '—'}
                    </td>
                    <td className="border-b border-[#F1F3F4] px-4 py-[10px] text-[#202124]">
                      {row.conversions > 0 ? row.conversions : '—'}
                    </td>
                    <td className="border-b border-[#F1F3F4] px-4 py-[10px]">
                      {row.roas > 0 ? (
                        <span className="font-bold" style={{ color: roasColor }}>
                          {row.roas.toFixed(1)}x
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange>(defaultRange);

  const from = toISO(dateRange.from);
  const to   = toISO(dateRange.to);

  const detailQ  = useCampaignDetail(id, from, to);
  const dailyQ   = useCampaignDailyMetrics(id, from, to);
  const hourlyQ  = useCampaignHourlyMetrics(id);

  const campaign = detailQ.data;
  const daily    = dailyQ.data ?? [];
  const hourly   = hourlyQ.data ?? [];

  const platform = PLATFORMS.find((p) => p.id === campaign?.platform);
  const statusStyle = campaign ? (STATUS_STYLES[campaign.status] ?? STATUS_STYLES['archived']) : null;

  // Build chart series from daily data
  const spendSeries       = useMemo(() => daily.map((d) => ({ date: d.date, value: d.spend })),       [daily]);
  const impressionsSeries = useMemo(() => daily.map((d) => ({ date: d.date, value: d.impressions })), [daily]);
  const clicksSeries      = useMemo(() => daily.map((d) => ({ date: d.date, value: d.clicks })),      [daily]);
  const conversionsSeries = useMemo(() => daily.map((d) => ({ date: d.date, value: d.conversions })), [daily]);

  if (detailQ.isError) {
    return (
      <div className="flex-1 overflow-auto bg-[#F8F9FA]">
        <div className="mx-auto max-w-[1280px] px-6 py-16 text-center">
          <p className="text-sm text-[#C5221F]">
            {detailQ.error instanceof Error ? detailQ.error.message : 'Failed to load campaign.'}
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-[13px] text-[#1A73E8] hover:underline"
          >
            ← Back to campaigns
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-[#F8F9FA]">
      <div className="mx-auto max-w-[1280px] px-6 py-6 lg:px-8 space-y-5">

        {/* Back link */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-[12.5px] text-[#5F6368] hover:text-[#202124]"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M9 2L4 7l5 5" />
          </svg>
          Campaigns
        </button>

        {/* Campaign header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            {detailQ.isLoading ? (
              <>
                <Skeleton className="h-6 w-64" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-[5px]" />
                </div>
              </>
            ) : (
              <>
                <h1 className="text-[20px] font-bold text-[#202124]">
                  {campaign?.name ?? '—'}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Platform badge */}
                  {platform && (
                    <span
                      className="inline-flex items-center gap-[5px] rounded-full border px-[10px] py-[3px] text-[11px] font-medium"
                      style={{
                        backgroundColor: platform.bgColor,
                        color: platform.color,
                        borderColor: `${platform.color}30`,
                      }}
                    >
                      <PlatformIcon platform={campaign!.platform} size={11} />
                      {platform.label.split(' ')[0]}
                    </span>
                  )}
                  {/* Status badge */}
                  {statusStyle && (
                    <span
                      className="inline-flex items-center gap-[5px] rounded-[5px] px-[9px] py-[3px] text-[11px] font-medium capitalize"
                      style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                    >
                      <span
                        className="inline-block h-[5px] w-[5px] rounded-full"
                        style={{ backgroundColor: statusStyle.dot }}
                      />
                      {campaign!.status}
                    </span>
                  )}
                  {/* Budget */}
                  {campaign && (
                    <span className="text-[12px] text-[#9AA0A6]">
                      Budget: {campaign.budget > 0 ? formatCurrency(campaign.budget) : '—'}/day
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>

        {/* Summary metric cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <SummaryCard label="Spend"       value={campaign ? formatCurrency(campaign.spend) : '—'}           loading={detailQ.isLoading} />
          <SummaryCard label="Impressions" value={campaign ? formatNumber(campaign.impressions) : '—'}        loading={detailQ.isLoading} />
          <SummaryCard label="Clicks"      value={campaign ? formatInteger(campaign.clicks) : '—'}            loading={detailQ.isLoading} />
          <SummaryCard label="CTR"         value={campaign ? formatPercent(campaign.ctr) : '—'}               loading={detailQ.isLoading} />
          <SummaryCard label="Conversions" value={campaign ? String(campaign.conversions) : '—'}              loading={detailQ.isLoading} />
          <SummaryCard label="ROAS"        value={campaign ? `${campaign.roas.toFixed(1)}x` : '—'}            loading={detailQ.isLoading} />
        </div>

        {/* Performance trend charts */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TrendChart
            title="Spend"
            data={spendSeries}
            color="#1A73E8"
            formatter={(v) => formatCurrency(v)}
            loading={dailyQ.isLoading}
          />
          <TrendChart
            title="Impressions"
            data={impressionsSeries}
            color="#0F9D58"
            formatter={(v) => formatNumber(v)}
            loading={dailyQ.isLoading}
          />
          <TrendChart
            title="Clicks"
            data={clicksSeries}
            color="#F4B400"
            formatter={(v) => formatInteger(v)}
            loading={dailyQ.isLoading}
          />
          <TrendChart
            title="Conversions"
            data={conversionsSeries}
            color="#DB4437"
            formatter={(v) => v.toFixed(1)}
            loading={dailyQ.isLoading}
          />
        </div>

        {/* Hourly chart */}
        <HourlyChart
          data={hourly.map((r) => ({ hour: r.hour, clicks: r.clicks }))}
          loading={hourlyQ.isLoading}
        />

        {/* Daily breakdown table */}
        <DailyTable rows={daily} loading={dailyQ.isLoading} />

      </div>
    </div>
  );
}
