'use client';

import { useEffect, useMemo, useState } from 'react';
import { addDays } from '@/lib/date';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { MetricCards } from '@/components/dashboard/metric-cards';
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
import {
  useDashboardBundle,
  useDashboardChartData,
} from '@/hooks/useDashboard';
import type { DateRange } from '@/components/ui/date-range-picker';
import type { AdPlatform } from '@/types';
import type {
  DashboardChartGranularity,
  DashboardChartMetric,
} from '@/lib/actions/dashboard';

function defaultRange(): DateRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return { from: addDays(today, -29), to: today };
}

type WidgetKey = 'metrics' | 'performance' | 'hourly' | 'platformSummary';
type WidgetWidth = 'full' | 'wide' | 'half' | 'narrow';

const WIDGET_LAYOUT_KEY = 'dashboard:widget-layout:v2';

const ALL_WIDGETS: WidgetKey[] = ['metrics', 'performance', 'hourly', 'platformSummary'];

const WIDGET_META: Record<WidgetKey, { label: string; category: string }> = {
  metrics: {
    label: 'Metric Cards',
    category: 'Overview',
  },
  performance: {
    label: 'Performance Trend',
    category: 'Charts',
  },
  hourly: {
    label: 'CTR by Hour',
    category: 'Charts',
  },
  platformSummary: {
    label: 'Platform Summary',
    category: 'Breakdown',
  },
};

const WIDGET_WIDTH_CLASS: Record<WidgetWidth, string> = {
  full: 'lg:col-span-12',
  wide: 'lg:col-span-8',
  half: 'lg:col-span-6',
  narrow: 'lg:col-span-4',
};

const WIDGET_WIDTH_LABEL: Record<WidgetWidth, string> = {
  full: 'Full',
  wide: 'Wide',
  half: 'Half',
  narrow: 'Narrow',
};

const DEFAULT_WIDGET_WIDTHS: Record<WidgetKey, WidgetWidth> = {
  metrics: 'full',
  performance: 'wide',
  hourly: 'narrow',
  platformSummary: 'wide',
};

const WIDGET_WIDTH_ORDER: Record<WidgetKey, WidgetWidth[]> = {
  metrics: ['full', 'wide'],
  performance: ['wide', 'half', 'full'],
  hourly: ['narrow', 'half', 'wide', 'full'],
  platformSummary: ['wide', 'half', 'full'],
};

function sanitizeWidgetKeys(input: unknown): WidgetKey[] {
  if (!Array.isArray(input)) return [];
  const valid = new Set<WidgetKey>(ALL_WIDGETS);
  const unique = new Set<WidgetKey>();

  for (const item of input) {
    if (typeof item !== 'string') continue;
    if (!valid.has(item as WidgetKey)) continue;
    unique.add(item as WidgetKey);
  }

  return [...unique];
}

