'use client';

import { useState, useMemo } from 'react';
import { formatInteger, formatPercent, formatCurrency } from '@/lib/format';

type MatchType = 'Exact' | 'Phrase' | 'Broad';
type KwStatus = 'active' | 'paused';

interface KeywordRow {
  id: string;
  keyword: string;
  matchType: MatchType;
  status: KwStatus;
  impressions: number;
  clicks: number;
  ctr: number;
  avgCpc: number;
  qualityScore: number;
}

const DEMO_DATA: KeywordRow[] = [
  { id: '1',  keyword: 'buy running shoes',        matchType: 'Exact',  status: 'active', impressions: 12400, clicks: 890,  ctr: 7.18, avgCpc: 0.82, qualityScore: 8 },
  { id: '2',  keyword: 'best running shoes 2024',  matchType: 'Phrase', status: 'active', impressions: 28000, clicks: 1240, ctr: 4.43, avgCpc: 0.65, qualityScore: 7 },
  { id: '3',  keyword: 'nike shoes',               matchType: 'Broad',  status: 'active', impressions: 95000, clicks: 2100, ctr: 2.21, avgCpc: 1.20, qualityScore: 5 },
  { id: '4',  keyword: 'adidas running',           matchType: 'Phrase', status: 'active', impressions: 44000, clicks: 1680, ctr: 3.82, avgCpc: 0.91, qualityScore: 7 },
  { id: '5',  keyword: 'running shoes for men',    matchType: 'Exact',  status: 'active', impressions: 18200, clicks: 1050, ctr: 5.77, avgCpc: 0.74, qualityScore: 9 },
  { id: '6',  keyword: 'cheap sneakers',           matchType: 'Broad',  status: 'paused', impressions: 72000, clicks: 980,  ctr: 1.36, avgCpc: 0.42, qualityScore: 4 },
  { id: '7',  keyword: 'athletic footwear',        matchType: 'Phrase', status: 'active', impressions: 31000, clicks: 820,  ctr: 2.65, avgCpc: 1.05, qualityScore: 6 },
  { id: '8',  keyword: 'trail running shoes',      matchType: 'Exact',  status: 'active', impressions: 9800,  clicks: 640,  ctr: 6.53, avgCpc: 0.88, qualityScore: 8 },
  { id: '9',  keyword: 'running shoes sale',       matchType: 'Phrase', status: 'active', impressions: 52000, clicks: 2300, ctr: 4.42, avgCpc: 0.55, qualityScore: 7 },
  { id: '10', keyword: 'sports shoes online',      matchType: 'Broad',  status: 'paused', impressions: 88000, clicks: 1100, ctr: 1.25, avgCpc: 0.78, qualityScore: 5 },
];

const MATCH_STYLES: Record<MatchType, { bg: string; text: string }> = {
  Exact:  { bg: 'bg-[#E8F0FE]', text: 'text-[#1A73E8]' },
  Phrase: { bg: 'bg-[#F3E8FD]', text: 'text-[#7B1FA2]' },
  Broad:  { bg: 'bg-[#F1F3F4]', text: 'text-[#5F6368]' },
};

const STATUS_STYLES: Record<KwStatus, string> = {
  active: 'bg-[#E6F4EA] text-[#137333]',
  paused: 'bg-[#FEF3CD] text-[#92640D]',
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
  const [matchFilter, setMatchFilter] = useState<MatchType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<KwStatus | 'all'>('all');

  const filtered = useMemo(() => {
    return DEMO_DATA.filter((row) => {
      const matchSearch = row.keyword.toLowerCase().includes(search.toLowerCase());
      const matchMatch = matchFilter === 'all' || row.matchType === matchFilter;
      const matchStatus = statusFilter === 'all' || row.status === statusFilter;
      return matchSearch && matchMatch && matchStatus;
    });
  }, [search, matchFilter, statusFilter]);

  return (
    <div className="flex-1 px-6 py-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#202124] tracking-tight">Keywords</h1>
        <p className="text-sm text-[#5F6368] mt-0.5">Discover, track and optimise keywords driving traffic to your campaigns</p>
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

        {/* Match type filter */}
        <div className="flex items-center gap-1 rounded-lg border border-[#E3E8EF] bg-white p-1">
          {(['all', 'Exact', 'Phrase', 'Broad'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMatchFilter(m)}
              className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors ${
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
          {(['all', 'active', 'paused'] as const).map((s) => (
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

        <span className="ml-auto text-[12px] text-[#9AA0A6]">{filtered.length} keyword{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#E3E8EF] bg-white overflow-hidden">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-[#E3E8EF] bg-[#FAFAFA]">
              <th className="px-4 py-2.5 text-left font-semibold text-[#5F6368]">Keyword</th>
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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-[#9AA0A6]">
                  No keywords match your search.
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
                  <td className="px-4 py-3 font-medium text-[#202124]">{row.keyword}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded px-1.5 py-0.5 text-[10.5px] font-semibold ${MATCH_STYLES[row.matchType].bg} ${MATCH_STYLES[row.matchType].text}`}>
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

      {/* Summary footer */}
      {filtered.length > 0 && (
        <div className="mt-3 flex items-center gap-6 px-1 text-[11.5px] text-[#9AA0A6]">
          <span>Avg CTR: <span className="font-medium text-[#5F6368]">{formatPercent(filtered.reduce((s, r) => s + r.ctr, 0) / filtered.length)}</span></span>
          <span>Avg CPC: <span className="font-medium text-[#5F6368]">{formatCurrency(filtered.reduce((s, r) => s + r.avgCpc, 0) / filtered.length)}</span></span>
          <span>Avg Quality Score: <span className="font-medium text-[#5F6368]">{(filtered.reduce((s, r) => s + r.qualityScore, 0) / filtered.length).toFixed(1)}</span></span>
        </div>
      )}
    </div>
  );
}
