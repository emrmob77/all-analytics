'use client';

import { MetricCard } from '@/components/ui/metric-card';

const STATS: React.ComponentProps<typeof MetricCard>[] = [
  { title: 'Total Impressions', value: 5962000,  change: 12.4,  format: 'number',     delay: 0   },
  { title: 'Total Clicks',      value: 105300,   change: 8.7,   format: 'number',     delay: 70  },
  { title: 'Total Spend',       value: 10471,    change: 5.2,   format: 'currency',   delay: 140 },
  { title: 'Avg. CTR',          value: 1.77,     change: 0.3,   format: 'percentage', delay: 210 },
  { title: 'Conversions',       value: 1722,     change: 18.1,  format: 'number',     delay: 280 },
  { title: 'Avg. ROAS',         value: 4.58,     change: 2.1,   format: 'number',     decimals: 2, suffix: 'x', delay: 350 },
];

export function MetricCards({ loading = false }: { loading?: boolean }) {
  return (
    <div className="flex flex-wrap gap-3">
      {STATS.map((stat) => (
        <MetricCard key={stat.title} {...stat} loading={loading} />
      ))}
    </div>
  );
}
