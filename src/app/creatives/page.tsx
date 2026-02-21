'use client';

import { useState, useMemo } from 'react';
import { PlatformIcon } from '@/components/ui/platform-icons';
import { formatNumber, formatPercent, formatInteger } from '@/lib/format';
import type { AdPlatform } from '@/types';

type AdType = 'Responsive' | 'Image Ad' | 'Video Ad' | 'Carousel';
type CreativeStatus = 'active' | 'paused';

interface CreativeCard {
  id: string;
  type: AdType;
  platform: AdPlatform;
  status: CreativeStatus;
  headline: string;
  description: string;
  impressions: number;
  ctr: number;
  conversions: number;
}

const DEMO_DATA: CreativeCard[] = [
  {
    id: '1', type: 'Responsive', platform: 'google', status: 'active',
    headline: 'Summer Sale — Up to 50% Off',
    description: 'Shop top brands at unbeatable prices. Free delivery on orders over $50.',
    impressions: 84000, ctr: 5.2, conversions: 420,
  },
  {
    id: '2', type: 'Image Ad', platform: 'meta', status: 'active',
    headline: 'New Collection Arrivals',
    description: 'Discover the latest styles before they sell out. Limited stock available.',
    impressions: 210000, ctr: 2.8, conversions: 680,
  },
  {
    id: '3', type: 'Video Ad', platform: 'tiktok', status: 'active',
    headline: 'See How It Works in 15s',
    description: 'Watch our viral unboxing video. Join 2M+ happy customers.',
    impressions: 520000, ctr: 1.9, conversions: 340,
  },
  {
    id: '4', type: 'Carousel', platform: 'meta', status: 'active',
    headline: 'Shop by Category',
    description: 'Explore Running, Training, Lifestyle and more.',
    impressions: 156000, ctr: 3.1, conversions: 890,
  },
  {
    id: '5', type: 'Image Ad', platform: 'pinterest', status: 'active',
    headline: 'Pin Your Style',
    description: 'Save your favourites and shop whenever you\'re ready.',
    impressions: 48000, ctr: 1.7, conversions: 120,
  },
  {
    id: '6', type: 'Responsive', platform: 'google', status: 'paused',
    headline: 'Free Shipping This Weekend',
    description: 'Limited time offer. Don\'t miss out on free express delivery.',
    impressions: 32000, ctr: 4.8, conversions: 190,
  },
  {
    id: '7', type: 'Video Ad', platform: 'meta', status: 'active',
    headline: 'Before & After Results',
    description: 'Real customers, real results. Shop the collection today.',
    impressions: 340000, ctr: 2.4, conversions: 560,
  },
  {
    id: '8', type: 'Image Ad', platform: 'tiktok', status: 'active',
    headline: 'Trending Now on TikTok',
    description: 'The shoes everyone\'s talking about. Get yours before they\'re gone.',
    impressions: 180000, ctr: 1.6, conversions: 210,
  },
  {
    id: '9', type: 'Carousel', platform: 'google', status: 'active',
    headline: 'Top Picks for You',
    description: 'Personalised recommendations based on your browsing.',
    impressions: 62000, ctr: 6.1, conversions: 480,
  },
];

const TYPE_STYLES: Record<AdType, { bg: string; text: string; icon: string }> = {
  Responsive: { bg: 'bg-[#E8F0FE]', text: 'text-[#1A73E8]',  icon: 'R' },
  'Image Ad': { bg: 'bg-[#E6F4EA]', text: 'text-[#137333]',  icon: 'I' },
  'Video Ad': { bg: 'bg-[#FCE8E6]', text: 'text-[#C5221F]',  icon: 'V' },
  Carousel:   { bg: 'bg-[#FEF0E6]', text: 'text-[#B06000]',  icon: 'C' },
};

const STATUS_STYLES: Record<CreativeStatus, string> = {
  active: 'bg-[#E6F4EA] text-[#137333]',
  paused: 'bg-[#FEF3CD] text-[#92640D]',
};

const PLATFORM_LABELS: Record<string, string> = {
  google: 'Google', meta: 'Meta', tiktok: 'TikTok', pinterest: 'Pinterest',
};

const PLATFORM_OPTIONS = ['all', 'google', 'meta', 'tiktok', 'pinterest'] as const;
type PlatformFilter = typeof PLATFORM_OPTIONS[number];

