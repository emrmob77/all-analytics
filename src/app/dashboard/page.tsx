'use client';

import { useState } from 'react';
import { addDays } from '@/lib/date';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { MetricCards } from '@/components/dashboard/metric-cards';
import { PerformanceChart } from '@/components/dashboard/performance-chart';
import { HourlyChart } from '@/components/dashboard/hourly-chart';
import { PlatformSummary } from '@/components/dashboard/platform-summary';
import { CampaignTable } from '@/components/dashboard/campaign-table';
import type { DateRange } from '@/components/ui/date-range-picker';
import type { AdPlatform } from '@/types';

function defaultRange(): DateRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return { from: addDays(today, -29), to: today };
}

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange>(defaultRange);
  const [activePlatform, setActivePlatform] = useState<AdPlatform | 'all'>('all');

  return (
    <div className="flex-1 overflow-auto bg-[#F8F9FA]">
      <div className="mx-auto max-w-[1280px] px-6 py-6 lg:px-8">
        {/* Header with DateRangePicker and PlatformFilter */}
        <DashboardHeader
          dateRange={dateRange}
          setDateRange={setDateRange}
          activePlatform={activePlatform}
          setActivePlatform={setActivePlatform}
        />

        {/* Metric Cards */}
        <div className="mt-5">
          <MetricCards />
        </div>

        {/* Charts Row */}
        <div className="mt-5 flex flex-wrap gap-3.5">
          <PerformanceChart activePlatform={activePlatform} dateRange={dateRange} />
          <HourlyChart />
        </div>

        {/* Platform Summary */}
        <div className="mt-5">
          <PlatformSummary />
        </div>

        {/* Campaigns Table */}
        <div className="mt-5">
          <CampaignTable activePlatform={activePlatform} />
        </div>
      </div>
    </div>
  );
}
