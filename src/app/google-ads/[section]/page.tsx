'use client';

import { useState, use, useMemo } from 'react';
import { addDays } from '@/lib/date';
import { DateRangePicker, type DateRange } from '@/components/ui/date-range-picker';
import { SyncStatusIndicator } from '@/components/dashboard/SyncStatusIndicator';
import { MetricCard } from '@/components/ui/metric-card';
import { PerformanceChart } from '@/components/dashboard/performance-chart';
import { HourlyChart } from '@/components/dashboard/hourly-chart';
import { CampaignTable } from '@/components/dashboard/campaign-table';
import { useRole } from '@/hooks/useRole';
import {
  useDashboardMetrics,
  useDashboardCampaigns,
  useDashboardChartData,
  useDashboardHourlyData,
} from '@/hooks/useDashboard';
import {
  Search,
  Image,
  Video,
  ShoppingBag,
  Zap,
  LayoutTemplate,
  Smartphone
} from 'lucide-react'; // We use Lucide icons for distinctive page icons

function defaultRange(): DateRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return { from: addDays(today, -29), to: today };
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

const SECTION_CONFIG: Record<string, {
  title: string;
  sub: string;
  gradient: string;
  color: string;
  icon: any;
  priorityCards: string[];
}> = {
  'search': {
    title: 'Search Campaigns',
    sub: 'Drive action with intent-based text ads on Google Search results.',
    gradient: 'from-[#1A73E8]/10 via-transparent',
    color: '#1A73E8',
    icon: Search,
    priorityCards: ['clicks', 'ctr', 'conversions', 'roas', 'spend']
  },
  'display': {
    title: 'Display Campaigns',
    sub: 'Reach more customers with visually engaging ads across the web.',
    gradient: 'from-[#9333EA]/10 via-transparent',
    color: '#9333EA',
    icon: Image,
    priorityCards: ['impressions', 'clicks', 'ctr', 'spend', 'conversions']
  },
  'demand-gen': {
    title: 'Demand Gen',
    sub: 'Drive demand and conversions across YouTube, Discover, and Gmail.',
    gradient: 'from-[#D97706]/10 via-transparent',
    color: '#D97706',
    icon: LayoutTemplate,
    priorityCards: ['impressions', 'conversions', 'spend', 'roas']
  },
  'shopping': {
    title: 'Shopping Campaigns',
    sub: 'Promote your products directly in Google Search and Shopping tab.',
    gradient: 'from-[#059669]/10 via-transparent',
    color: '#059669',
    icon: ShoppingBag,
    priorityCards: ['roas', 'conversions', 'clicks', 'spend']
  },
  'performance-max': {
    title: 'Performance Max',
    sub: 'AI-powered campaigns driving performance across all Google channels.',
    gradient: 'from-[#0D9488]/10 via-transparent',
    color: '#0D9488',
    icon: Zap,
    priorityCards: ['conversions', 'roas', 'spend', 'impressions']
  },
  'video': {
    title: 'Video Campaigns',
    sub: 'Reach and engage viewers on YouTube and across the web.',
    gradient: 'from-[#DC2626]/10 via-transparent',
    color: '#DC2626',
    icon: Video,
    priorityCards: ['impressions', 'clicks', 'spend', 'conversions']
  },
  'app': {
    title: 'App Campaigns',
    sub: 'Drive app installs and in-app actions across Google\'s largest properties.',
    gradient: 'from-[#2563EB]/10 via-transparent',
    color: '#2563EB',
    icon: Smartphone,
    priorityCards: ['conversions', 'clicks', 'spend', 'impressions', 'roas']
  },
};

function filterCampaignsByNetworkMock(data: any[] | undefined, sectionText: string) {
  if (!data) return [];
  const lowerSec = sectionText.toLowerCase();

  let keyword = lowerSec;
  if (lowerSec.includes('performance max')) keyword = 'pmax';
  if (lowerSec.includes('demand')) keyword = 'demand';

  const matches = data.filter(c => c.name.toLowerCase().includes(keyword));
  return matches.length > 0 ? matches : data;
}

