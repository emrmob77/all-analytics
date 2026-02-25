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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <GoogleIcon size={24} />
            <h1 className="text-[22px] font-bold tracking-[-0.3px] text-[#202124]">Google Ads Overview</h1>
          </div>
          <div className="mt-1">
            <SyncStatusIndicator isAdmin={isAdmin} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick preset buttons — 7d / 30d / 90d */}
          <div className="flex overflow-hidden rounded-lg border border-[#E3E8EF] bg-white">
            {(['7d', '30d', '90d'] as QuickPreset[]).map((d, i) => (
              <button
                key={d}
                onClick={() => setDateRange(makeRange(d))}
                className={`px-[13px] py-1.5 text-xs font-medium transition-all ${i > 0 ? 'border-l border-[#E3E8EF]' : ''
                  } ${activePreset === d
                    ? 'bg-[#E8F0FE] font-semibold text-[#1A73E8]'
                    : 'bg-white text-[#5F6368] hover:bg-gray-50'
                  }`}
              >
                {d}
              </button>
            ))}
          </div>

          <DateRangePicker value={dateRange} onChange={setDateRange} />
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
      <div className="mx-auto max-w-[1280px] px-6 py-6 lg:px-8">
        <GoogleAdsHeader
          dateRange={dateRange}
          setDateRange={setDateRange}
        />

        <div className="mt-6">
          <MetricCards
            data={metricsQ.data}
            loading={metricsQ.isLoading}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-3.5">
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

        <div className="mt-5">
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
