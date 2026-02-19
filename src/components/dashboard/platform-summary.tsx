'use client';

import { PLATFORMS, DEMO_CAMPAIGNS } from '@/types';
import { PlatformIcon } from '@/components/ui/platform-icons';
import type { AdPlatform } from '@/types';

export function PlatformSummary() {
  // Calculate totals per platform
  const platformData = PLATFORMS.filter(p => p.id !== 'all').map(platform => {
    const campaigns = DEMO_CAMPAIGNS.filter(c => c.platform === platform.id);
    const totalSpend = campaigns.reduce((a, c) => a + c.spend, 0);
    const totalConv = campaigns.reduce((a, c) => a + c.conversions, 0);
    const totalImpr = campaigns.reduce((a, c) => a + c.impressions, 0);
    const roasValues = campaigns.filter(c => c.roas > 0);
    const avgRoas = roasValues.length > 0
      ? (roasValues.reduce((a, c) => a + c.roas, 0) / roasValues.length).toFixed(1)
      : '—';

    return {
      ...platform,
      spend: totalSpend,
      conversions: totalConv,
      impressions: totalImpr,
      roas: avgRoas,
    };
  });

  const grandTotalSpend = platformData.reduce((a, p) => a + p.spend, 0);

  return (
    <div className="rounded-[10px] border border-[#E3E8EF] bg-white px-5 py-[18px]">
      <div className="mb-4 text-sm font-semibold text-[#202124]">Platform Summary</div>

      <div className="flex flex-wrap gap-3">
        {platformData.map((p) => {
          const pct = grandTotalSpend > 0 ? Math.round(p.spend / grandTotalSpend * 100) : 0;

          return (
            <div
              key={p.id}
              className="flex-[1_1_190px] min-w-0 rounded-[9px] border px-4 py-3.5"
              style={{
                borderColor: `${p.color}30`,
                backgroundColor: p.bgColor,
              }}
            >
              {/* Header */}
              <div className="mb-3 flex items-center gap-[7px]">
                <PlatformIcon platform={p.id as AdPlatform} size={14} />
                <span className="text-[13px] font-semibold text-[#202124]">{p.label}</span>
              </div>

              {/* Metrics Grid */}
              <div className="mb-3 grid grid-cols-2 gap-2">
                {[
                  ['Spend', `$${p.spend.toLocaleString()}`],
                  ['Conv.', p.conversions],
                  ['Impr.', `${(p.impressions / 1000).toFixed(0)}K`],
                  ['ROAS', `${p.roas}x`],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <div className="text-[9.5px] text-[#9AA0A6]">{label}</div>
                    <div className="mt-0.5 text-sm font-bold text-[#202124]">{value}</div>
                  </div>
                ))}
              </div>

              {/* Budget Share */}
              <div className="mb-[5px] flex justify-between text-[10.5px] text-[#9AA0A6]">
                <span>Budget share</span>
                <span className="font-semibold" style={{ color: p.color }}>{pct}%</span>
              </div>
              <div className="h-[5px] overflow-hidden rounded-[3px] bg-white">
                <div
                  className="h-full rounded-[3px] transition-all duration-1000"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: p.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
