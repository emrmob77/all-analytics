'use client';

import type { AdPlatform } from '@/types';
import { PlatformFilter } from '@/components/ui/platform-filter';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRangePickerProps } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';

interface DashboardHeaderProps {
  dateRange: string;
  setDateRange: (range: string) => void;
  activePlatform: AdPlatform | 'all';
  setActivePlatform: (platform: AdPlatform | 'all') => void;
}

const QUICK_RANGES = ['7d', '30d', '90d'] as const;

export function DashboardHeader({
  dateRange,
  setDateRange,
  activePlatform,
  setActivePlatform,
}: DashboardHeaderProps) {
  const handleDateRangeChange: DateRangePickerProps['onChange'] = (_range: DateRange, preset) => {
    const presetMap: Record<string, string> = {
      today:     'today',
      yesterday: 'yesterday',
      last7days:  '7d',
      last30days: '30d',
      last90days: '90d',
    };
    if (preset in presetMap) setDateRange(presetMap[preset]);
    else setDateRange('custom');
  };

  const defaultPreset: DateRangePickerProps['defaultPreset'] =
    dateRange === '7d'        ? 'last7days'  :
    dateRange === '90d'       ? 'last90days' :
    dateRange === 'today'     ? 'today'      :
    dateRange === 'yesterday' ? 'yesterday'  :
    dateRange === 'custom'    ? 'custom'     : 'last30days';

  return (
    <div className="space-y-5">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.3px] text-[#202124]">Campaign Overview</h1>
          <p className="mt-0.5 text-xs text-[#9AA0A6]">All platforms · Updated just now</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick range buttons */}
          <div className="flex overflow-hidden rounded-lg border border-[#E3E8EF] bg-white">
            {QUICK_RANGES.map((d, i) => (
              <button
                key={d}
                onClick={() => setDateRange(d)}
                className={`px-[13px] py-1.5 text-xs font-medium transition-all ${
                  i > 0 ? 'border-l border-[#E3E8EF]' : ''
                } ${
                  dateRange === d
                    ? 'bg-[#E8F0FE] font-semibold text-[#1A73E8]'
                    : 'bg-white text-[#5F6368] hover:bg-gray-50'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Calendar / custom range picker */}
          <DateRangePicker
            onChange={handleDateRangeChange}
            defaultPreset={defaultPreset as DateRangePickerProps['defaultPreset']}
          />

          {/* New Campaign Button */}
          <button className="flex items-center gap-1.5 rounded-lg bg-[#1A73E8] px-4 py-[7px] text-xs font-semibold text-white transition-colors hover:bg-[#1557B0]">
            + New Campaign
          </button>
        </div>
      </div>

      {/* Platform filter */}
      <PlatformFilter value={activePlatform} onChange={setActivePlatform} />
    </div>
  );
}
