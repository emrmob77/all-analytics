'use client';

import { ChartContainer } from '@/components/ui/chart-container';
import { DEMO_HOURLY_DATA } from '@/types';

export function HourlyChart() {
  return (
    <div className="flex-[1_1_240px] min-w-0 rounded-[10px] border border-[#E3E8EF] bg-white px-5 py-[18px]">
      <div className="mb-0.5 text-sm font-semibold text-[#202124]">CTR by Hour</div>
      <div className="mb-3.5 text-[11.5px] text-[#9AA0A6]">Average across all platforms</div>

      <ChartContainer
        type="bar"
        data={DEMO_HOURLY_DATA}
        xKey="h"
        yKeys={['ctr']}
        colors={['#1A73E8']}
        height={215}
      />
    </div>
  );
}
