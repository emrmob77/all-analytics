'use client';

import { DateRangePicker } from '@/components/ui/date-range-picker';
import { PlatformFilter } from '@/components/ui/platform-filter';
import type { DateRange, AdPlatform } from '@/types';

interface DashboardHeaderProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  activePlatform: AdPlatform | 'all';
  setActivePlatform: (platform: AdPlatform | 'all') => void;
}

export function DashboardHeader({
  dateRange,
  onDateRangeChange,
  activePlatform,
  setActivePlatform,
}: DashboardHeaderProps) {
  return (
    <div className="space-y-5">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.3px] text-[#202124]">Campaign Overview</h1>
          <p className="mt-0.5 text-xs text-[#9AA0A6]">All platforms · Updated just now</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker value={dateRange} onChange={onDateRangeChange} />

          <button className="flex items-center gap-1.5 rounded-lg bg-[#1A73E8] px-4 py-[7px] text-xs font-semibold text-white transition-colors hover:bg-[#1557B0]">
            + New Campaign
          </button>
        </div>
      </div>

      {/* Platform Tabs */}
      <PlatformFilter value={activePlatform} onChange={setActivePlatform} />
    </div>
  );
}
