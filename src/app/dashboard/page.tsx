'use client';

import { useEffect, useMemo, useState } from 'react';
import { addDays } from '@/lib/date';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { MetricCard, type MetricCardProps } from '@/components/ui/metric-card';
import { PerformanceChart } from '@/components/dashboard/performance-chart';
import { HourlyChart } from '@/components/dashboard/hourly-chart';
import { PlatformSummary } from '@/components/dashboard/platform-summary';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useDashboardBundle, useDashboardChartData } from '@/hooks/useDashboard';
import type { DateRange } from '@/components/ui/date-range-picker';
import type { AdPlatform } from '@/types';
import type {
  DashboardChartGranularity,
  DashboardChartMetric,
  DashboardMetrics,
} from '@/lib/actions/dashboard';

function defaultRange(): DateRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return { from: addDays(today, -29), to: today };
}

type ItemWidth = 'full' | 'wide' | 'half' | 'third' | 'quarter';

type MetricItemKey =
  | 'metric-sessions'
  | 'metric-transactions'
  | 'metric-impressions'
  | 'metric-clicks'
  | 'metric-spend'
  | 'metric-revenue'
  | 'metric-cps'
  | 'metric-cpc'
  | 'metric-cpm'
  | 'metric-ctr'
  | 'metric-conversions'
  | 'metric-cvr'
  | 'metric-session-cvr'
  | 'metric-cpa'
  | 'metric-roas'
  | 'metric-aov'
  | 'metric-profit'
  | 'metric-margin';

type WidgetItemKey = 'widget-performance' | 'widget-hourly' | 'widget-platform-summary';
type DashboardItemKey = MetricItemKey | WidgetItemKey;

interface ItemMeta {
  label: string;
  category: 'Metrics' | 'Charts' | 'Breakdown';
  defaultWidth: ItemWidth;
  widthOptions: ItemWidth[];
}

const LAYOUT_STORAGE_KEY = 'dashboard:canvas-layout:v1';

const WIDTH_CLASS: Record<ItemWidth, string> = {
  full: 'lg:col-span-12',
  wide: 'lg:col-span-8',
  half: 'lg:col-span-6',
  third: 'lg:col-span-4',
  quarter: 'lg:col-span-3',
};

const WIDTH_LABEL: Record<ItemWidth, string> = {
  full: 'Full',
  wide: 'Wide',
  half: 'Half',
  third: 'Third',
  quarter: 'Quarter',
};

const ALL_ITEMS: DashboardItemKey[] = [
  'metric-sessions',
  'metric-transactions',
  'metric-impressions',
  'metric-clicks',
  'metric-spend',
  'metric-revenue',
  'metric-cps',
  'metric-cpc',
  'metric-cpm',
  'metric-ctr',
  'metric-conversions',
  'metric-cvr',
  'metric-session-cvr',
  'metric-cpa',
  'metric-roas',
  'metric-aov',
  'metric-profit',
  'metric-margin',
  'widget-performance',
  'widget-hourly',
  'widget-platform-summary',
];

const DEFAULT_VISIBLE_ITEMS: DashboardItemKey[] = [
  'metric-sessions',
  'metric-transactions',
  'metric-spend',
  'metric-revenue',
  'metric-cpc',
  'metric-cpa',
  'metric-roas',
  'metric-cvr',
  'widget-performance',
  'widget-hourly',
  'widget-platform-summary',
];

