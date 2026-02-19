'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DEMO_HOURLY_DATA } from '@/types';

export function HourlyChart() {
  return (
    <div className="flex-[1_1_240px] min-w-0 rounded-[10px] border border-[#E3E8EF] bg-white px-5 py-[18px]">
      {/* Header */}
      <div className="mb-0.5 text-sm font-semibold text-[#202124]">CTR by Hour</div>
      <div className="mb-3.5 text-[11.5px] text-[#9AA0A6]">Average across all platforms</div>

      {/* Chart */}
      <div className="h-[215px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={DEMO_HOURLY_DATA} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F4" vertical={false} />
            <XAxis
              dataKey="h"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: '#9AA0A6' }}
              interval={3}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: '#9AA0A6' }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #E3E8EF',
                fontSize: 11.5,
              }}
            />
            <Bar
              dataKey="ctr"
              name="CTR %"
              fill="#1A73E8"
              radius={[3, 3, 0, 0]}
              animationDuration={700}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
