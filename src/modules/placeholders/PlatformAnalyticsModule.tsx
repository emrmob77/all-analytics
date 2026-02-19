"use client";

import type { BrandLogoName } from "@/components/ui/BrandLogoIcon";
import Badge from "@/components/ui/Badge";
import OptimizedBrandLogo from "@/components/ui/OptimizedBrandLogo";
import { useBrand } from "@/contexts/BrandContext";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useMetrics } from "@/hooks/useMetrics";
import { usePlatformConnections } from "@/hooks/usePlatformConnections";
import { usePlatforms } from "@/hooks/usePlatforms";
import { useTogglePlatformConnection } from "@/hooks/useTogglePlatformConnection";
import type { RoutePlatformKey } from "@/modules/dynamicRoutes";

interface PlatformAnalyticsModuleProps {
  title: string;
  description: string;
  platformKeys: RoutePlatformKey[];
}

const PLATFORM_LOGO_BY_ROUTE_KEY: Record<RoutePlatformKey, BrandLogoName> = {
  "google-ads": "google-ads",
  "meta-ads": "facebook",
  "tiktok-ads": "tiktok",
  "linkedin-ads": "linkedin",
  "yandex-ads": "yandex-ads",
  ga4: "ga4",
  "search-console": "search-console"
};

const PLATFORM_ALIASES: Record<string, RoutePlatformKey> = {
  google: "google-ads",
  "google-ads": "google-ads",
  google_ads: "google-ads",
  meta: "meta-ads",
  "meta-ads": "meta-ads",
  facebook: "meta-ads",
  "facebook-ads": "meta-ads",
  tiktok: "tiktok-ads",
  "tiktok-ads": "tiktok-ads",
  linkedin: "linkedin-ads",
  "linkedin-ads": "linkedin-ads",
  yandex: "yandex-ads",
  "yandex-ads": "yandex-ads",
  ga4: "ga4",
  "google-analytics-4": "ga4",
  "search-console": "search-console",
  search_console: "search-console",
  "google-search-console": "search-console"
};

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-").replace(/_/g, "-");
}

function toRoutePlatformKey(value: string): RoutePlatformKey | null {
  const normalized = normalizeKey(value);
  return PLATFORM_ALIASES[normalized] ?? null;
}