function sanitizeWidgetWidths(input: unknown): Record<WidgetKey, WidgetWidth> {
  const next: Record<WidgetKey, WidgetWidth> = { ...DEFAULT_WIDGET_WIDTHS };
  if (!input || typeof input !== 'object') return next;

  const validWidths = new Set<WidgetWidth>(['full', 'wide', 'half', 'narrow']);
  for (const key of ALL_WIDGETS) {
    const candidate = (input as Record<string, unknown>)[key];
    if (typeof candidate === 'string' && validWidths.has(candidate as WidgetWidth)) {
      next[key] = candidate as WidgetWidth;
    }
  }

  return next;
}

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr;
  const next = [...arr];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange>(defaultRange);
  const [activePlatform, setActivePlatform] = useState<AdPlatform | 'all'>('all');
  const [widgetOrder, setWidgetOrder] = useState<WidgetKey[]>(ALL_WIDGETS);
  const [visibleWidgets, setVisibleWidgets] = useState<WidgetKey[]>(ALL_WIDGETS);
  const [widgetWidths, setWidgetWidths] = useState<Record<WidgetKey, WidgetWidth>>(DEFAULT_WIDGET_WIDTHS);
  const [draggingWidget, setDraggingWidget] = useState<WidgetKey | null>(null);
  const [layoutReady, setLayoutReady] = useState(false);
  const [chartMetric, setChartMetric] = useState<DashboardChartMetric>('impressions');
  const [chartGranularity, setChartGranularity] = useState<DashboardChartGranularity>('daily');

  const bundleQ = useDashboardBundle(dateRange, activePlatform);
  const chartQ = useDashboardChartData(dateRange, chartMetric, chartGranularity);
  const bundle = bundleQ.data;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(WIDGET_LAYOUT_KEY);
      if (!raw) {
        setLayoutReady(true);
        return;
      }

      const parsed = JSON.parse(raw) as { order?: unknown; visible?: unknown; widths?: unknown };
      const savedOrder = sanitizeWidgetKeys(parsed.order);
      const savedVisible = sanitizeWidgetKeys(parsed.visible);
      const savedWidths = sanitizeWidgetWidths(parsed.widths);

      if (savedOrder.length > 0) setWidgetOrder(savedOrder);
      if (savedVisible.length > 0) setVisibleWidgets(savedVisible);
      setWidgetWidths(savedWidths);
    } catch {
      // ignore corrupted local storage values
    } finally {
      setLayoutReady(true);
    }
  }, []);

  const normalizedOrder = useMemo(() => {
    const seen = new Set(widgetOrder);
    const missing = ALL_WIDGETS.filter((key) => !seen.has(key));
    return [...widgetOrder, ...missing];
  }, [widgetOrder]);

  useEffect(() => {
    if (!layoutReady) return;
    try {
      window.localStorage.setItem(
        WIDGET_LAYOUT_KEY,
        JSON.stringify({
          order: normalizedOrder,
          visible: visibleWidgets,
          widths: widgetWidths,
        }),
      );
    } catch {
      // no-op
    }
  }, [layoutReady, normalizedOrder, visibleWidgets, widgetWidths]);

  const orderedVisibleWidgets = useMemo(() => {
    const visibleSet = new Set(visibleWidgets);
    return normalizedOrder.filter((key) => visibleSet.has(key));
  }, [normalizedOrder, visibleWidgets]);

  const toggleWidget = (key: WidgetKey, checked: boolean) => {
    if (!checked) {
      if (visibleWidgets.length <= 1) {
        toast.error('At least one dashboard widget must stay visible.');
        return;
      }
      setVisibleWidgets((prev) => prev.filter((item) => item !== key));
      return;
    }

    setVisibleWidgets((prev) => (prev.includes(key) ? prev : [...prev, key]));
  };

  const handleDropWidget = (target: WidgetKey) => {
    if (!draggingWidget || draggingWidget === target) return;
    setWidgetOrder((prev) => {
      const from = prev.indexOf(draggingWidget);
      const to = prev.indexOf(target);
      return moveItem(prev, from, to);
    });
    setDraggingWidget(null);
  };

  const cycleWidgetWidth = (key: WidgetKey) => {
    setWidgetWidths((prev) => {
      const sequence = WIDGET_WIDTH_ORDER[key];
      const current = prev[key] ?? DEFAULT_WIDGET_WIDTHS[key];
      const index = sequence.indexOf(current);
      const next = sequence[(index + 1) % sequence.length];
      toast.success(`${WIDGET_META[key].label} width: ${WIDGET_WIDTH_LABEL[next]}`);
      return { ...prev, [key]: next };
    });
  };

  const resetWidgetLayout = () => {
    setWidgetOrder(ALL_WIDGETS);
    setVisibleWidgets(ALL_WIDGETS);
    setWidgetWidths(DEFAULT_WIDGET_WIDTHS);
    toast.success('Dashboard layout reset to default.');
  };

  const renderWidget = (key: WidgetKey) => {
    switch (key) {
      case 'metrics':
        return (
          <MetricCards
            data={bundle?.metrics}
            loading={bundleQ.isLoading}
          />
        );
      case 'performance':
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
      case 'hourly':
        return (
          <HourlyChart
            data={bundle?.hourlyData}
            loading={bundleQ.isLoading}
          />
        );
      case 'platformSummary':
        return (
          <PlatformSummary
            data={bundle?.platformSummary}
            loading={bundleQ.isLoading}
          />
        );
      default:
        return null;
    }
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
          <p className="text-[11.5px] text-[#5F6368]">Drag and drop widgets to customize your dashboard layout.</p>
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
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Visible Widgets</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {normalizedOrder.map((key) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={visibleWidgets.includes(key)}
                  onSelect={(event) => event.preventDefault()}
                  onCheckedChange={(checked) => toggleWidget(key, checked === true)}
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span>{WIDGET_META[key].label}</span>
                    <span className="text-[10px] uppercase tracking-wide text-[#9AA0A6]">
                      {WIDGET_META[key].category}
                    </span>
                  </span>
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Widget Width</DropdownMenuLabel>
              {normalizedOrder.map((key) => (
                <DropdownMenuItem
                  key={`${key}-width`}
                  onSelect={() => cycleWidgetWidth(key)}
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span>{WIDGET_META[key].label}</span>
                    <span className="text-[10px] uppercase tracking-wide text-[#9AA0A6]">
                      {WIDGET_WIDTH_LABEL[widgetWidths[key] ?? DEFAULT_WIDGET_WIDTHS[key]]}
                    </span>
                  </span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={resetWidgetLayout}>Reset layout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3.5 lg:grid-cols-12">
          {orderedVisibleWidgets.map((key) => (
            <section
              key={key}
              draggable
              onDragStart={() => setDraggingWidget(key)}
              onDragEnd={() => setDraggingWidget(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDropWidget(key)}
              className={cn(
                'min-w-0 cursor-move rounded-[10px] transition-all',
                WIDGET_WIDTH_CLASS[widgetWidths[key] ?? DEFAULT_WIDGET_WIDTHS[key]],
                draggingWidget === key && 'opacity-60 ring-2 ring-[#1A73E8]/20',
              )}
            >
              {renderWidget(key)}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
