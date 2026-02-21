'use client';

import { useState, useMemo } from 'react';
import { PlatformIcon } from '@/components/ui/platform-icons';
import { formatNumber, formatPercent } from '@/lib/format';
import type { AdPlatform } from '@/types';

type AudienceType = 'Lookalike' | 'Remarketing' | 'Interest' | 'Custom';

interface AudienceCard {
  id: string;
  name: string;
  type: AudienceType;
  platform: AdPlatform;
  size: number;
  sizeLabel: string;
  ctr: number;
  cvr: number;
}

const DEMO_DATA: AudienceCard[] = [
  { id: '1', name: 'Website Visitors 30d',          type: 'Remarketing', platform: 'meta',      size: 48000,    sizeLabel: '48K',  ctr: 2.8, cvr: 3.2 },
  { id: '2', name: 'Purchasers Lookalike 2%',        type: 'Lookalike',   platform: 'meta',      size: 2400000,  sizeLabel: '2.4M', ctr: 2.1, cvr: 2.8 },
  { id: '3', name: 'Instagram Engagers',             type: 'Remarketing', platform: 'meta',      size: 124000,   sizeLabel: '124K', ctr: 1.9, cvr: 1.4 },
  { id: '4', name: 'Customer List — Gold',           type: 'Custom',      platform: 'meta',      size: 18000,    sizeLabel: '18K',  ctr: 4.1, cvr: 5.2 },
  { id: '5', name: 'In-Market: Electronics',         type: 'Interest',    platform: 'google',    size: 8200000,  sizeLabel: '8.2M', ctr: 1.2, cvr: 0.9 },
  { id: '6', name: 'Similar Audiences — Converters', type: 'Lookalike',   platform: 'google',    size: 5600000,  sizeLabel: '5.6M', ctr: 0.8, cvr: 1.1 },
  { id: '7', name: 'TikTok Video Viewers 75%',       type: 'Remarketing', platform: 'tiktok',    size: 320000,   sizeLabel: '320K', ctr: 1.5, cvr: 1.8 },
  { id: '8', name: 'Pinterest Engaged Shoppers',     type: 'Interest',    platform: 'pinterest', size: 1100000,  sizeLabel: '1.1M', ctr: 1.7, cvr: 2.1 },
];

const TYPE_STYLES: Record<AudienceType, { bg: string; text: string; label: string }> = {
  Lookalike:   { bg: 'bg-[#E8F0FE]', text: 'text-[#1A73E8]',  label: 'Lookalike'   },
  Remarketing: { bg: 'bg-[#F3E8FD]', text: 'text-[#7B1FA2]',  label: 'Remarketing' },
  Interest:    { bg: 'bg-[#E6F4EA]', text: 'text-[#137333]',  label: 'Interest'    },
  Custom:      { bg: 'bg-[#FEF0E6]', text: 'text-[#B06000]',  label: 'Custom'      },
};

const PLATFORM_LABELS: Record<string, string> = {
  google: 'Google', meta: 'Meta', tiktok: 'TikTok', pinterest: 'Pinterest',
};

const PLATFORM_OPTIONS = ['all', 'google', 'meta', 'tiktok', 'pinterest'] as const;
type PlatformFilter = typeof PLATFORM_OPTIONS[number];

function MetricPill({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] text-[#9AA0A6] font-medium uppercase tracking-wide">{label}</span>
      <span className={`text-[13px] font-semibold tabular-nums ${highlight ? 'text-[#137333]' : 'text-[#202124]'}`}>{value}</span>
    </div>
  );
}

export default function AudiencesPage() {
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const [typeFilter, setTypeFilter] = useState<AudienceType | 'all'>('all');

  const filtered = useMemo(() => {
    return DEMO_DATA.filter((a) => {
      const matchPlatform = platformFilter === 'all' || a.platform === platformFilter;
      const matchType = typeFilter === 'all' || a.type === typeFilter;
      return matchPlatform && matchType;
    });
  }, [platformFilter, typeFilter]);

  return (
    <div className="flex-1 px-6 py-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#202124] tracking-tight">Audiences</h1>
        <p className="text-sm text-[#5F6368] mt-0.5">Build and manage custom audiences to reach the right people at the right time</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Platform filter */}
        <div className="flex items-center gap-1 rounded-lg border border-[#E3E8EF] bg-white p-1">
          {PLATFORM_OPTIONS.map((p) => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors ${
                platformFilter === p
                  ? 'bg-[#1A73E8] text-white'
                  : 'text-[#5F6368] hover:bg-[#F1F3F4]'
              }`}
            >
              {p === 'all' ? 'All Platforms' : (
                <>
                  <PlatformIcon platform={p as AdPlatform} size={11} />
                  {PLATFORM_LABELS[p]}
                </>
              )}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-1 rounded-lg border border-[#E3E8EF] bg-white p-1">
          {(['all', 'Lookalike', 'Remarketing', 'Interest', 'Custom'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors ${
                typeFilter === t
                  ? 'bg-[#1A73E8] text-white'
                  : 'text-[#5F6368] hover:bg-[#F1F3F4]'
              }`}
            >
              {t === 'all' ? 'All Types' : t}
            </button>
          ))}
        </div>

        <span className="ml-auto text-[12px] text-[#9AA0A6]">{filtered.length} audience{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[#E3E8EF] bg-white py-16 text-center text-sm text-[#9AA0A6]">
          No audiences match the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((audience) => {
            const typeStyle = TYPE_STYLES[audience.type];
            return (
              <div
                key={audience.id}
                className="rounded-xl border border-[#E3E8EF] bg-white px-5 py-4 hover:border-[#1A73E8]/40 hover:shadow-sm transition-all"
              >
                {/* Top row: type badge + platform */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex rounded-md px-2 py-0.5 text-[10.5px] font-semibold ${typeStyle.bg} ${typeStyle.text}`}>
                    {typeStyle.label}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11.5px] text-[#5F6368]">
                    <PlatformIcon platform={audience.platform} size={12} />
                    <span>{PLATFORM_LABELS[audience.platform]}</span>
                  </div>
                </div>

                {/* Name */}
                <div className="text-[14px] font-semibold text-[#202124] mb-1">{audience.name}</div>

                {/* Size */}
                <div className="flex items-center gap-1.5 mb-4">
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" className="text-[#9AA0A6]">
                    <circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="1.6"/>
                    <path d="M3 19c0-3.87 3.13-7 7-7s7 3.13 7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                  <span className="text-[12px] text-[#5F6368]">
                    <span className="font-semibold text-[#202124]">{audience.sizeLabel}</span> people
                  </span>
                </div>

                {/* Metrics */}
                <div className="flex items-center justify-around rounded-lg bg-[#FAFAFA] border border-[#E3E8EF] py-3">
                  <MetricPill label="CTR" value={formatPercent(audience.ctr)} highlight={audience.ctr >= 3} />
                  <div className="w-px h-8 bg-[#E3E8EF]" />
                  <MetricPill label="Conv. Rate" value={formatPercent(audience.cvr)} highlight={audience.cvr >= 3} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