function isUuid(value: string | null | undefined) {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function metricMatchesPlatformSource(source: string, platformKey: RoutePlatformKey) {
  const normalizedSource = source.toLowerCase();

  if (platformKey === "google-ads") return normalizedSource.includes("google");
  if (platformKey === "meta-ads") return normalizedSource.includes("meta") || normalizedSource.includes("facebook");
  if (platformKey === "tiktok-ads") return normalizedSource.includes("tiktok");
  if (platformKey === "linkedin-ads") return normalizedSource.includes("linkedin");
  if (platformKey === "yandex-ads") return normalizedSource.includes("yandex");
  if (platformKey === "ga4") return normalizedSource.includes("ga4") || normalizedSource.includes("analytics");
  return normalizedSource.includes("search console");
}

/**
 * Platform route module backed by live Supabase query and mutation hooks.
 */
function PlatformAnalyticsModule({ description, platformKeys, title }: PlatformAnalyticsModuleProps) {
  const { activeBrand } = useBrand();
  const activeBrandId = activeBrand?.id;
  const safeBrandId = isUuid(activeBrandId) ? activeBrandId : null;

  const campaignsQuery = useCampaigns({ brandId: safeBrandId, enabled: Boolean(safeBrandId) });
  const connectionsQuery = usePlatformConnections({ brandId: safeBrandId, enabled: Boolean(safeBrandId) });
  const platformsQuery = usePlatforms({ enabled: Boolean(safeBrandId) });
  const metricsQuery = useMetrics({ enabled: Boolean(safeBrandId), includeInactive: true });

  const toggleConnectionMutation = useTogglePlatformConnection({
    successMessage: `${title} connection updated.`,
    errorMessage: `Failed to update ${title} connection.`
  });

  if (!safeBrandId) {
    return (
      <section className="rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <div className="mb-3 flex items-center gap-2">
          <OptimizedBrandLogo brand={PLATFORM_LOGO_BY_ROUTE_KEY[platformKeys[0]]} size={22} />
          <h2 className="text-lg font-semibold text-text-main-light dark:text-text-main-dark">{title}</h2>
        </div>
        <p className="mb-4 text-sm text-text-muted-light dark:text-text-muted-dark">{description}</p>
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
          Live data is available after selecting a connected brand with a valid UUID-backed workspace.
        </p>
      </section>
    );
  }

  if (campaignsQuery.isLoading || connectionsQuery.isLoading || platformsQuery.isLoading || metricsQuery.isLoading) {
    return (
      <section className="rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Loading {title} data...</p>
      </section>
    );
  }

  if (campaignsQuery.error || connectionsQuery.error || platformsQuery.error || metricsQuery.error) {
    return (
      <section className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm dark:border-red-900/40 dark:bg-red-900/20">
        <h2 className="mb-2 text-lg font-semibold text-red-700 dark:text-red-300">{title} data unavailable</h2>
        <p className="mb-4 text-sm text-red-700/90 dark:text-red-200">
          Failed to load one or more datasets for this module. Please retry.
        </p>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          onClick={() => {
            void Promise.all([
              campaignsQuery.refetch(),
              connectionsQuery.refetch(),
              platformsQuery.refetch(),
              metricsQuery.refetch()
            ]);
          }}
          type="button"
        >
          Retry
        </button>
      </section>
    );
  }

  const targetKeys = new Set(platformKeys);

  const matchingPlatforms = (platformsQuery.data ?? []).filter((platform) => {
    const routePlatformKey = toRoutePlatformKey(platform.key);
    return routePlatformKey ? targetKeys.has(routePlatformKey) : false;
  });

  const platformIdSet = new Set(matchingPlatforms.map((platform) => platform.id));

  const filteredCampaigns = (campaignsQuery.data ?? []).filter((campaign) => platformIdSet.has(campaign.platformId));

  const filteredConnections = (connectionsQuery.data ?? []).filter((connection) => platformIdSet.has(connection.platformId));

  const activeConnectionCount = filteredConnections.filter((connection) => connection.isActive).length;
  const totalSpend = filteredConnections.reduce((sum, connection) => sum + connection.spend, 0);
  const matchedMetricCount = (metricsQuery.data ?? []).filter((metric) =>
    platformKeys.some((platformKey) => metricMatchesPlatformSource(metric.source, platformKey))
  ).length;

  return (
    <section className="space-y-5 rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
      <div className="flex items-center gap-3">
        <OptimizedBrandLogo brand={PLATFORM_LOGO_BY_ROUTE_KEY[platformKeys[0]]} size={24} />
        <div>
          <h2 className="text-lg font-semibold text-text-main-light dark:text-text-main-dark">{title}</h2>
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark">{description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <article className="rounded-lg border border-border-light p-4 dark:border-border-dark">
          <p className="text-xs uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark">Campaigns</p>
          <p className="mt-2 text-2xl font-semibold text-text-main-light dark:text-text-main-dark">{filteredCampaigns.length}</p>
        </article>
        <article className="rounded-lg border border-border-light p-4 dark:border-border-dark">
          <p className="text-xs uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark">Active Connections</p>
          <p className="mt-2 text-2xl font-semibold text-text-main-light dark:text-text-main-dark">{activeConnectionCount}</p>
        </article>
        <article className="rounded-lg border border-border-light p-4 dark:border-border-dark">
          <p className="text-xs uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark">Mapped Metrics</p>
          <p className="mt-2 text-2xl font-semibold text-text-main-light dark:text-text-main-dark">{matchedMetricCount}</p>
          <p className="mt-1 text-xs text-text-muted-light dark:text-text-muted-dark">
            Spend: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(totalSpend)}
          </p>
        </article>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark">Connections</h3>
        {filteredConnections.length === 0 ? (
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark">No platform connections found for this module.</p>
        ) : (
          <ul className="space-y-2">
            {filteredConnections.map((connection) => (
              <li className="flex items-center justify-between rounded-lg border border-border-light p-3 dark:border-border-dark" key={connection.id}>
                <div>
                  <p className="text-sm font-semibold text-text-main-light dark:text-text-main-dark">
                    {connection.platform?.name ?? "Unknown Platform"}
                  </p>
                  <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                    Spend {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(connection.spend)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge connectionState={connection.isActive ? "connected" : "inactive"} size="sm" variant="connection" />
                  <button
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border-light px-3 text-xs font-semibold transition-colors hover:border-primary hover:text-primary dark:border-border-dark"
                    disabled={toggleConnectionMutation.isPending}
                    onClick={() =>
                      toggleConnectionMutation.mutate({
                        connectionId: connection.id,
                        isActive: !connection.isActive
                      })
                    }
                    type="button"
                  >
                    {connection.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark">Recent Campaigns</h3>
        {filteredCampaigns.length === 0 ? (
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark">No campaigns found for the selected platform.</p>
        ) : (
          <ul className="space-y-2">
            {filteredCampaigns.slice(0, 8).map((campaign) => (
              <li className="flex items-center justify-between rounded-lg border border-border-light p-3 dark:border-border-dark" key={campaign.id}>
                <div>
                  <p className="text-sm font-semibold text-text-main-light dark:text-text-main-dark">{campaign.name}</p>
                  <p className="text-xs text-text-muted-light dark:text-text-muted-dark">ROAS: {campaign.roas.toFixed(2)}x</p>
                </div>
                <Badge
                  showDot
                  size="sm"
                  statusTone={campaign.status === "active" ? "green" : campaign.status === "paused" ? "yellow" : "red"}
                  variant="status"
                >
                  {campaign.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default PlatformAnalyticsModule;
