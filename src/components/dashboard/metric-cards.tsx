'use client';

import { MetricCard } from '@/components/ui/metric-card';

interface MetricCardsProps {
  loading?: boolean;
}

const STATS = [
  { label: 'Total Impressions', value: 5962000, change: 12.4, delay: 0 },
  { label: 'Total Clicks',      value: 105300,  change: 8.7,  delay: 70 },
  { label: 'Total Spend',       value: 10471,   change: 5.2,  prefix: '$', delay: 140 },
  { label: 'Avg. CTR',          value: 1.77,    change: 0.3,  suffix: '%', decimals: 2, delay: 210 },
  { label: 'Conversions',       value: 1722,    change: 18.1, delay: 280 },
  { label: 'Avg. ROAS',         value: 4.58,    change: 2.1,  suffix: 'x', decimals: 2, delay: 350 },
];

export function MetricCards({ loading = false }: MetricCardsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {STATS.map(stat => (
        <MetricCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          prefix={stat.prefix}
          suffix={stat.suffix}
          decimals={stat.decimals}
          change={stat.change}
          loading={loading}
          delay={stat.delay}
        />
      ))}
    </div>
  );
}