// Placeholder creative thumbnail
function CreativeThumbnail({ type, platform }: { type: AdType; platform: AdPlatform }) {
  const style = TYPE_STYLES[type];
  return (
    <div className={`h-28 rounded-lg flex flex-col items-center justify-center gap-2 mb-3 ${style.bg}`}>
      <PlatformIcon platform={platform} size={20} />
      <span className={`text-[10px] font-semibold uppercase tracking-wide ${style.text}`}>{type}</span>
    </div>
  );
}

export default function CreativesPage() {
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const [typeFilter, setTypeFilter] = useState<AdType | 'all'>('all');

  const filtered = useMemo(() => {
    return DEMO_DATA.filter((c) => {
      const matchPlatform = platformFilter === 'all' || c.platform === platformFilter;
      const matchType = typeFilter === 'all' || c.type === typeFilter;
      return matchPlatform && matchType;
    });
  }, [platformFilter, typeFilter]);

  return (
    <div className="flex-1 px-6 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#202124] tracking-tight">Ads & Creatives</h1>
        <p className="text-sm text-[#5F6368] mt-0.5">Design, manage and A/B test your ad creatives across every platform</p>
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

        {/* Ad type filter */}
        <div className="flex items-center gap-1 rounded-lg border border-[#E3E8EF] bg-white p-1">
          {(['all', 'Responsive', 'Image Ad', 'Video Ad', 'Carousel'] as const).map((t) => (
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

        <span className="ml-auto text-[12px] text-[#9AA0A6]">{filtered.length} creative{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[#E3E8EF] bg-white py-16 text-center text-sm text-[#9AA0A6]">
          No creatives match the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((creative) => {
            const typeStyle = TYPE_STYLES[creative.type];
            return (
              <div
                key={creative.id}
                className="rounded-xl border border-[#E3E8EF] bg-white p-4 hover:border-[#1A73E8]/40 hover:shadow-sm transition-all"
              >
                {/* Thumbnail */}
                <CreativeThumbnail type={creative.type} platform={creative.platform} />

                {/* Header row: type badge + status */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-flex rounded px-1.5 py-0.5 text-[10.5px] font-semibold ${typeStyle.bg} ${typeStyle.text}`}>
                    {creative.type}
                  </span>
                  <span className={`inline-flex rounded px-1.5 py-0.5 text-[10.5px] font-semibold capitalize ${STATUS_STYLES[creative.status]}`}>
                    {creative.status}
                  </span>
                </div>

                {/* Platform */}
                <div className="flex items-center gap-1.5 mb-2">
                  <PlatformIcon platform={creative.platform} size={11} />
                  <span className="text-[11px] text-[#9AA0A6]">{PLATFORM_LABELS[creative.platform]}</span>
                </div>

                {/* Headline */}
                <div className="text-[13px] font-semibold text-[#202124] leading-snug mb-1 line-clamp-2">
                  {creative.headline}
                </div>

                {/* Description */}
                <div className="text-[11.5px] text-[#5F6368] leading-relaxed mb-3 line-clamp-2">
                  {creative.description}
                </div>

                {/* Performance row */}
                <div className="flex items-center gap-0 rounded-lg bg-[#FAFAFA] border border-[#E3E8EF] overflow-hidden">
                  <div className="flex-1 px-3 py-2 text-center border-r border-[#E3E8EF]">
                    <div className="text-[9.5px] font-semibold uppercase tracking-wide text-[#9AA0A6] mb-0.5">Impressions</div>
                    <div className="text-[12px] font-semibold text-[#202124] tabular-nums">{formatNumber(creative.impressions)}</div>
                  </div>
                  <div className="flex-1 px-3 py-2 text-center border-r border-[#E3E8EF]">
                    <div className="text-[9.5px] font-semibold uppercase tracking-wide text-[#9AA0A6] mb-0.5">CTR</div>
                    <div className={`text-[12px] font-semibold tabular-nums ${creative.ctr >= 4 ? 'text-[#137333]' : 'text-[#202124]'}`}>
                      {formatPercent(creative.ctr, 1)}
                    </div>
                  </div>
                  <div className="flex-1 px-3 py-2 text-center">
                    <div className="text-[9.5px] font-semibold uppercase tracking-wide text-[#9AA0A6] mb-0.5">Conv.</div>
                    <div className="text-[12px] font-semibold text-[#202124] tabular-nums">{formatInteger(creative.conversions)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
