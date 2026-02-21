'use client';

import { ChartContainer } from '@/components/ui/chart-container';
import { PLATFORMS } from '@/types';
import type { AdPlatform } from '@/types';
import type { DateRange } from '@/components/ui/date-range-picker';
import type { DashboardChartPoint } from '@/lib/actions/dashboard';

interface PerformanceChartProps {
  activePlatform: AdPlatform | 'all';
  dateRange: DateRange;
  data?: DashboardChartPoint[];
  loading?: boolean;
}

const PLATFORM_COLORS: Record<string, string> = {
  google:    '#1A73E8',
  meta:      '#0866FF',
  tiktok:    '#161823',
  pinterest: '#E60023',
};

export function PerformanceChart({ activePlatform, dateRange, data = [], loading = false }: PerformanceChartProps) {
  const yKeys = activePlatform === 'all'
    ? ['google', 'meta', 'tiktok', 'pinterest']
    : [activePlatform];
  const colors = yKeys.map(k => PLATFORM_COLORS[k] ?? '#1A73E8');

  const fromLabel = dateRange.from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const toLabel   = dateRange.to.toLocaleDateString('en-US',   { month: 'short', day: 'numeric' });

  const activePlatformConfig = PLATFORMS.find(p => p.id === activePlatform);

  return (
    <div className="flex-[2_1_380px] min-w-0 rounded-[10px] border border-[#E3E8EF] bg-white px-5 py-[18px]">
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-[#202124]">Performance Trend</div>
          <div className="mt-0.5 text-[11.5px] text-[#9AA0A6]">
            {activePlatform !== 'all' ? `${activePlatformConfig?.label} · ` : ''}
            Impressions · {fromLabel} – {toLabel}
          </div>
        </div>
      </div>

      <ChartContainer
        type="area"
        data={data}
        xKey="day"
        yKeys={yKeys}
        colors={colors}
        showLegend={activePlatform === 'all'}
        loading={loading}
        height={215}
      />
    </div>
  );
}
