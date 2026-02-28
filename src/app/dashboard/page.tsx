'use client';

import { useState } from 'react';
import { addDays } from '@/lib/date';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { MetricCards } from '@/components/dashboard/metric-cards';
import { PerformanceChart } from '@/components/dashboard/performance-chart';
import { HourlyChart } from '@/components/dashboard/hourly-chart';
import { PlatformSummary } from '@/components/dashboard/platform-summary';
import {
  useDashboardBundle,
} from '@/hooks/useDashboard';
import type { DateRange } from '@/components/ui/date-range-picker';
import type { AdPlatform } from '@/types';

function defaultRange(): DateRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return { from: addDays(today, -29), to: today };
}

export default function DashboardPage() {
  const [dateRange, setDateRange]       = useState<DateRange>(defaultRange);
  const [activePlatform, setActivePlatform] = useState<AdPlatform | 'all'>('all');

  const bundleQ = useDashboardBundle(dateRange, activePlatform);
  const bundle = bundleQ.data;

  return (
    <div className="flex-1 overflow-auto bg-[#F8F9FA]">
      <div className="mx-auto max-w-[1280px] px-6 py-6 lg:px-8">
        <DashboardHeader
          dateRange={dateRange}
          setDateRange={setDateRange}
          activePlatform={activePlatform}
          setActivePlatform={setActivePlatform}
        />

        <div className="mt-5">
          <MetricCards
            data={bundle?.metrics}
            loading={bundleQ.isLoading}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-3.5">
          <PerformanceChart
            activePlatform={activePlatform}
            dateRange={dateRange}
            data={bundle?.chartData}
            loading={bundleQ.isLoading}
          />
          <HourlyChart
            data={bundle?.hourlyData}
            loading={bundleQ.isLoading}
          />
        </div>

        <div className="mt-5">
          <PlatformSummary
            data={bundle?.platformSummary}
            loading={bundleQ.isLoading}
          />
        </div>
      </div>
    </div>
  );
}
