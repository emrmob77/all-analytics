'use client';

import { useState, useMemo } from 'react';
import { PlatformIcon } from '@/components/ui/platform-icons';
import { formatNumber, formatInteger, formatPercent, formatCurrency } from '@/lib/format';
import type { AdPlatform } from '@/types';

interface AdGroupRow {
  id: string;
  name: string;
  platform: AdPlatform;
  status: 'active' | 'paused' | 'stopped';
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
}

const DEMO_DATA: AdGroupRow[] = [
  { id: '1', name: 'Brand Keywords — Exact',      platform: 'google',    status: 'active', impressions: 45200,  clicks: 2340, ctr: 5.18, spend: 1240 },
  { id: '2', name: 'Competitor Targeting',         platform: 'google',    status: 'active', impressions: 38100,  clicks: 1890, ctr: 4.96, spend: 980  },
  { id: '3', name: 'Lookalike 2% — Purchasers',   platform: 'meta',      status: 'active', impressions: 182000, clicks: 4100, ctr: 2.25, spend: 2310 },
  { id: '4', name: 'Retargeting — 30d Visitors',  platform: 'meta',      status: 'paused', impressions: 94000,  clicks: 1820, ctr: 1.94, spend: 840  },
  { id: '5', name: 'Interest: Fashion & Style',   platform: 'meta',      status: 'active', impressions: 210000, clicks: 3200, ctr: 1.52, spend: 1650 },
  { id: '6', name: 'TikTok — Gen Z Audiences',    platform: 'tiktok',    status: 'active', impressions: 510000, clicks: 6800, ctr: 1.33, spend: 3100 },
  { id: '7', name: 'Engagement Retargeting',      platform: 'tiktok',    status: 'paused', impressions: 72000,  clicks: 890,  ctr: 1.24, spend: 410  },
  { id: '8', name: 'Pinterest Shopping',           platform: 'pinterest', status: 'active', impressions: 38000,  clicks: 620,  ctr: 1.63, spend: 290  },
];

const PLATFORM_LABELS: Record<string, string> = {
  google: 'Google', meta: 'Meta', tiktok: 'TikTok', pinterest: 'Pinterest',
};

const STATUS_COLORS: Record<string, string> = {
  active:  'bg-[#E6F4EA] text-[#137333]',
  paused:  'bg-[#FEF3CD] text-[#92640D]',
  stopped: 'bg-[#FCE8E6] text-[#C5221F]',
};

const PLATFORM_OPTIONS = ['all', 'google', 'meta', 'tiktok', 'pinterest'] as const;
type PlatformFilter = typeof PLATFORM_OPTIONS[number];

export default function AdGroupsPage() {
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');

  const filtered = useMemo(() => {
    return DEMO_DATA.filter((row) => {
      const matchSearch = row.name.toLowerCase().includes(search.toLowerCase());
      const matchPlatform = platformFilter === 'all' || row.platform === platformFilter;
      return matchSearch && matchPlatform;
    });
  }, [search, platformFilter]);

  return (
    <div className="px-6 py-6 lg:px-8 max-w-[1280px]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#202124] tracking-tight">Ad Groups</h1>
        <p className="text-sm text-[#5F6368] mt-0.5">Manage and analyse your ad groups across all platforms</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-[320px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA0A6]" width="14" height="14" viewBox="0 0 20 20" fill="none">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M13.5 13.5L18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search ad groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-[13px] border border-[#E3E8EF] rounded-lg bg-white text-[#202124] placeholder:text-[#9AA0A6] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]/20 focus:border-[#1A73E8]"
          />
        </div>
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
              {p === 'all' ? (
                'All'
              ) : (
                <>
                  <PlatformIcon platform={p as AdPlatform} size={11} />
                  {PLATFORM_LABELS[p]}
                </>
              )}
            </button>
          ))}
        </div>
        <span className="text-[12px] text-[#9AA0A6] ml-auto">{filtered.length} ad group{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#E3E8EF] bg-white overflow-hidden">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-[#E3E8EF] bg-[#FAFAFA]">
              <th className="px-4 py-2.5 text-left font-semibold text-[#5F6368]">Ad Group</th>
              <th className="px-4 py-2.5 text-left font-semibold text-[#5F6368]">Platform</th>
              <th className="px-4 py-2.5 text-left font-semibold text-[#5F6368]">Status</th>
              <th className="px-4 py-2.5 text-right font-semibold text-[#5F6368]">Impressions</th>
              <th className="px-4 py-2.5 text-right font-semibold text-[#5F6368]">Clicks</th>
              <th className="px-4 py-2.5 text-right font-semibold text-[#5F6368]">CTR</th>
              <th className="px-4 py-2.5 text-right font-semibold text-[#5F6368]">Spend</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[#9AA0A6]">
                  No ad groups match your search.
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => (
                <tr
                  key={row.id}
                  className={`border-b border-[#F1F3F4] last:border-0 hover:bg-[#F8F9FA] transition-colors ${
                    i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-[#202124]">{row.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <PlatformIcon platform={row.platform} size={12} />
                      <span className="text-[#5F6368]">{PLATFORM_LABELS[row.platform]}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded px-1.5 py-0.5 text-[10.5px] font-semibold capitalize ${STATUS_COLORS[row.status]}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-[#202124] tabular-nums">{formatNumber(row.impressions)}</td>
                  <td className="px-4 py-3 text-right text-[#202124] tabular-nums">{formatInteger(row.clicks)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span className={row.ctr >= 4 ? 'text-[#137333] font-medium' : row.ctr >= 2 ? 'text-[#202124]' : 'text-[#5F6368]'}>
                      {formatPercent(row.ctr)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-[#202124] tabular-nums font-medium">{formatCurrency(row.spend)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary footer */}
      {filtered.length > 0 && (
        <div className="mt-3 flex items-center gap-6 px-1 text-[11.5px] text-[#9AA0A6]">
          <span>Total impressions: <span className="font-medium text-[#5F6368]">{formatNumber(filtered.reduce((s, r) => s + r.impressions, 0))}</span></span>
          <span>Total clicks: <span className="font-medium text-[#5F6368]">{formatInteger(filtered.reduce((s, r) => s + r.clicks, 0))}</span></span>
          <span>Total spend: <span className="font-medium text-[#5F6368]">{formatCurrency(filtered.reduce((s, r) => s + r.spend, 0))}</span></span>
        </div>
      )}
    </div>
  );
}
