'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { ChartContainer } from '@/components/ui/chart-container';
import { DEMO_CHART_DATA, PLATFORMS, type AdPlatform } from '@/types';

interface PerformanceChartProps {
  activePlatform: AdPlatform | 'all';
  dateRange: string;
  loading?: boolean;
}

const PLATFORM_COLORS: Record<string, string> = {
  google: '#1A73E8',
  meta: '#0866FF',
  tiktok: '#161823',
  pinterest: '#E60023',
};

export function PerformanceChart({ activePlatform, dateRange, loading = false }: PerformanceChartProps) {
  const dataLength = dateRange === '7d' ? 7 : dateRange === '90d' ? 90 : 30;
  const chartData = DEMO_CHART_DATA.slice(0, dataLength);
  const activeColor = PLATFORM_COLORS[activePlatform] || '#1A73E8';
  const activePlatformConfig = PLATFORMS.find(p => p.id === activePlatform);
  const dateRangeLabel = dateRange === '7d' ? 'Last 7 days' : dateRange === '90d' ? 'Last 90 days' : 'Last 30 days';

  const filterBtn = (
    <button className="flex items-center gap-1.5 rounded-md border border-[#E3E8EF] bg-white px-[11px] py-[5px] text-[11.5px] text-[#5F6368] transition-colors hover:bg-gray-50">
      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M2 4h8M4 8h4M6 12h0" />
      </svg>
      Filter
    </button>
  );

  return (
    <ChartContainer
      title="Performance Trend"
      subtitle={`Impressions · ${dateRangeLabel}`}
      loading={loading}
      action={filterBtn}
      className="flex-[2_1_380px]"
    >
      {activePlatform === 'all' ? (
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -15, bottom: 0 }}>
          <defs>
            {Object.entries(PLATFORM_COLORS).map(([platform, color]) => (
              <linearGradient key={platform} id={`gr-${platform}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.18} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F4" vertical={false} />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9AA0A6' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9AA0A6' }} />
          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E3E8EF', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontSize: 11.5 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {Object.entries(PLATFORM_COLORS).map(([platform, color]) => (
            <Area
              key={platform}
              type="monotone"
              dataKey={platform}
              name={platform.charAt(0).toUpperCase() + platform.slice(1)}
              stroke={color}
              strokeWidth={2}
              fill={`url(#gr-${platform})`}
              dot={false}
              animationDuration={700}
            />
          ))}
        </AreaChart>
      ) : (
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="grActive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={activeColor} stopOpacity={0.2} />
              <stop offset="95%" stopColor={activeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F4" vertical={false} />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9AA0A6' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9AA0A6' }} />
          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E3E8EF', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontSize: 11.5 }} />
          <Area
            type="monotone"
            dataKey={activePlatform}
            name={activePlatformConfig?.label}
            stroke={activeColor}
            strokeWidth={2}
            fill="url(#grActive)"
            dot={false}
            animationDuration={700}
          />
        </AreaChart>
      )}
    </ChartContainer>
  );
}
