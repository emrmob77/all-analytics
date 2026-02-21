'use client';

import { PLATFORMS } from '@/types';
import { PlatformIcon } from '@/components/ui/platform-icons';
import { formatCurrency, formatNumber } from '@/lib/format';
import type { AdPlatform } from '@/types';
import type { DashboardPlatformSummary } from '@/lib/actions/dashboard';

interface PlatformSummaryProps {
  data?: DashboardPlatformSummary[];
  loading?: boolean;
}

function SkeletonCard() {
  return (
    <div className="flex-[1_1_190px] min-w-0 rounded-[9px] border border-[#E3E8EF] px-4 py-3.5 animate-pulse">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-3.5 w-3.5 rounded bg-[#F1F3F4]" />
        <div className="h-3 w-20 rounded bg-[#F1F3F4]" />
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="mb-1 h-2 w-10 rounded bg-[#F1F3F4]" />
            <div className="h-4 w-14 rounded bg-[#F1F3F4]" />
          </div>
        ))}
      </div>
      <div className="h-[5px] rounded-[3px] bg-[#F1F3F4]" />
    </div>
  );
}

export function PlatformSummary({ data = [], loading = false }: PlatformSummaryProps) {
  return (
    <div className="rounded-[10px] border border-[#E3E8EF] bg-white px-5 py-[18px]">
      <div className="mb-4 text-sm font-semibold text-[#202124]">Platform Summary</div>

      <div className="flex flex-wrap gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : PLATFORMS.filter(p => p.id !== 'all').map(platform => {
              const summary = data.find(d => d.platform === platform.id);
              const spend       = summary?.spend       ?? 0;
              const impressions = summary?.impressions  ?? 0;
              const conversions = summary?.conversions  ?? 0;
              const roas        = summary?.roas         ?? 0;
              const pct         = summary?.budgetShare  ?? 0;

              return (
                <div
                  key={platform.id}
                  className="flex-[1_1_190px] min-w-0 rounded-[9px] border px-4 py-3.5"
                  style={{ borderColor: `${platform.color}30`, backgroundColor: platform.bgColor }}
                >
                  <div className="mb-3 flex items-center gap-[7px]">
                    <PlatformIcon platform={platform.id as AdPlatform} size={14} />
                    <span className="text-[13px] font-semibold text-[#202124]">{platform.label}</span>
                  </div>

                  <div className="mb-3 grid grid-cols-2 gap-2">
                    {[
                      ['Spend',  formatCurrency(spend)],
                      ['Conv.',  formatNumber(conversions)],
                      ['Impr.',  formatNumber(impressions)],
                      ['ROAS',   roas > 0 ? `${roas.toFixed(1)}x` : '—'],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div className="text-[9.5px] text-[#9AA0A6]">{label}</div>
                        <div className="mt-0.5 text-sm font-bold text-[#202124]">{value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mb-[5px] flex justify-between text-[10.5px] text-[#9AA0A6]">
                    <span>Budget share</span>
                    <span className="font-semibold" style={{ color: platform.color }}>{pct}%</span>
                  </div>
                  <div className="h-[5px] overflow-hidden rounded-[3px] bg-white">
                    <div
                      className="h-full rounded-[3px] transition-all duration-1000"
                      style={{ width: `${pct}%`, backgroundColor: platform.color }}
                    />
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
