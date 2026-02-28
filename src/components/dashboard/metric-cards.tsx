'use client';

import { useEffect, useMemo, useState } from 'react';
import { MetricCard } from '@/components/ui/metric-card';
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
import type { DashboardMetrics } from '@/lib/actions/dashboard';
import type { MetricCardProps } from '@/components/ui/metric-card';
import { cn } from '@/lib/utils';

interface MetricCardsProps {
  data?: DashboardMetrics | null;
  loading?: boolean;
}

type MetricKey =
  | 'impressions'
  | 'clicks'
  | 'sessions'
  | 'transactions'
  | 'spend'
  | 'revenue'
  | 'cpc'
  | 'cps'
  | 'cpm'
  | 'ctr'
  | 'conversions'
  | 'cvr'
  | 'sessionCvr'
  | 'cpa'
  | 'roas'
  | 'aov'
  | 'profit'
  | 'margin';

type CardDefinition = Omit<MetricCardProps, 'loading' | 'delay'> & {
  key: MetricKey;
  category: 'Volume' | 'Cost' | 'Efficiency' | 'Business';
};

const STORAGE_KEY = 'dashboard:metric-layout:v1';

const ALL_METRICS: MetricKey[] = [
  'sessions',
  'transactions',
  'spend',
  'revenue',
  'impressions',
  'clicks',
  'cps',
  'ctr',
  'cpc',
  'cpm',
  'conversions',
  'cvr',
  'sessionCvr',
  'cpa',
  'roas',
  'aov',
  'profit',
  'margin',
];

const DEFAULT_VISIBLE: MetricKey[] = [
  'sessions',
  'transactions',
  'impressions',
  'clicks',
  'spend',
  'revenue',
  'cps',
  'cpc',
  'sessionCvr',
  'roas'
];

function sanitizeKeys(input: unknown): MetricKey[] {
  if (!Array.isArray(input)) return [];
  const valid = new Set<MetricKey>(ALL_METRICS);
  const unique = new Set<MetricKey>();

  for (const item of input) {
    if (typeof item !== 'string') continue;
    if (!valid.has(item as MetricKey)) continue;
    unique.add(item as MetricKey);
  }

  return [...unique];
}

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr;
  const next = [...arr];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function buildMetricMap(data?: DashboardMetrics | null): Record<MetricKey, CardDefinition> {
  const currency = data?.currencySymbol;

  return {
    impressions: {
      key: 'impressions',
      title: 'Total Impressions',
      value: data?.totalImpressions ?? 0,
      change: data?.impressionsChange ?? undefined,
      format: 'number',
      category: 'Volume',
    },
    clicks: {
      key: 'clicks',
      title: 'Total Clicks',
      value: data?.totalClicks ?? 0,
      change: data?.clicksChange ?? undefined,
      format: 'number',
      category: 'Volume',
    },
    sessions: {
      key: 'sessions',
      title: 'Sessions (Estimated)',
      value: data?.totalClicks ?? 0,
      change: data?.clicksChange ?? undefined,
      format: 'number',
      category: 'Volume',
    },
    transactions: {
      key: 'transactions',
      title: 'Transactions (Estimated)',
      value: data?.totalConversions ?? 0,
      change: data?.conversionsChange ?? undefined,
      format: 'number',
      category: 'Business',
    },
    spend: {
      key: 'spend',
      title: 'Total Spend',
      value: data?.totalSpend ?? 0,
      change: data?.spendChange ?? undefined,
      format: 'currency',
      prefix: currency,
      category: 'Cost',
    },
    revenue: {
      key: 'revenue',
      title: 'Total Revenue',
      value: data?.totalRevenue ?? 0,
      change: data?.revenueChange ?? undefined,
      format: 'currency',
      prefix: currency,
      category: 'Business',
    },
    cpc: {
      key: 'cpc',
      title: 'Avg. CPC',
      value: data?.avgCpc ?? 0,
      change: data?.cpcChange ?? undefined,
      format: 'currency',
      prefix: currency,
      decimals: 2,
      category: 'Cost',
    },
    cps: {
      key: 'cps',
      title: 'Cost / Session (Estimated)',
      value: data?.avgCpc ?? 0,
      change: data?.cpcChange ?? undefined,
      format: 'currency',
      prefix: currency,
      decimals: 2,
      category: 'Cost',
    },
    cpm: {
      key: 'cpm',
      title: 'CPM',
      value: data?.avgCpm ?? 0,
      change: data?.cpmChange ?? undefined,
      format: 'currency',
      prefix: currency,
      decimals: 2,
      category: 'Cost',
    },
    ctr: {
      key: 'ctr',
      title: 'Avg. CTR',
      value: data?.avgCtr ?? 0,
      change: data?.ctrChange ?? undefined,
      format: 'percentage',
      category: 'Efficiency',
    },
    conversions: {
      key: 'conversions',
      title: 'Conversions',
      value: data?.totalConversions ?? 0,
      change: data?.conversionsChange ?? undefined,
      format: 'number',
      category: 'Business',
    },
    cvr: {
      key: 'cvr',
      title: 'CVR',
      value: data?.cvr ?? 0,
      change: data?.cvrChange ?? undefined,
      format: 'percentage',
      category: 'Efficiency',
    },
    sessionCvr: {
      key: 'sessionCvr',
      title: 'Session Conv. Rate (Estimated)',
      value: data?.cvr ?? 0,
      change: data?.cvrChange ?? undefined,
      format: 'percentage',
      category: 'Efficiency',
    },
    cpa: {
      key: 'cpa',
      title: 'CPA',
      value: data?.cpa ?? 0,
      change: data?.cpaChange ?? undefined,
      format: 'currency',
      prefix: currency,
      decimals: 2,
      category: 'Cost',
    },
    roas: {
      key: 'roas',
      title: 'Avg. ROAS',
      value: data?.avgRoas ?? 0,
      change: data?.roasChange ?? undefined,
      format: 'number',
      decimals: 2,
      suffix: 'x',
      category: 'Efficiency',
    },
    aov: {
      key: 'aov',
      title: 'AOV',
      value: data?.aov ?? 0,
      change: data?.aovChange ?? undefined,
      format: 'currency',
      prefix: currency,
      decimals: 2,
      category: 'Business',
    },
    profit: {
      key: 'profit',
      title: 'Gross Profit',
      value: data?.profit ?? 0,
      change: data?.profitChange ?? undefined,
      format: 'currency',
      prefix: currency,
      category: 'Business',
    },
    margin: {
      key: 'margin',
      title: 'Profit Margin',
      value: data?.margin ?? 0,
      change: data?.marginChange ?? undefined,
      format: 'percentage',
      category: 'Business',
    },
  };
}

