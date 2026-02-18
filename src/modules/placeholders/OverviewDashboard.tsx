import CampaignTable from "@/components/data-display/CampaignTable";
import IntegrationList from "@/components/data-display/IntegrationList";
import MetricCard from "@/components/data-display/MetricCard";
import MetricSelector from "@/components/data-display/MetricSelector";
import PlatformCard from "@/components/data-display/PlatformCard";

import ModulePlaceholderCard from "./ModulePlaceholderCard";

function OverviewDashboard() {
  const metricCards = [
    { metricName: "Revenue", value: 228_400, valueStyle: "currency" as const, trendDirection: "up" as const, trendPercentage: 13.4 },
    { metricName: "ROAS", value: 4.2, valueStyle: "number" as const, trendDirection: "up" as const, trendPercentage: 5.9 },
    { metricName: "CPA", value: 41.8, valueStyle: "currency" as const, trendDirection: "down" as const, trendPercentage: 3.1 },
    { metricName: "CTR", value: 0.069, valueStyle: "percent" as const, trendDirection: "up" as const, trendPercentage: 1.7 }
  ];

  return (
    <div className="space-y-8">
      <ModulePlaceholderCard
        description="High-level campaign and channel summary will be displayed in this dashboard module."
        icon="dashboard"
        title="Overview Dashboard"
      />

      <div className="flex justify-end">
        <MetricSelector />
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((metric) => (
          <MetricCard
            key={metric.metricName}
            metricName={metric.metricName}
            trendDirection={metric.trendDirection}
            trendPercentage={metric.trendPercentage}
            value={metric.value}
            valueStyle={metric.valueStyle}
          />
        ))}
      </section>

      <CampaignTable />
      <PlatformCard />
      <IntegrationList />
    </div>
  );
}

export default OverviewDashboard;
