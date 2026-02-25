'use client';

import { useState } from 'react';
import { addDays } from '@/lib/date';
import { DateRangePicker, type DateRange } from '@/components/ui/date-range-picker';
import { SyncStatusIndicator } from '@/components/dashboard/SyncStatusIndicator';
import { MetricCards } from '@/components/dashboard/metric-cards';
import { PerformanceChart } from '@/components/dashboard/performance-chart';
import { HourlyChart } from '@/components/dashboard/hourly-chart';
import { CampaignTable } from '@/components/dashboard/campaign-table';
import { GoogleIcon } from '@/components/ui/platform-icons';
import { useRole } from '@/hooks/useRole';
import {
  useDashboardMetrics,
  useDashboardCampaigns,
  useDashboardChartData,
  useDashboardHourlyData,
} from '@/hooks/useDashboard';

function defaultRange(): DateRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return { from: addDays(today, -29), to: today };
}

type QuickPreset = '7d' | '30d' | '90d';

function makeRange(preset: QuickPreset): DateRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = preset === '7d' ? 6 : preset === '30d' ? 29 : 89;
  return { from: addDays(today, -days), to: today };
}

function detectQuickPreset(range: DateRange): QuickPreset | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (range.to.getTime() !== today.getTime()) return null;
  for (const p of ['7d', '30d', '90d'] as QuickPreset[]) {
    if (range.from.getTime() === makeRange(p).from.getTime()) return p;
  }
  return null;
}

function GoogleAdsHeader({
  dateRange,
  setDateRange,
}: {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
}) {
  const activePreset = detectQuickPreset(dateRange);
  const { isAdmin } = useRole();

  return (
    <div className="border-b border-[#E3E8EF] px-6 pb-6 pt-8 lg:px-8 bg-gradient-to-b from-[#1A73E8]/10 via-transparent">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-col gap-6 md:flex-row md:items-end justify-between">
          <div>
            <div className="flex items-center gap-3.5 mb-2.5">
              <div
                className="flex h-[42px] w-[42px] items-center justify-center rounded-[10px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#E3E8EF]/50"
                style={{ color: '#1A73E8' }}
              >
                <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#1A73E8] p-2">
                  <svg width="24" height="24" viewBox="0 0 14 14" fill="none">
                    <path d="M2 10l2.5-4 2.5 2.5 2-3.5 3 5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-[26px] font-bold tracking-[-0.4px] text-[#202124] leading-tight">
                  Google Ads Overview
                </h1>
              </div>
            </div>
            <p className="text-[13px] text-[#5F6368] mb-4">
              Comprehensive performance dashboard for all your Google Ads efforts.
            </p>
            <SyncStatusIndicator isAdmin={isAdmin} />
          </div>

          <div className="flex flex-wrap items-center gap-3 pb-1">
            <div className="flex overflow-hidden rounded-[9px] border border-[#E3E8EF] bg-white shadow-sm">
              {(['7d', '30d', '90d'] as QuickPreset[]).map((d, i) => (
                <button
                  key={d}
                  onClick={() => setDateRange(makeRange(d))}
                  className={`px-[13px] py-1.5 text-xs font-medium transition-colors ${i > 0 ? 'border-l border-[#E3E8EF]' : ''
                    } ${activePreset === d
                      ? 'bg-[#E8F0FE] text-[#1A73E8]'
                      : 'bg-white text-[#5F6368] hover:bg-gray-50'
                    }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <div className="shadow-sm rounded-[9px] bg-white inline-block">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GoogleAdsPage() {
  const [dateRange, setDateRange] = useState<DateRange>(defaultRange);
  const activePlatform = 'google';

  const metricsQ = useDashboardMetrics(dateRange, activePlatform);
  const campaignsQ = useDashboardCampaigns(dateRange, activePlatform);
  const chartQ = useDashboardChartData(dateRange);
  const hourlyQ = useDashboardHourlyData();

  return (
    <div className="flex-1 overflow-auto bg-[#F8F9FA]">
      <GoogleAdsHeader
        dateRange={dateRange}
        setDateRange={setDateRange}
      />

      <div className="mx-auto max-w-[1280px] px-6 py-6 lg:px-8">
        <div className="mb-6">
          <MetricCards
            data={metricsQ.data}
            loading={metricsQ.isLoading}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-3.5 mb-5">
          <PerformanceChart
            activePlatform={activePlatform}
            dateRange={dateRange}
            data={chartQ.data}
            loading={chartQ.isLoading}
          />
          <HourlyChart
            data={hourlyQ.data}
            loading={hourlyQ.isLoading}
          />
        </div>

        <div>
          <CampaignTable
            activePlatform={activePlatform}
            data={campaignsQ.data}
            loading={campaignsQ.isLoading}
          />
        </div>
      </div>
    </div>
  );
}
