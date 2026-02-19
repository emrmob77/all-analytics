import { Suspense } from 'react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { MetricCards } from '@/components/dashboard/metric-cards';
import { PerformanceChart } from '@/components/dashboard/performance-chart';
import { PlatformSummary } from '@/components/dashboard/platform-summary';
import { CampaignTable } from '@/components/dashboard/campaign-table';
import { Card } from '@/components/ui/card';

function MetricCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="h-24 animate-pulse bg-muted" />
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return <Card className="h-80 animate-pulse bg-muted" />;
}

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <DashboardHeader />

      <Suspense fallback={<MetricCardsSkeleton />}>
        <MetricCards />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-3">
        <Suspense fallback={<ChartSkeleton />}>
          <PerformanceChart className="lg:col-span-2" />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <PlatformSummary />
        </Suspense>
      </div>

      <Suspense fallback={<ChartSkeleton />}>
        <CampaignTable />
      </Suspense>
    </div>
  );
}
