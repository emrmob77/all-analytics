'use client';

import { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { MetricCards } from '@/components/dashboard/metric-cards';
import { PerformanceChart } from '@/components/dashboard/performance-chart';
import { HourlyChart } from '@/components/dashboard/hourly-chart';
import { PlatformSummary } from '@/components/dashboard/platform-summary';
import { CampaignTable } from '@/components/dashboard/campaign-table';
import { getPresetRange } from '@/lib/date';
import type { AdPlatform, DateRange } from '@/types';

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange>(() => getPresetRange('last30days'));
  const [activePlatform, setActivePlatform] = useState<AdPlatform | 'all'>('all');

  return (
    <div className="flex-1 overflow-auto bg-[#F8F9FA]">
      <div className="mx-auto max-w-[1280px] px-6 py-6 lg:px-8">
        <DashboardHeader
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          activePlatform={activePlatform}
          setActivePlatform={setActivePlatform}
        />

        <div className="mt-5">
          <MetricCards />
        </div>

        <div className="mt-5 flex flex-wrap gap-3.5">
          <PerformanceChart activePlatform={activePlatform} dateRange={dateRange} />
          <HourlyChart />
        </div>

        <div className="mt-5">
          <PlatformSummary />
        </div>

        <div className="mt-5">
          <CampaignTable activePlatform={activePlatform} />
        </div>
      </div>
    </div>
  );
}
