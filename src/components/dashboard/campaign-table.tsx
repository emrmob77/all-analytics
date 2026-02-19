'use client';

import { useState } from 'react';
import { PLATFORMS, DEMO_CAMPAIGNS, STATUS_STYLES } from '@/types';
import { PlatformIcon } from '@/components/ui/platform-icons';
import type { AdPlatform, Campaign } from '@/types';

interface CampaignTableProps {
  activePlatform: AdPlatform | 'all';
}

const COLUMNS = [
  { key: 'name', label: 'Campaign' },
  { key: 'platform', label: 'Platform' },
  { key: 'status', label: 'Status' },
  { key: 'impressions', label: 'Impressions' },
  { key: 'clicks', label: 'Clicks' },
  { key: 'ctr', label: 'CTR' },
  { key: 'spend', label: 'Spend / Budget' },
  { key: 'conversions', label: 'Conv.' },
  { key: 'roas', label: 'ROAS' },
];

export function CampaignTable({ activePlatform }: CampaignTableProps) {
  const [sortCol, setSortCol] = useState<keyof Campaign>('spend');

  const filtered = activePlatform === 'all'
    ? DEMO_CAMPAIGNS
    : DEMO_CAMPAIGNS.filter(c => c.platform === activePlatform);

  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortCol];
    const bVal = b[sortCol];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return bVal - aVal;
    }
    return String(bVal).localeCompare(String(aVal));
  });

  const activePlatformLabel = PLATFORMS.find(p => p.id === activePlatform)?.label || 'All Platforms';

  return (
    <div className="overflow-hidden rounded-[10px] border border-[#E3E8EF] bg-white">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#F1F3F4] px-5 pb-3 pt-4">
        <div>
          <div className="text-sm font-semibold text-[#202124]">Campaigns</div>
          <div className="mt-0.5 text-[11.5px] text-[#9AA0A6]">
            {filtered.length} campaigns · {activePlatformLabel}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-[5px] rounded-[7px] border border-[#E3E8EF] bg-white px-3 py-1.5 text-xs text-[#5F6368] transition-colors hover:bg-gray-50">
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 3h10M3 7h6M5 11h2"/>
            </svg>
            Filter
          </button>
          <button className="flex items-center gap-[5px] rounded-[7px] border border-[#E3E8EF] bg-white px-3 py-1.5 text-xs text-[#5F6368] transition-colors hover:bg-gray-50">
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M6 1v7M3 5l3 3 3-3M1 10h10"/>
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="bg-[#F8F9FA]">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => setSortCol(col.key as keyof Campaign)}
                  className={`cursor-pointer select-none whitespace-nowrap border-b border-[#E3E8EF] px-3.5 py-[9px] text-left text-[11px] font-medium ${
                    sortCol === col.key ? 'text-[#1A73E8]' : 'text-[#5F6368]'
                  }`}
                >
                  {col.label} {sortCol === col.key && '↓'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const platform = PLATFORMS.find(p => p.id === row.platform);
              const statusStyle = STATUS_STYLES[row.status];
              const pct = row.budget > 0 ? Math.round(row.spend / row.budget * 100) : 0;
              const barColor = pct > 90 ? '#C5221F' : pct > 70 ? '#B06000' : '#1A73E8';

              return (
                <tr
                  key={row.id}
                  className="cursor-pointer bg-white transition-colors hover:bg-[#F8FBFF]"
                >
                  {/* Campaign Name */}
                  <td className="min-w-[170px] border-b border-[#F1F3F4] px-3.5 py-[11px]">
                    <div className="font-medium text-[#202124]">{row.name}</div>
                  </td>

                  {/* Platform */}
                  <td className="border-b border-[#F1F3F4] px-3.5 py-[11px]">
                    <span
                      className="inline-flex items-center gap-[5px] rounded-full border px-[9px] py-[3px] text-[11px] font-medium"
                      style={{
                        backgroundColor: platform?.bgColor,
                        color: platform?.color,
                        borderColor: `${platform?.color}30`,
                      }}
                    >
                      {platform && <PlatformIcon platform={row.platform} size={12} />}
                      {platform?.label.split(' ')[0]}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="border-b border-[#F1F3F4] px-3.5 py-[11px]">
                    <span
                      className="inline-flex items-center gap-[5px] rounded-[5px] px-[9px] py-[3px] text-[11px] font-medium capitalize"
                      style={{
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color,
                      }}
                    >
                      <span
                        className="inline-block h-[5px] w-[5px] rounded-full"
                        style={{ backgroundColor: statusStyle.dot }}
                      />
                      {row.status}
                    </span>
                  </td>

                  {/* Impressions */}
                  <td className="border-b border-[#F1F3F4] px-3.5 py-[11px] text-[#5F6368]">
                    {row.impressions > 0 ? `${(row.impressions / 1000).toFixed(0)}K` : '—'}
                  </td>

                  {/* Clicks */}
                  <td className="border-b border-[#F1F3F4] px-3.5 py-[11px] text-[#5F6368]">
                    {row.clicks > 0 ? row.clicks.toLocaleString() : '—'}
                  </td>

                  {/* CTR */}
                  <td className="border-b border-[#F1F3F4] px-3.5 py-[11px] text-[#5F6368]">
                    {row.ctr > 0 ? `${row.ctr}%` : '—'}
                  </td>

                  {/* Spend / Budget */}
                  <td className="min-w-[140px] border-b border-[#F1F3F4] px-3.5 py-[11px]">
                    {row.spend > 0 ? (
                      <>
                        <div className="mb-1 flex justify-between text-[11.5px]">
                          <span className="font-medium text-[#202124]">${row.spend.toLocaleString()}</span>
                          <span className="text-[#9AA0A6]">/ ${row.budget.toLocaleString()}</span>
                        </div>
                        <div className="h-1 rounded-sm bg-[#F1F3F4]">
                          <div
                            className="h-full rounded-sm transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: barColor }}
                          />
                        </div>
                      </>
                    ) : (
                      <span className="text-[#E3E8EF]">Not started</span>
                    )}
                  </td>

                  {/* Conversions */}
                  <td className="border-b border-[#F1F3F4] px-3.5 py-[11px] font-medium text-[#202124]">
                    {row.conversions > 0 ? row.conversions : '—'}
                  </td>

                  {/* ROAS */}
                  <td className="border-b border-[#F1F3F4] px-3.5 py-[11px]">
                    {row.roas > 0 ? (
                      <span
                        className="font-bold"
                        style={{
                          color: row.roas >= 5 ? '#137333' : row.roas >= 3 ? '#B06000' : '#C5221F',
                        }}
                      >
                        {row.roas}x
                      </span>
                    ) : (
                      <span className="text-[#E3E8EF]">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
