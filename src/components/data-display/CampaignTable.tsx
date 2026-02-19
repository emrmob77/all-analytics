import { memo, useMemo } from "react";
import type { BrandLogoName } from "@/components/ui/BrandLogoIcon";
import OptimizedBrandLogo from "@/components/ui/OptimizedBrandLogo";

interface Campaign {
  id: string;
  name: string;
  platform: "google" | "meta" | "tiktok" | "linkedin";
  status: "active" | "paused" | "stopped";
  budgetUsed: number;
  budgetLimit: number;
  roas: number;
  roasTrend: "up" | "down" | "flat";
  budgetBarClass: string;
}

const campaigns: Campaign[] = [
  {
    id: "CMP-9201",
    name: "Summer Sale 2026",
    platform: "google",
    status: "active",
    budgetUsed: 4200,
    budgetLimit: 6000,
    roas: 4.2,
    roasTrend: "up",
    budgetBarClass: "bg-primary"
  },
  {
    id: "CMP-8832",
    name: "Brand Awareness Q1",
    platform: "meta",
    status: "paused",
    budgetUsed: 1100,
    budgetLimit: 5000,
    roas: 1.8,
    roasTrend: "flat",
    budgetBarClass: "bg-yellow-500"
  },
  {
    id: "CMP-7741",
    name: "Retargeting Visitors",
    platform: "tiktok",
    status: "active",
    budgetUsed: 8540,
    budgetLimit: 9300,
    roas: 5.1,
    roasTrend: "up",
    budgetBarClass: "bg-red-500"
  },
  {
    id: "CMP-6418",
    name: "Seasonal Prospecting",
    platform: "linkedin",
    status: "stopped",
    budgetUsed: 7430,
    budgetLimit: 7700,
    roas: 0.9,
    roasTrend: "down",
    budgetBarClass: "bg-red-500"
  }
];

function currency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    value
  );
}

function getPlatformMeta(platform: Campaign["platform"]) {
  switch (platform) {
    case "google":
      return { label: "Google Ads", logo: "google-ads" as BrandLogoName };
    case "meta":
      return { label: "Facebook Ads", logo: "facebook" as BrandLogoName };
    case "tiktok":
      return { label: "TikTok Ads", logo: "tiktok" as BrandLogoName };
    case "linkedin":
      return { label: "LinkedIn Ads", logo: "linkedin" as BrandLogoName };
  }
}

function getStatusMeta(status: Campaign["status"]) {
  if (status === "active") {
    return {
      label: "Active",
      wrapperClass:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      dotClass: "bg-green-500"
    };
  }
  if (status === "paused") {
    return {
      label: "Paused",
      wrapperClass:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      dotClass: "bg-yellow-500"
    };
  }
  return {
    label: "Stopped",
    wrapperClass: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    dotClass: "bg-red-500"
  };
}

function getTrendMeta(trend: Campaign["roasTrend"]) {
  if (trend === "up") return { icon: "trending_up", className: "text-green-600 dark:text-green-400" };
  if (trend === "down") return { icon: "trending_down", className: "text-red-600 dark:text-red-400" };
  return { icon: "trending_flat", className: "text-text-muted-light dark:text-text-muted-dark" };
}

interface CampaignRowProps {
  campaign: Campaign;
}

const CampaignRow = memo(function CampaignRow({ campaign }: CampaignRowProps) {
  const status = useMemo(() => getStatusMeta(campaign.status), [campaign.status]);
  const platform = useMemo(() => getPlatformMeta(campaign.platform), [campaign.platform]);
  const trend = useMemo(() => getTrendMeta(campaign.roasTrend), [campaign.roasTrend]);
  const percentage = useMemo(
    () => Math.round((campaign.budgetUsed / campaign.budgetLimit) * 100),
    [campaign.budgetLimit, campaign.budgetUsed]
  );

  return (
    <tr className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <td className="px-6 py-4">
        <div className="font-medium text-text-main-light dark:text-text-main-dark">{campaign.name}</div>
        <div className="text-xs text-text-muted-light dark:text-text-muted-dark">ID: #{campaign.id}</div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <OptimizedBrandLogo brand={platform.logo} size={18} />
          <span>{platform.label}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span
          className={[
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
            status.wrapperClass
          ].join(" ")}
        >
          <span className={["mr-1.5 h-1.5 w-1.5 rounded-full", status.dotClass].join(" ")} />
          {status.label}
        </span>
      </td>
      <td className="w-48 px-6 py-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium">{currency(campaign.budgetUsed)}</span>
          <span className="text-xs text-text-muted-light dark:text-text-muted-dark">{percentage}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
          <div className={["h-1.5 rounded-full", campaign.budgetBarClass].join(" ")} style={{ width: `${percentage}%` }} />
        </div>
      </td>
      <td className="px-6 py-4">
        <div className={["flex items-center gap-1 font-medium", trend.className].join(" ")}>
          {campaign.roas.toFixed(1)}x
          <span className="material-icons-round text-sm">{trend.icon}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <button
          aria-label="Campaign actions"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-text-muted-light transition-colors hover:text-primary dark:text-text-muted-dark"
          type="button"
        >
          <span className="material-icons-round">more_vert</span>
        </button>
      </td>
    </tr>
  );
});

function CampaignTable() {
  const memoizedCampaigns = useMemo(() => campaigns, []);

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold">Active Campaigns</h2>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-text-muted-light dark:text-text-muted-dark" htmlFor="campaign-status-filter">
            Filter by:
          </label>
          <div className="relative">
            <select
              aria-label="Filter campaigns by status"
              className="min-h-11 appearance-none rounded-lg border border-border-light bg-surface-light py-2 pl-3 pr-8 text-sm text-text-main-light outline-none transition-colors focus:border-primary dark:border-border-dark dark:bg-surface-dark dark:text-text-main-dark"
              defaultValue="all"
              id="campaign-status-filter"
            >
              <option value="all">Status: All</option>
              <option value="active">Status: Active</option>
              <option value="paused">Status: Paused</option>
              <option value="stopped">Status: Stopped</option>
            </select>
            <span className="material-icons-round pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm text-text-muted-light dark:text-text-muted-dark">
              expand_more
            </span>
          </div>

          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-white transition-colors hover:bg-primary/90"
            type="button"
          >
            <span className="material-icons-round text-sm">add</span>
            New Campaign
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border-light bg-surface-light shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <div className="overflow-x-auto">
          <table className="min-w-[820px] w-full text-left text-sm">
            <thead className="border-b border-border-light bg-gray-50 text-text-muted-light dark:border-border-dark dark:bg-gray-800 dark:text-text-muted-dark">
              <tr>
                <th className="px-6 py-4 font-medium">Campaign Name</th>
                <th className="px-6 py-4 font-medium">Platform</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Budget Used</th>
                <th className="px-6 py-4 font-medium">ROAS</th>
                <th className="px-6 py-4 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {memoizedCampaigns.map((campaign) => (
                <CampaignRow campaign={campaign} key={campaign.id} />
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-center border-t border-border-light px-6 py-4 dark:border-border-dark">
          <button
            className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-medium text-primary transition-colors hover:underline"
            type="button"
          >
            View All Campaigns
            <span className="material-icons-round text-sm">arrow_forward</span>
          </button>
        </div>
      </div>
    </section>
  );
}

export default CampaignTable;
