'use client';

import { ChartContainer } from '@/components/ui/chart-container';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PLATFORMS } from '@/types';
import type { AdPlatform } from '@/types';
import type { DateRange } from '@/components/ui/date-range-picker';
import type {
  DashboardChartGranularity,
  DashboardChartMetric,
  DashboardChartPoint,
} from '@/lib/actions/dashboard';

interface PerformanceChartProps {
  activePlatform: AdPlatform | 'all';
  dateRange: DateRange;
  data?: DashboardChartPoint[];
  loading?: boolean;
  chartMetric?: DashboardChartMetric;
  chartGranularity?: DashboardChartGranularity;
  onChartMetricChange?: (metric: DashboardChartMetric) => void;
  onChartGranularityChange?: (granularity: DashboardChartGranularity) => void;
}

const PLATFORM_COLORS: Record<string, string> = {
  google:    '#1A73E8',
  meta:      '#0866FF',
  tiktok:    '#161823',
  pinterest: '#E60023',
};
const PLATFORM_LABELS: Record<string, string> = {
  google: 'Google',
  meta: 'Meta',
  tiktok: 'TikTok',
  pinterest: 'Pinterest',
};

const METRIC_OPTIONS: Array<{ value: DashboardChartMetric; label: string }> = [
  { value: 'impressions', label: 'Impressions' },
  { value: 'clicks', label: 'Clicks' },
  { value: 'spend', label: 'Spend' },
  { value: 'conversions', label: 'Conversions' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'ctr', label: 'CTR' },
  { value: 'cpc', label: 'CPC' },
  { value: 'cpm', label: 'CPM' },
  { value: 'cvr', label: 'CVR' },
  { value: 'roas', label: 'ROAS' },
];

const METRIC_LABELS: Record<DashboardChartMetric, string> = Object.fromEntries(
  METRIC_OPTIONS.map((option) => [option.value, option.label]),
) as Record<DashboardChartMetric, string>;

export function PerformanceChart({
  activePlatform,
  dateRange,
  data = [],
  loading = false,
  chartMetric = 'impressions',
  chartGranularity = 'daily',
  onChartMetricChange,
  onChartGranularityChange,
}: PerformanceChartProps) {
  const yKeys = activePlatform === 'all'
    ? ['google', 'meta', 'tiktok', 'pinterest']
    : [activePlatform];
  const colors = yKeys.map(k => PLATFORM_COLORS[k] ?? '#1A73E8');

  const fromLabel = dateRange.from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const toLabel   = dateRange.to.toLocaleDateString('en-US',   { month: 'short', day: 'numeric' });

  const activePlatformConfig = PLATFORMS.find(p => p.id === activePlatform);

  return (
    <div className="min-w-0 w-full rounded-[10px] border border-[#E3E8EF] bg-white px-5 py-[18px] overflow-hidden">
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-[#202124]">Performance Trend</div>
          <div className="mt-0.5 text-[11.5px] text-[#9AA0A6]">
            {activePlatform !== 'all' ? `${activePlatformConfig?.label} · ` : ''}
            {METRIC_LABELS[chartMetric]} · {chartGranularity === 'monthly' ? 'Monthly' : 'Daily'} · {fromLabel} – {toLabel}
          </div>
        </div>

        {onChartMetricChange && onChartGranularityChange && (
          <div className="flex flex-wrap items-center gap-2">
            <Select value={chartMetric} onValueChange={(value) => onChartMetricChange(value as DashboardChartMetric)}>
              <SelectTrigger size="sm" className="w-[150px] bg-white text-xs">
                <SelectValue placeholder="Metric" />
              </SelectTrigger>
              <SelectContent align="end">
                {METRIC_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex overflow-hidden rounded-lg border border-[#E3E8EF] bg-white">
              {(['daily', 'monthly'] as DashboardChartGranularity[]).map((value, index) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onChartGranularityChange(value)}
                  className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    index > 0 ? 'border-l border-[#E3E8EF]' : ''
                  } ${
                    chartGranularity === value
                      ? 'bg-[#E8F0FE] text-[#1A73E8]'
                      : 'text-[#5F6368] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {value === 'daily' ? 'Daily' : 'Monthly'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <ChartContainer
        type="area"
        data={data}
        xKey="day"
        yKeys={yKeys}
        colors={colors}
        showLegend={false}
        loading={loading}
        height={215}
      />

      {activePlatform === 'all' && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-[#5F6368]">
          {yKeys.map((key) => (
            <span key={key} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: PLATFORM_COLORS[key] ?? '#1A73E8' }}
              />
              {PLATFORM_LABELS[key] ?? key}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
