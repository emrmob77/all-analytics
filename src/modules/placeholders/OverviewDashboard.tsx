import CampaignTable from "@/components/data-display/CampaignTable";
import IntegrationList from "@/components/data-display/IntegrationList";
import PlatformCard from "@/components/data-display/PlatformCard";

import ModulePlaceholderCard from "./ModulePlaceholderCard";

function OverviewDashboard() {
  return (
    <div className="space-y-8">
      <ModulePlaceholderCard
        description="High-level campaign and channel summary will be displayed in this dashboard module."
        icon="dashboard"
        title="Overview Dashboard"
      />
      <CampaignTable />
      <PlatformCard />
      <IntegrationList />
    </div>
  );
}

export default OverviewDashboard;
