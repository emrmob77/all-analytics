import CampaignTable from "@/components/data-display/CampaignTable";
import IntegrationList from "@/components/data-display/IntegrationList";
import PlatformCard from "@/components/data-display/PlatformCard";

function OverviewDashboard() {
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
