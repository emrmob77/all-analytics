'use client';

import { MetricCard } from '@/components/ui/metric-card';
import type { DashboardMetrics } from '@/lib/actions/dashboard';

interface MetricCardsProps {
  data?: DashboardMetrics | null;
  loading?: boolean;
}

export function MetricCards({ data, loading = false }: MetricCardsProps) {
  const cards = [
    { title: 'Total Impressions', value: data?.totalImpressions ?? 0, change: data?.impressionsChange ?? undefined, format: 'number' as const, delay: 0 },
    { title: 'Total Clicks', value: data?.totalClicks ?? 0, change: data?.clicksChange ?? undefined, format: 'number' as const, delay: 70 },
    { title: 'Total Spend', value: data?.totalSpend ?? 0, change: data?.spendChange ?? undefined, format: 'currency' as const, prefix: data?.currencySymbol, delay: 140 },
    { title: 'Total Revenue', value: data?.totalRevenue ?? 0, change: data?.revenueChange ?? undefined, format: 'currency' as const, prefix: data?.currencySymbol, delay: 210 },
    { title: 'Avg. CPC', value: data?.avgCpc ?? 0, change: data?.cpcChange ?? undefined, format: 'currency' as const, prefix: data?.currencySymbol, decimals: 2, delay: 280 },
    { title: 'Avg. CTR', value: data?.avgCtr ?? 0, change: data?.ctrChange ?? undefined, format: 'percentage' as const, delay: 350 },
    { title: 'Conversions', value: data?.totalConversions ?? 0, change: data?.conversionsChange ?? undefined, format: 'number' as const, delay: 420 },
    { title: 'CPA', value: data?.cpa ?? 0, change: data?.cpaChange ?? undefined, format: 'currency' as const, prefix: data?.currencySymbol, decimals: 2, delay: 490 },
    { title: 'Avg. ROAS', value: data?.avgRoas ?? 0, change: data?.roasChange ?? undefined, format: 'number' as const, decimals: 2, suffix: 'x', delay: 560 },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {cards.map((card) => (
        <MetricCard key={card.title} {...card} loading={loading} />
      ))}
    </div>
  );
}