export function MetricCards({ data, loading = false }: MetricCardsProps) {
  const [order, setOrder] = useState<MetricKey[]>(ALL_METRICS);
  const [visible, setVisible] = useState<MetricKey[]>(DEFAULT_VISIBLE);
  const [draggingKey, setDraggingKey] = useState<MetricKey | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setReady(true);
        return;
      }

      const parsed = JSON.parse(raw) as { order?: unknown; visible?: unknown };
      const savedOrder = sanitizeKeys(parsed.order);
      const savedVisible = sanitizeKeys(parsed.visible);

      if (savedOrder.length > 0) setOrder(savedOrder);
      if (savedVisible.length > 0) setVisible(savedVisible);
    } catch {
      // ignore parse/storage issues and keep defaults
    } finally {
      setReady(true);
    }
  }, []);

  const normalizedOrder = useMemo(() => {
    const seen = new Set(order);
    const missing = ALL_METRICS.filter((metric) => !seen.has(metric));
    return [...order, ...missing];
  }, [order]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          order: normalizedOrder,
          visible,
        }),
      );
    } catch {
      // no-op
    }
  }, [ready, normalizedOrder, visible]);

  const metricMap = useMemo(() => buildMetricMap(data), [data]);

  const cards = useMemo(() => {
    const visibleSet = new Set(visible);
    return normalizedOrder
      .filter((key) => visibleSet.has(key))
      .map((key, idx) => ({ ...metricMap[key], delay: idx * 50 }));
  }, [metricMap, normalizedOrder, visible]);

  const handleToggleMetric = (key: MetricKey, checked: boolean) => {
    if (!checked) {
      const selectedCount = visible.length;
      if (selectedCount <= 1) {
        toast.error('At least one metric card must stay visible.');
        return;
      }
      setVisible((prev) => prev.filter((item) => item !== key));
      return;
    }

    setVisible((prev) => (prev.includes(key) ? prev : [...prev, key]));
  };

  const handleDrop = (target: MetricKey) => {
    if (!draggingKey || draggingKey === target) return;
    setOrder((prev) => {
      const from = prev.indexOf(draggingKey);
      const to = prev.indexOf(target);
      return moveItem(prev, from, to);
    });
    setDraggingKey(null);
  };

  const resetLayout = () => {
    setOrder(ALL_METRICS);
    setVisible(DEFAULT_VISIBLE);
    toast.success('Metric layout reset to default.');
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[11.5px] text-[#5F6368]">Kartları sürükleyip bırakarak sıralayabilirsiniz.</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-[#E3E8EF] bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-[#5F6368] hover:bg-[#F8FAFC]"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Customize
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Visible Metrics</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {normalizedOrder.map((key) => {
              const metric = metricMap[key];
              return (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={visible.includes(key)}
                  onSelect={(event) => event.preventDefault()}
                  onCheckedChange={(checked) => handleToggleMetric(key, checked === true)}
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span>{metric.title}</span>
                    <span className="text-[10px] uppercase tracking-wide text-[#9AA0A6]">{metric.category}</span>
                  </span>
                </DropdownMenuCheckboxItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={resetLayout}>
              Reset layout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        {cards.map((card) => (
          <div
            key={card.key}
            draggable
            onDragStart={() => setDraggingKey(card.key)}
            onDragEnd={() => setDraggingKey(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(card.key)}
            className={cn(
              'cursor-move rounded-[10px] transition-all',
              draggingKey === card.key && 'opacity-60 ring-2 ring-[#1A73E8]/20',
            )}
          >
            <MetricCard
              title={card.title}
              value={card.value}
              change={card.change}
              format={card.format}
              decimals={card.decimals}
              suffix={card.suffix}
              prefix={card.prefix}
              sub={card.sub}
              delay={card.delay}
              loading={loading || !ready}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