const ITEM_META: Record<DashboardItemKey, ItemMeta> = {
  'metric-sessions': {
    label: 'Sessions (Estimated)',
    category: 'Metrics',
    defaultWidth: 'quarter',
    widthOptions: ['quarter', 'third', 'half'],
  },
  'metric-transactions': {
    label: 'Transactions (Estimated)',
    category: 'Metrics',
    defaultWidth: 'quarter',
    widthOptions: ['quarter', 'third', 'half'],
  },
  'metric-impressions': {
    label: 'Total Impressions',
    category: 'Metrics',
    defaultWidth: 'quarter',
    widthOptions: ['quarter', 'third', 'half'],
  },
  'metric-clicks': {
    label: 'Total Clicks',
    category: 'Metrics',
    defaultWidth: 'quarter',
    widthOptions: ['quarter', 'third', 'half'],
  },
  'metric-spend': {
    label: 'Total Spend',
    category: 'Metrics',
    defaultWidth: 'quarter',
    widthOptions: ['quarter', 'third', 'half'],
  },
  'metric-revenue': {
    label: 'Total Revenue',
    category: 'Metrics',
    defaultWidth: 'quarter',
    widthOptions: ['quarter', 'third', 'half'],
  },
  'metric-cps': {
    label: 'Cost / Session (Estimated)',
    category: 'Metrics',
    defaultWidth: 'quarter',
    widthOptions: ['quarter', 'third', 'half'],
  },
  'metric-cpc': {
    label: 'Avg. CPC',
    category: 'Metrics',
    defaultWidth: 'quarter',
    widthOptions: ['quarter', 'third', 'half'],
  },
  'metric-cpm': {
    label: 'CPM',
    category: 'Metrics',
    defaultWidth: 'quarter',
    widthOptions: ['quarter', 'third', 'half'],
  },
  'metric-ctr': {
    label: 'Avg. CTR',
    category: 'Metrics',
    defaultWidth: 'quarter',
    widthOptions: ['quarter', 'third', 'half'],
  },
  'metric-conversions': {
    label: 'Conversions',
    category: 'Metrics',
    defaultWidth: 'quarter',
    widthOptions: ['quarter', 'third', 'half'],
  },
  'metric-cvr': {
    label: 'CVR',
    category: 'Metrics',
    defaultWidth: 'quarter',
    widthOptions: ['quarter', 'third', 'half'],
  },
  'metric-session-cvr': {
    label: 'Session Conv. Rate (Estimated)',
    category: 'Metrics',
    defaultWidth: 'quarter',
    widthOptions: ['quarter', 'third', 'half'],
  },
  'metric-cpa': {
    label: 'CPA',
    category: 'Metrics',
    defaultWidth: 'quarter',
    widthOptions: ['quarter', 'third', 'half'],
  },
  'metric-roas': {
    label: 'Avg. ROAS',
    category: 'Metrics',
    defaultWidth: 'quarter',
    widthOptions: ['quarter', 'third', 'half'],
  },
  'metric-aov': {
    label: 'AOV',
    category: 'Metrics',
    defaultWidth: 'quarter',
    widthOptions: ['quarter', 'third', 'half'],
  },
  'metric-profit': {
    label: 'Gross Profit',
    category: 'Metrics',
    defaultWidth: 'quarter',
    widthOptions: ['quarter', 'third', 'half'],
  },
  'metric-margin': {
    label: 'Profit Margin',
    category: 'Metrics',
    defaultWidth: 'quarter',
    widthOptions: ['quarter', 'third', 'half'],
  },
  'widget-performance': {
    label: 'Performance Trend',
    category: 'Charts',
    defaultWidth: 'wide',
    widthOptions: ['full', 'wide', 'half', 'third'],
  },
  'widget-hourly': {
    label: 'CTR by Hour',
    category: 'Charts',
    defaultWidth: 'third',
    widthOptions: ['half', 'third', 'wide', 'full'],
  },
  'widget-platform-summary': {
    label: 'Platform Summary',
    category: 'Breakdown',
    defaultWidth: 'full',
    widthOptions: ['full', 'wide', 'half'],
  },
};

const DEFAULT_WIDTHS: Record<DashboardItemKey, ItemWidth> = ALL_ITEMS.reduce(
  (acc, key) => {
    acc[key] = ITEM_META[key].defaultWidth;
    return acc;
  },
  {} as Record<DashboardItemKey, ItemWidth>,
);

function sanitizeItemKeys(input: unknown): DashboardItemKey[] {
  if (!Array.isArray(input)) return [];
  const valid = new Set<DashboardItemKey>(ALL_ITEMS);
  const unique = new Set<DashboardItemKey>();

  for (const item of input) {
    if (typeof item !== 'string') continue;
    if (!valid.has(item as DashboardItemKey)) continue;
    unique.add(item as DashboardItemKey);
  }

  return [...unique];
}

