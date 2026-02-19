'use client';

import { PLATFORMS } from '@/types';
import { PlatformIcon } from '@/components/ui/platform-icons';
import type { AdPlatform } from '@/types';

interface DashboardHeaderProps {
  dateRange: string;
  setDateRange: (range: string) => void;
  activePlatform: AdPlatform | 'all';
  setActivePlatform: (platform: AdPlatform | 'all') => void;
}

export function DashboardHeader({
  dateRange,
  setDateRange,
  activePlatform,
  setActivePlatform
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
          {/* Date Range Buttons */}
          <div className="flex overflow-hidden rounded-lg border border-[#E3E8EF] bg-white">
            {['7d', '30d', '90d'].map((d, i) => (
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

          {/* Calendar Button */}
          <button className="flex items-center gap-1.5 rounded-lg border border-[#E3E8EF] bg-white px-3.5 py-[7px] text-xs font-medium text-[#5F6368] transition-colors hover:bg-gray-50">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <rect x="1" y="2" width="11" height="10" rx="1.5"/>
              <path d="M1 5h11M4 1v2M8 1v2"/>
            </svg>
            <span className="hidden sm:inline">Jun 1 – Jun 30</span>
          </button>

          {/* New Campaign Button */}
          <button className="flex items-center gap-1.5 rounded-lg bg-[#1A73E8] px-4 py-[7px] text-xs font-semibold text-white transition-colors hover:bg-[#1557B0]">
            + New Campaign
          </button>
        </div>
      </div>

      {/* Platform Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePlatform(p.id)}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
              activePlatform === p.id
                ? `border-[1.5px] font-semibold`
                : 'border-[1.5px] border-[#E3E8EF] bg-white text-[#5F6368] hover:bg-gray-50'
            }`}
            style={
              activePlatform === p.id
                ? {
                    borderColor: p.color,
                    backgroundColor: p.bgColor,
                    color: p.color,
                  }
                : undefined
            }
          >
            {p.id !== 'all' && <PlatformIcon platform={p.id as AdPlatform} size={14} />}
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
