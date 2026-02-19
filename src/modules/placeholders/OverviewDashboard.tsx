import CampaignTable from "@/components/data-display/CampaignTable";
import IntegrationList from "@/components/data-display/IntegrationList";
import MetricCard from "@/components/data-display/MetricCard";
import PlatformCard from "@/components/data-display/PlatformCard";
import {
  CampaignTableSkeleton,
  MetricCardSkeleton,
  PlatformCardSkeleton
} from "@/components/data-display/SkeletonStates";
import { useBrands } from "@/hooks/useBrands";

const keyMetrics = [
  {
    id: "revenue",
    metricName: "Total Revenue",
    value: 183450,
    valueStyle: "currency" as const,
    trendDirection: "up" as const,
    trendPercentage: 12.8
  },
  {
    id: "roas",
    metricName: "Average ROAS",
    value: 4.6,
    trendDirection: "up" as const,
    trendPercentage: 6.2
  },
  {
    id: "cvr",
    metricName: "Conversion Rate",
    value: 0.037,
    valueStyle: "percent" as const,
    trendDirection: "down" as const,
    trendPercentage: -1.4
  }
];

function OverviewDashboard() {
  const { isLoading } = useBrands({ fallbackToMockData: true });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </section>

        <CampaignTableSkeleton />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <PlatformCardSkeleton />
          <PlatformCardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {keyMetrics.map((metric) => (
          <MetricCard
            key={metric.id}
            metricName={metric.metricName}
            trendDirection={metric.trendDirection}
            trendPercentage={metric.trendPercentage}
            value={metric.value}
            valueStyle={metric.valueStyle}
          />
        ))}
      </section>

      <CampaignTable />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <PlatformCard />
        <IntegrationList />
      </div>
    </div>
  );
}

export default OverviewDashboard;
