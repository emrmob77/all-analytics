import CampaignTable from "@/components/data-display/CampaignTable";

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
    </div>
  );
}

export default OverviewDashboard;
