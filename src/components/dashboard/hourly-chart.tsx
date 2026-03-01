'use client';

import { ChartContainer } from '@/components/ui/chart-container';
import type { DashboardHourlyPoint } from '@/lib/actions/dashboard';

interface HourlyChartProps {
  data?: DashboardHourlyPoint[];
  loading?: boolean;
}

export function HourlyChart({ data = [], loading = false }: HourlyChartProps) {
  return (
    <div className="min-w-0 w-full rounded-[10px] border border-[#E3E8EF] bg-white px-5 py-[18px] overflow-hidden">
      <div className="mb-0.5 text-sm font-semibold text-[#202124]">CTR by Hour</div>
      <div className="mb-3.5 text-[11.5px] text-[#9AA0A6]">Average across all platforms</div>

      <ChartContainer
        type="bar"
        data={data}
        xKey="h"
        yKeys={['ctr']}
        colors={['#1A73E8']}
        loading={loading}
        height={215}
      />
    </div>
  );
}
