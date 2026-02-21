'use client';

import { ChartContainer } from '@/components/ui/chart-container';
import { DEMO_CHART_DATA, type AdPlatform } from '@/types';
import type { DateRange } from '@/components/ui/date-range-picker';

interface PerformanceChartProps {
  activePlatform: AdPlatform | 'all';
  dateRange: DateRange;
}

const PLATFORM_COLORS: Record<string, string> = {
  google:    '#1A73E8',
  meta:      '#0866FF',
  tiktok:    '#161823',
  pinterest: '#E60023',
};

export function PerformanceChart({ activePlatform, dateRange }: PerformanceChartProps) {
  const days = Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / 86_400_000) + 1;
  const chartData = DEMO_CHART_DATA.slice(0, Math.min(days, 90));

  const yKeys = activePlatform === 'all'
    ? ['google', 'meta', 'tiktok', 'pinterest']
    : [activePlatform];

  const colors = yKeys.map(k => PLATFORM_COLORS[k] ?? '#1A73E8');

  const fromLabel = dateRange.from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const toLabel   = dateRange.to.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="flex-[2_1_380px] min-w-0 rounded-[10px] border border-[#E3E8EF] bg-white px-5 py-[18px]">
      {/* Header */}
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-[#202124]">Performance Trend</div>
          <div className="mt-0.5 text-[11.5px] text-[#9AA0A6]">
            Impressions · {fromLabel} – {toLabel}
          </div>
        </div>
        <button className="flex items-center gap-1.5 rounded-md border border-[#E3E8EF] bg-white px-[11px] py-[5px] text-[11.5px] text-[#5F6368] transition-colors hover:bg-gray-50">
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 4h8M4 8h4M6 12h0" />
          </svg>
          Filter
        </button>
      </div>

      <ChartContainer
        type="area"
        data={chartData}
        xKey="day"
        yKeys={yKeys}
        colors={colors}
        showLegend={activePlatform === 'all'}
        height={215}
      />
    </div>
  );
}
