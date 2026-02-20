'use client';

import type { AdPlatform } from '@/types';
import { PlatformFilter } from '@/components/ui/platform-filter';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRangePickerProps } from '@/components/ui/date-range-picker';
import { SyncStatusIndicator } from '@/components/dashboard/sync-status-indicator';
import { Button } from '@/components/ui/button';
import type { DateRange } from 'react-day-picker';
import { Plus } from 'lucide-react';

interface DashboardHeaderProps {
  dateRange: string;
  setDateRange: (range: string) => void;
  setCustomDays: (days: number) => void;
  activePlatform: AdPlatform | 'all';
  setActivePlatform: (platform: AdPlatform | 'all') => void;
  isAdmin: boolean;
}

const QUICK_RANGES = ['7d', '30d', '90d'] as const;

export function DashboardHeader({
  dateRange,
  setDateRange,
  setCustomDays,
  activePlatform,
  setActivePlatform,
  isAdmin,
}: DashboardHeaderProps) {
  const handleDateRangeChange: DateRangePickerProps['onChange'] = (range: DateRange, preset) => {
    const presetMap: Record<string, string> = {
      today:     'today',
      yesterday: 'yesterday',
      last7days:  '7d',
      last30days: '30d',
      last90days: '90d',
    };
    if (preset in presetMap) {
      setDateRange(presetMap[preset]);
    } else if (range.from && range.to) {
      const days = Math.round((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      setCustomDays(days);
      setDateRange('custom');
    }
  };

  const defaultPreset: DateRangePickerProps['defaultPreset'] =
    dateRange === '7d'        ? 'last7days'  :
    dateRange === '90d'       ? 'last90days' :
    dateRange === 'today'     ? 'today'      :
    dateRange === 'yesterday' ? 'yesterday'  :
    dateRange === 'custom'    ? 'custom'     : 'last30days';

  return (
    <header className="space-y-4">
      <div className="rounded-2xl border border-[#E3E8EF] bg-white px-4 py-4 shadow-sm sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-[#9AA0A6]">Dashboard</p>
            <h1 className="mt-1 text-[23px] font-bold tracking-[-0.3px] text-[#202124]">Campaign Overview</h1>
            <p className="mt-1 text-xs text-[#9AA0A6]">All platforms · Updated just now</p>
          </div>
          <div className="w-full lg:w-auto">
            <SyncStatusIndicator isAdmin={isAdmin} />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="w-full overflow-x-auto pb-1 sm:w-auto sm:overflow-visible sm:pb-0">
            <div className="inline-flex min-w-max rounded-lg border border-[#E3E8EF] bg-white p-0.5">
              {QUICK_RANGES.map((d) => (
                <Button
                  key={d}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateRange(d)}
                  className={`h-7 rounded-md px-3 text-xs ${
                    dateRange === d
                      ? 'bg-[#E8F0FE] font-semibold text-[#1A73E8]'
                      : 'text-[#5F6368] hover:bg-gray-50'
                  }`}
                >
                  {d}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
            <DateRangePicker
              onChange={handleDateRangeChange}
              defaultPreset={defaultPreset as DateRangePickerProps['defaultPreset']}
            />
            <Button
              type="button"
              size="sm"
              className="h-[30px] bg-[#1A73E8] px-3.5 text-xs font-semibold text-white hover:bg-[#1557B0]"
            >
              <Plus className="h-3.5 w-3.5" />
              New Campaign
            </Button>
          </div>
        </div>
      </div>

      <PlatformFilter value={activePlatform} onChange={setActivePlatform} />
    </header>
  );
}
