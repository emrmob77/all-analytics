"use client";

import type { DynamicRouteConfig } from "@/modules/dynamicRoutes";
import ModulePlaceholderCard from "@/modules/placeholders/ModulePlaceholderCard";
import PlatformAnalyticsModule from "@/modules/placeholders/PlatformAnalyticsModule";

interface DynamicRouteModuleProps {
  config: DynamicRouteConfig;
}

/**
 * Route module resolver for dynamic app pages backed by route config.
 */
function DynamicRouteModule({ config }: DynamicRouteModuleProps) {
  if (config.kind === "platform") {
    return (
      <PlatformAnalyticsModule
        description={config.description}
        platformKeys={config.platformKeys ?? []}
        title={config.title}
      />
    );
  }

  return <ModulePlaceholderCard description={config.description} icon={config.icon} title={config.title} />;
}

export default DynamicRouteModule;
