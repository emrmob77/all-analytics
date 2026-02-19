'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  positive?: boolean;
}

function MetricCard({ title, value, change, positive = true }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
        <p className={cn(
          'mt-1 text-xs font-medium',
          positive ? 'text-green-600' : 'text-red-600'
        )}>
          {positive ? '↑' : '↓'} {change}
        </p>
      </CardContent>
    </Card>
  );
}

// Demo data - will be replaced with real data from API
const DEMO_METRICS = [
  { title: 'Total Impressions', value: '5.96M', change: '12.4%', positive: true },
  { title: 'Total Clicks', value: '105.3K', change: '8.7%', positive: true },
  { title: 'Total Spend', value: '$10,471', change: '5.2%', positive: true },
  { title: 'Avg. CTR', value: '1.77%', change: '0.3%', positive: true },
  { title: 'Conversions', value: '1,722', change: '18.1%', positive: true },
  { title: 'Avg. ROAS', value: '4.58x', change: '2.1%', positive: true },
];

export function MetricCards() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {DEMO_METRICS.map((metric) => (
        <MetricCard key={metric.title} {...metric} />
      ))}
    </div>
  );
}
