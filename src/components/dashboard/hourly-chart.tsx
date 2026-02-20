'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartContainer } from '@/components/ui/chart-container';
import { DEMO_HOURLY_DATA } from '@/types';

interface HourlyChartProps {
  loading?: boolean;
}

export function HourlyChart({ loading = false }: HourlyChartProps) {
  return (
    <ChartContainer
      title="CTR by Hour"
      subtitle="Average across all platforms"
      loading={loading}
      className="flex-[1_1_240px]"
    >
      <BarChart data={DEMO_HOURLY_DATA} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F4" vertical={false} />
        <XAxis
          dataKey="h"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 9, fill: '#9AA0A6' }}
          interval={3}
        />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9AA0A6' }} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #E3E8EF', fontSize: 11.5 }}
        />
        <Bar dataKey="ctr" name="CTR %" fill="#1A73E8" radius={[3, 3, 0, 0]} animationDuration={700} />
      </BarChart>
    </ChartContainer>
  );
}
