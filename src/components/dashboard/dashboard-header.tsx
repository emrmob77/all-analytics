'use client';

import { DateRangePicker, type DateRange } from '@/components/ui/date-range-picker';
import { PlatformFilter } from '@/components/ui/platform-filter';
import { addDays } from '@/lib/date';
import type { AdPlatform } from '@/types';

interface DashboardHeaderProps {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  activePlatform: AdPlatform | 'all';
  setActivePlatform: (platform: AdPlatform | 'all') => void;
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

export function DashboardHeader({
  dateRange,
  setDateRange,
  activePlatform,
  setActivePlatform,
}: DashboardHeaderProps) {
  const activePreset = detectQuickPreset(dateRange);

  return (
    <div className="space-y-5">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.3px] text-[#202124]">Campaign Overview</h1>
          <p className="mt-0.5 text-xs text-[#9AA0A6]">All platforms · Updated just now</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick preset buttons — 7d / 30d / 90d */}
          <div className="flex overflow-hidden rounded-lg border border-[#E3E8EF] bg-white">
            {(['7d', '30d', '90d'] as QuickPreset[]).map((d, i) => (
              <button
                key={d}
                onClick={() => setDateRange(makeRange(d))}
                className={`px-[13px] py-1.5 text-xs font-medium transition-all ${
                  i > 0 ? 'border-l border-[#E3E8EF]' : ''
                } ${
                  activePreset === d
                    ? 'bg-[#E8F0FE] font-semibold text-[#1A73E8]'
                    : 'bg-white text-[#5F6368] hover:bg-gray-50'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Custom date range picker */}
          <DateRangePicker value={dateRange} onChange={setDateRange} />

          {/* New Campaign */}
          <button className="flex items-center gap-1.5 rounded-lg bg-[#1A73E8] px-4 py-[7px] text-xs font-semibold text-white transition-colors hover:bg-[#1557B0]">
            + New Campaign
          </button>
        </div>
      </div>

      {/* Platform Filter Tabs */}
      <PlatformFilter selected={activePlatform} onChange={setActivePlatform} />
    </div>
  );
}
