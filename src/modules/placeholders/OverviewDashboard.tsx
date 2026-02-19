import CampaignTable from "@/components/data-display/CampaignTable";
import IntegrationList from "@/components/data-display/IntegrationList";
import PlatformCard from "@/components/data-display/PlatformCard";
import {
  CampaignTableSkeleton,
  MetricCardSkeleton,
  PlatformCardSkeleton
} from "@/components/data-display/SkeletonStates";
import { useBrands } from "@/hooks/useBrands";

function OverviewDashboard() {
  const { isLoading } = useBrands({ fallbackToMockData: true });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCardSkeleton />
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
      <CampaignTable />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <PlatformCard />
        <IntegrationList />
      </div>
    </div>
  );
}

export default OverviewDashboard;