export default function GoogleAdsSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = use(params);

  const config = SECTION_CONFIG[section] || {
    title: section.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    sub: 'Overview for ' + section,
    gradient: 'from-[#1A73E8]/10 via-transparent',
    color: '#1A73E8',
    icon: Search,
    priorityCards: ['impressions', 'clicks', 'spend', 'conversions', 'roas', 'ctr']
  };

  const [dateRange, setDateRange] = useState<DateRange>(defaultRange);
  const activePlatform = 'google';

  const metricsQ = useDashboardMetrics(dateRange, activePlatform);
  const campaignsQ = useDashboardCampaigns(dateRange, activePlatform);
  const chartQ = useDashboardChartData(dateRange);
  const hourlyQ = useDashboardHourlyData();

  // Filter campaigns roughly to simulate section specificity
  const filteredCampaigns = filterCampaignsByNetworkMock(campaignsQ.data, config.title);

  const activePreset = detectQuickPreset(dateRange);
  const { isAdmin } = useRole();
  const Icon = config.icon;

  const allCards = useMemo(() => {
    const data = metricsQ.data;
    const cardsMap: Record<string, any> = {
      impressions: { title: 'Impressions', value: data?.totalImpressions ?? 0, change: data?.impressionsChange ?? undefined, format: 'number' as const },
      clicks: { title: 'Clicks', value: data?.totalClicks ?? 0, change: data?.clicksChange ?? undefined, format: 'number' as const },
      spend: { title: 'Spend', value: data?.totalSpend ?? 0, change: data?.spendChange ?? undefined, format: 'currency' as const, prefix: data?.currencySymbol },
      ctr: { title: 'Avg. CTR', value: data?.avgCtr ?? 0, change: data?.ctrChange ?? undefined, format: 'percentage' as const },
      conversions: { title: 'Conversions', value: data?.totalConversions ?? 0, change: data?.conversionsChange ?? undefined, format: 'number' as const },
      roas: { title: 'Avg. ROAS', value: data?.avgRoas ?? 0, change: data?.roasChange ?? undefined, format: 'number' as const, decimals: 2, suffix: 'x' },
    };

    // Select configured priority cards for this section
    return config.priorityCards.map((key) => cardsMap[key]).filter(Boolean);
  }, [config.priorityCards, metricsQ.data]);

  return (
    <div className="flex-1 overflow-auto bg-[#F8F9FA]">

      {/* Decorative Header Block */}
      <div className={`border-b border-[#E3E8EF] px-6 pb-6 pt-8 lg:px-8 bg-gradient-to-b ${config.gradient}`}>
        <div className="mx-auto max-w-[1280px]">
          <div className="flex flex-col gap-6 md:flex-row md:items-end justify-between">
            <div>
              <div className="flex items-center gap-3.5 mb-2.5">
                <div
                  className="flex h-[42px] w-[42px] items-center justify-center rounded-[10px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#E3E8EF]/50"
                  style={{ color: config.color }}
                >
                  <Icon size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className="text-[26px] font-bold tracking-[-0.4px] text-[#202124] leading-tight">
                    {config.title}
                  </h1>
                </div>
              </div>
              <p className="text-[13px] text-[#5F6368] mb-4">
                {config.sub}
              </p>
              <SyncStatusIndicator isAdmin={isAdmin} />
            </div>

            <div className="flex flex-wrap items-center gap-3 pb-1">
              <div className="flex overflow-hidden rounded-[9px] border border-[#E3E8EF] bg-white shadow-sm">
                {(['7d', '30d', '90d'] as QuickPreset[]).map((d, i) => (
                  <button
                    key={d}
                    onClick={() => setDateRange(makeRange(d))}
                    className={`px-[13px] py-1.5 text-xs font-medium transition-colors ${i > 0 ? 'border-l border-[#E3E8EF]' : ''
                      } ${activePreset === d
                        ? 'bg-[#E8F0FE] text-[#1A73E8]'
                        : 'bg-white text-[#5F6368] hover:bg-gray-50'
                      }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <div className="shadow-sm rounded-[9px] bg-white inline-block">
                <DateRangePicker value={dateRange} onChange={setDateRange} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Body */}
      <div className="mx-auto max-w-[1280px] px-6 py-6 lg:px-8">

        {/* Dynamic Metrics */}
        <div className="flex flex-wrap gap-3 mb-6">
          {allCards.map((card, idx) => (
            <MetricCard
              key={card.title}
              {...card}
              loading={metricsQ.isLoading}
              delay={idx * 70}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-3.5 mb-5">
          <PerformanceChart
            activePlatform={activePlatform}
            dateRange={dateRange}
            data={chartQ.data}
            loading={chartQ.isLoading}
          />
          <HourlyChart
            data={hourlyQ.data}
            loading={hourlyQ.isLoading}
          />
        </div>

        <div>
          <CampaignTable
            activePlatform={activePlatform}
            data={filteredCampaigns}
            loading={campaignsQ.isLoading}
          />
        </div>
      </div>
    </div>
  );
}
