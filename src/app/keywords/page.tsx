'use client';

import { useState, useMemo } from 'react';
import { formatInteger, formatPercent, formatCurrency } from '@/lib/format';
import { useKeywords } from '@/hooks/useKeywords';
import { DateRangePicker, type DateRange } from '@/components/ui/date-range-picker';
import { addDays } from '@/lib/date';
import type { KeywordMatchType, KeywordStatus } from '@/lib/actions/keywords';
import type { AdPlatform } from '@/types';
import { PlatformFilter } from '@/components/ui/platform-filter';

function defaultRange(): DateRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return { from: addDays(today, -29), to: today };
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

const MATCH_STYLES: Record<KeywordMatchType, { bg: string; text: string }> = {
  exact:  { bg: 'bg-[#E8F0FE]', text: 'text-[#1A73E8]' },
  phrase: { bg: 'bg-[#F3E8FD]', text: 'text-[#7B1FA2]' },
  broad:  { bg: 'bg-[#F1F3F4]', text: 'text-[#5F6368]' },
};

const STATUS_STYLES: Record<KeywordStatus, string> = {
  enabled: 'bg-[#E6F4EA] text-[#137333]',
  paused: 'bg-[#FEF3CD] text-[#92640D]',
  removed: 'bg-[#FCE8E6] text-[#C5221F]'
};

function QualityScore({ score }: { score: number }) {
  const color = score >= 8 ? '#137333' : score >= 5 ? '#E37400' : '#C5221F';
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="tabular-nums font-medium" style={{ color }}>{score}/10</span>
    </div>
  );
}

export default function KeywordsPage() {
  const [search, setSearch] = useState('');
  const [matchFilter, setMatchFilter] = useState<KeywordMatchType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<KeywordStatus | 'all'>('all');
  const [platformFilter, setPlatformFilter] = useState<AdPlatform | 'all'>('all');
  const [dateRange, setDateRange] = useState<DateRange>(defaultRange);

  const { data, isLoading } = useKeywords({
    from: toISO(dateRange.from),
    to: toISO(dateRange.to),
    platform: platformFilter,
    status: statusFilter,
    matchType: matchFilter,
    search: search || undefined,
  });

  const keywords = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#202124] tracking-tight">Keywords</h1>
          <p className="text-sm text-[#5F6368] mt-0.5">Discover, track and optimise keywords driving traffic to your campaigns</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-[300px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA0A6]" width="14" height="14" viewBox="0 0 20 20" fill="none">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M13.5 13.5L18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-[13px] border border-[#E3E8EF] rounded-lg bg-white text-[#202124] placeholder:text-[#9AA0A6] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]/20 focus:border-[#1A73E8]"
          />
        </div>

        <PlatformFilter selected={platformFilter} onChange={setPlatformFilter} />

        {/* Match type filter */}
        <div className="flex items-center gap-1 rounded-lg border border-[#E3E8EF] bg-white p-1">
          {(['all', 'exact', 'phrase', 'broad'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMatchFilter(m)}
              className={`px-2.5 py-1 rounded-md text-[12px] font-medium capitalize transition-colors ${
                matchFilter === m
                  ? 'bg-[#1A73E8] text-white'
                  : 'text-[#5F6368] hover:bg-[#F1F3F4]'
              }`}
            >
              {m === 'all' ? 'All Match Types' : m}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 rounded-lg border border-[#E3E8EF] bg-white p-1">
          {(['all', 'enabled', 'paused', 'removed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-md text-[12px] font-medium capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-[#1A73E8] text-white'
                  : 'text-[#5F6368] hover:bg-[#F1F3F4]'
              }`}
            >
              {s === 'all' ? 'All Statuses' : s}
            </button>
          ))}
        </div>

        <span className="ml-auto text-[12px] text-[#9AA0A6]">{total} keyword{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#E3E8EF] bg-white overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-[12.5px] whitespace-nowrap">
          <thead>
            <tr className="border-b border-[#E3E8EF] bg-[#FAFAFA]">
              <th className="px-4 py-2.5 text-left font-semibold text-[#5F6368]">Keyword</th>
              <th className="px-4 py-2.5 text-left font-semibold text-[#5F6368]">Campaign</th>
              <th className="px-4 py-2.5 text-left font-semibold text-[#5F6368]">Match Type</th>
              <th className="px-4 py-2.5 text-left font-semibold text-[#5F6368]">Status</th>
              <th className="px-4 py-2.5 text-right font-semibold text-[#5F6368]">Impressions</th>
              <th className="px-4 py-2.5 text-right font-semibold text-[#5F6368]">Clicks</th>
              <th className="px-4 py-2.5 text-right font-semibold text-[#5F6368]">CTR</th>
              <th className="px-4 py-2.5 text-right font-semibold text-[#5F6368]">Avg CPC</th>
              <th className="px-4 py-2.5 text-left font-semibold text-[#5F6368]">Quality Score</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
               <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-[#9AA0A6]">
                  Loading keywords...
                </td>
              </tr>
            ) : keywords.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-[#9AA0A6]">
                  No keywords found.
                </td>
              </tr>
            ) : (
              keywords.map((row, i) => (
                <tr
                  key={row.id}
                  className={`border-b border-[#F1F3F4] last:border-0 hover:bg-[#F8F9FA] transition-colors ${
                    i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-[#202124]">{row.keyword}</td>
                  <td className="px-4 py-3 text-[#5F6368] max-w-[200px] truncate" title={row.campaignName}>{row.campaignName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded px-1.5 py-0.5 text-[10.5px] font-semibold capitalize ${MATCH_STYLES[row.matchType].bg} ${MATCH_STYLES[row.matchType].text}`}>
                      {row.matchType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded px-1.5 py-0.5 text-[10.5px] font-semibold capitalize ${STATUS_STYLES[row.status]}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-[#202124] tabular-nums">{formatInteger(row.impressions)}</td>
                  <td className="px-4 py-3 text-right text-[#202124] tabular-nums">{formatInteger(row.clicks)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span className={row.ctr >= 5 ? 'text-[#137333] font-medium' : row.ctr >= 3 ? 'text-[#202124]' : 'text-[#5F6368]'}>
                      {formatPercent(row.ctr)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-[#202124] tabular-nums">{formatCurrency(row.avgCpc)}</td>
                  <td className="px-4 py-3"><QualityScore score={row.qualityScore} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Summary footer */}
      {!isLoading && keywords.length > 0 && (
        <div className="mt-3 flex items-center gap-6 px-1 text-[11.5px] text-[#9AA0A6]">
          <span>Avg CTR: <span className="font-medium text-[#5F6368]">{formatPercent(keywords.reduce((s, r) => s + r.ctr, 0) / keywords.length)}</span></span>
          <span>Avg CPC: <span className="font-medium text-[#5F6368]">{formatCurrency(keywords.reduce((s, r) => s + r.avgCpc, 0) / keywords.length)}</span></span>
          <span>Avg Quality Score: <span className="font-medium text-[#5F6368]">{(keywords.reduce((s, r) => s + r.qualityScore, 0) / keywords.length).toFixed(1)}</span></span>
        </div>
      )}
    </div>
  );
}