function sanitizeItemWidths(input: unknown): Record<DashboardItemKey, ItemWidth> {
  const widths = { ...DEFAULT_WIDTHS };
  if (!input || typeof input !== 'object') return widths;

  const valid = new Set<ItemWidth>(['full', 'wide', 'half', 'third', 'quarter']);
  for (const key of ALL_ITEMS) {
    const candidate = (input as Record<string, unknown>)[key];
    if (typeof candidate !== 'string') continue;
    if (!valid.has(candidate as ItemWidth)) continue;
    widths[key] = candidate as ItemWidth;
  }

  return widths;
}

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr;
  const next = [...arr];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function buildMetricCards(data?: DashboardMetrics | null): Record<MetricItemKey, Omit<MetricCardProps, 'loading' | 'delay'>> {
  const currency = data?.currencySymbol;

  return {
    'metric-sessions': {
      title: 'Sessions (Estimated)',
      value: data?.totalClicks ?? 0,
      change: data?.clicksChange ?? undefined,
      format: 'number',
    },
    'metric-transactions': {
      title: 'Transactions (Estimated)',
      value: data?.totalConversions ?? 0,
      change: data?.conversionsChange ?? undefined,
      format: 'number',
    },
    'metric-impressions': {
      title: 'Total Impressions',
      value: data?.totalImpressions ?? 0,
      change: data?.impressionsChange ?? undefined,
      format: 'number',
    },
    'metric-clicks': {
      title: 'Total Clicks',
      value: data?.totalClicks ?? 0,
      change: data?.clicksChange ?? undefined,
      format: 'number',
    },
    'metric-spend': {
      title: 'Total Spend',
      value: data?.totalSpend ?? 0,
      change: data?.spendChange ?? undefined,
      format: 'currency',
      prefix: currency,
    },
    'metric-revenue': {
      title: 'Total Revenue',
      value: data?.totalRevenue ?? 0,
      change: data?.revenueChange ?? undefined,
      format: 'currency',
      prefix: currency,
    },
    'metric-cps': {
      title: 'Cost / Session (Estimated)',
      value: data?.avgCpc ?? 0,
      change: data?.cpcChange ?? undefined,
      format: 'currency',
      prefix: currency,
      decimals: 2,
    },
    'metric-cpc': {
      title: 'Avg. CPC',
      value: data?.avgCpc ?? 0,
      change: data?.cpcChange ?? undefined,
      format: 'currency',
      prefix: currency,
      decimals: 2,
    },
    'metric-cpm': {
      title: 'CPM',
      value: data?.avgCpm ?? 0,
      change: data?.cpmChange ?? undefined,
      format: 'currency',
      prefix: currency,
      decimals: 2,
    },
    'metric-ctr': {
      title: 'Avg. CTR',
      value: data?.avgCtr ?? 0,
      change: data?.ctrChange ?? undefined,
      format: 'percentage',
    },
    'metric-conversions': {
      title: 'Conversions',
      value: data?.totalConversions ?? 0,
      change: data?.conversionsChange ?? undefined,
      format: 'number',
    },
    'metric-cvr': {
      title: 'CVR',
      value: data?.cvr ?? 0,
      change: data?.cvrChange ?? undefined,
      format: 'percentage',
    },
    'metric-session-cvr': {
      title: 'Session Conv. Rate (Estimated)',
      value: data?.cvr ?? 0,
      change: data?.cvrChange ?? undefined,
      format: 'percentage',
    },
    'metric-cpa': {
      title: 'CPA',
      value: data?.cpa ?? 0,
      change: data?.cpaChange ?? undefined,
      format: 'currency',
      prefix: currency,
      decimals: 2,
    },
    'metric-roas': {
      title: 'Avg. ROAS',
      value: data?.avgRoas ?? 0,
      change: data?.roasChange ?? undefined,
      format: 'number',
      decimals: 2,
      suffix: 'x',
    },
    'metric-aov': {
      title: 'AOV',
      value: data?.aov ?? 0,
      change: data?.aovChange ?? undefined,
      format: 'currency',
      prefix: currency,
      decimals: 2,
    },
    'metric-profit': {
      title: 'Gross Profit',
      value: data?.profit ?? 0,
      change: data?.profitChange ?? undefined,
      format: 'currency',
      prefix: currency,
      decimals: 2,
    },
    'metric-margin': {
      title: 'Profit Margin',
      value: data?.margin ?? 0,
      change: data?.marginChange ?? undefined,
      format: 'percentage',
    },
  };
}

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange>(defaultRange);
  const [activePlatform, setActivePlatform] = useState<AdPlatform | 'all'>('all');
  const [chartMetric, setChartMetric] = useState<DashboardChartMetric>('impressions');
  const [chartGranularity, setChartGranularity] = useState<DashboardChartGranularity>('daily');
  const [itemOrder, setItemOrder] = useState<DashboardItemKey[]>(ALL_ITEMS);
  const [visibleItems, setVisibleItems] = useState<DashboardItemKey[]>(DEFAULT_VISIBLE_ITEMS);
  const [itemWidths, setItemWidths] = useState<Record<DashboardItemKey, ItemWidth>>(DEFAULT_WIDTHS);
  const [draggingItem, setDraggingItem] = useState<DashboardItemKey | null>(null);
  const [isLayoutMode, setIsLayoutMode] = useState(false);
  const [layoutReady, setLayoutReady] = useState(false);

  const bundleQ = useDashboardBundle(dateRange, activePlatform);
  const chartQ = useDashboardChartData(dateRange, chartMetric, chartGranularity);
  const bundle = bundleQ.data;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (!raw) {
        setLayoutReady(true);
        return;
      }

      const parsed = JSON.parse(raw) as {
        order?: unknown;
        visible?: unknown;
        widths?: unknown;
      };
      const savedOrder = sanitizeItemKeys(parsed.order);
      const savedVisible = sanitizeItemKeys(parsed.visible);
      const savedWidths = sanitizeItemWidths(parsed.widths);

      if (savedOrder.length > 0) setItemOrder(savedOrder);
      if (savedVisible.length > 0) setVisibleItems(savedVisible);
      setItemWidths(savedWidths);
    } catch {
      // Ignore malformed local storage
    } finally {
      setLayoutReady(true);
    }
  }, []);

  const normalizedOrder = useMemo(() => {
    const seen = new Set(itemOrder);
    const missing = ALL_ITEMS.filter((key) => !seen.has(key));
    return [...itemOrder, ...missing];
  }, [itemOrder]);

  useEffect(() => {
    if (!layoutReady) return;
    try {
      window.localStorage.setItem(
        LAYOUT_STORAGE_KEY,
        JSON.stringify({
          order: normalizedOrder,
          visible: visibleItems,
          widths: itemWidths,
        }),
      );
    } catch {
      // no-op
    }
  }, [layoutReady, normalizedOrder, visibleItems, itemWidths]);

  const orderedVisibleItems = useMemo(() => {
    const visibleSet = new Set(visibleItems);
    return normalizedOrder.filter((key) => visibleSet.has(key));
  }, [normalizedOrder, visibleItems]);

  const metricCards = useMemo(() => buildMetricCards(bundle?.metrics), [bundle?.metrics]);

  const toggleItem = (key: DashboardItemKey, checked: boolean) => {
    if (!checked) {
      if (visibleItems.length <= 1) {
        toast.error('At least one section must stay visible.');
        return;
      }
      setVisibleItems((prev) => prev.filter((item) => item !== key));
      return;
    }

    setVisibleItems((prev) => (prev.includes(key) ? prev : [...prev, key]));
  };

  const handleDropItem = (target: DashboardItemKey, source: DashboardItemKey | null) => {
    if (!source || source === target) return;
    setItemOrder((prev) => {
      const from = prev.indexOf(source);
      const to = prev.indexOf(target);
      return moveItem(prev, from, to);
    });
    setDraggingItem(null);
  };

  const cycleItemWidth = (key: DashboardItemKey) => {
    setItemWidths((prev) => {
      const options = ITEM_META[key].widthOptions;
      const current = prev[key] ?? ITEM_META[key].defaultWidth;
      const index = options.indexOf(current);
      const next = options[(index + 1) % options.length];
      toast.success(`${ITEM_META[key].label} width: ${WIDTH_LABEL[next]}`);
      return { ...prev, [key]: next };
    });
  };

  const resetLayout = () => {
    setItemOrder(ALL_ITEMS);
    setVisibleItems(DEFAULT_VISIBLE_ITEMS);
    setItemWidths(DEFAULT_WIDTHS);
    toast.success('Dashboard layout reset.');
  };

  const renderItem = (key: DashboardItemKey) => {
    if (key === 'widget-performance') {
      return (
        <PerformanceChart
          activePlatform={activePlatform}
          dateRange={dateRange}
          data={chartQ.data}
          loading={chartQ.isLoading}
          chartMetric={chartMetric}
          chartGranularity={chartGranularity}
          onChartMetricChange={setChartMetric}
          onChartGranularityChange={setChartGranularity}
        />
      );
    }

    if (key === 'widget-hourly') {
      return (
        <HourlyChart
          data={bundle?.hourlyData}
          loading={bundleQ.isLoading}
        />
      );
    }

    if (key === 'widget-platform-summary') {
      return (
        <PlatformSummary
          data={bundle?.platformSummary}
          loading={bundleQ.isLoading}
        />
      );
    }

    const card = metricCards[key as MetricItemKey];
    return (
      <MetricCard
        title={card.title}
        value={card.value}
        change={card.change}
        format={card.format}
        decimals={card.decimals}
        suffix={card.suffix}
        prefix={card.prefix}
        sub={card.sub}
        loading={bundleQ.isLoading}
      />
    );
  };

  return (
    <div className="flex-1 overflow-auto bg-[#F8F9FA]">
      <div className="mx-auto max-w-[1280px] px-6 py-6 lg:px-8">
        <DashboardHeader
          dateRange={dateRange}
          setDateRange={setDateRange}
          activePlatform={activePlatform}
          setActivePlatform={setActivePlatform}
        />

        <div className="mt-5 flex items-center justify-between gap-2">
          <p className="text-[11.5px] text-[#5F6368]">
            {isLayoutMode
              ? 'Drag sections to reorder. Use width controls in Customize Layout.'
              : 'Enable Edit Layout to rearrange cards and charts.'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsLayoutMode((prev) => !prev)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11.5px] font-medium transition-colors',
                isLayoutMode
                  ? 'border-[#1A73E8] bg-[#E8F0FE] text-[#1A73E8]'
                  : 'border-[#E3E8EF] bg-white text-[#5F6368] hover:bg-[#F8FAFC]',
              )}
            >
              {isLayoutMode ? 'Done' : 'Edit Layout'}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#E3E8EF] bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-[#5F6368] hover:bg-[#F8FAFC]"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Customize Layout
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Visible Sections</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {normalizedOrder.map((key) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={visibleItems.includes(key)}
                    onSelect={(event) => event.preventDefault()}
                    onCheckedChange={(checked) => toggleItem(key, checked === true)}
                  >
                    <span className="flex w-full items-center justify-between gap-2">
                      <span>{ITEM_META[key].label}</span>
                      <span className="text-[10px] uppercase tracking-wide text-[#9AA0A6]">
                        {ITEM_META[key].category}
                      </span>
                    </span>
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Section Width</DropdownMenuLabel>
                {normalizedOrder.map((key) => (
                  <DropdownMenuItem key={`${key}-width`} onSelect={() => cycleItemWidth(key)}>
                    <span className="flex w-full items-center justify-between gap-2">
                      <span>{ITEM_META[key].label}</span>
                      <span className="text-[10px] uppercase tracking-wide text-[#9AA0A6]">
                        {WIDTH_LABEL[itemWidths[key] ?? ITEM_META[key].defaultWidth]}
                      </span>
                    </span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={resetLayout}>Reset layout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 items-start gap-3.5 lg:grid-cols-12">
          {orderedVisibleItems.map((key) => (
            <section
              key={key}
              draggable={isLayoutMode}
              onDragStart={(event) => {
                if (!isLayoutMode) return;
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', key);
                setDraggingItem(key);
              }}
              onDragEnd={() => setDraggingItem(null)}
              onDragOver={(event) => {
                if (!isLayoutMode) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(event) => {
                if (!isLayoutMode) return;
                event.preventDefault();
                const sourceKey = event.dataTransfer.getData('text/plain') as DashboardItemKey | '';
                handleDropItem(key, sourceKey || draggingItem);
              }}
              className={cn(
                'relative min-w-0 self-start rounded-[10px] transition-all',
                isLayoutMode && 'cursor-move',
                WIDTH_CLASS[itemWidths[key] ?? ITEM_META[key].defaultWidth],
                draggingItem === key && 'opacity-60 ring-2 ring-[#1A73E8]/20',
              )}
            >
              {isLayoutMode && (
                <div className="absolute left-2 top-2 z-20 rounded-md border border-[#E3E8EF] bg-white/95 px-2 py-1 text-[10px] font-medium text-[#5F6368] shadow-sm">
                  Drag to move: {ITEM_META[key].label}
                </div>
              )}
              {renderItem(key)}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
