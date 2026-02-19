import { lazy, type ComponentType, type LazyExoticComponent } from "react";

import type { NavigationSection } from "@/types/navigation";

const OverviewDashboard = lazy(() => import("./placeholders/OverviewDashboard"));
const PerformanceModule = lazy(() => import("./placeholders/PerformanceModule"));
const CampaignsModule = lazy(() => import("./placeholders/CampaignsModule"));
const ChannelsModule = lazy(() => import("./placeholders/ChannelsModule"));
const IntegrationsModule = lazy(() => import("./placeholders/IntegrationsModule"));
const AttributionModule = lazy(() => import("./placeholders/AttributionModule"));
const TeamModule = lazy(() => import("./placeholders/TeamModule"));
const SettingsModule = lazy(() => import("./placeholders/SettingsModule"));

type ModuleKey =
  | "overview"
  | "performance"
  | "campaigns"
  | "channels"
  | "integrations"
  | "attribution"
  | "team"
  | "settings";

interface ModuleDefinition {
  key: ModuleKey;
  path: string;
  title: string;
  icon: string;
  component: LazyExoticComponent<ComponentType>;
}

const moduleDefinitions: ModuleDefinition[] = [
  {
    key: "overview",
    path: "/",
    title: "Overview Dashboard",
    icon: "dashboard",
    component: OverviewDashboard
  },
  {
    key: "performance",
    path: "/performance",
    title: "Performance",
    icon: "insights",
    component: PerformanceModule
  },
  {
    key: "campaigns",
    path: "/campaigns",
    title: "Campaigns",
    icon: "campaign",
    component: CampaignsModule
  },
  {
    key: "channels",
    path: "/channels",
    title: "Channels",
    icon: "hub",
    component: ChannelsModule
  },
  {
    key: "integrations",
    path: "/integrations",
    title: "Integrations",
    icon: "extension",
    component: IntegrationsModule
  },
  {
    key: "attribution",
    path: "/attribution",
    title: "Attribution",
    icon: "settings_suggest",
    component: AttributionModule
  },
  {
    key: "team",
    path: "/team",
    title: "Team",
    icon: "manage_accounts",
    component: TeamModule
  },
  {
    key: "settings",
    path: "/settings",
    title: "Settings",
    icon: "settings",
    component: SettingsModule
  }
];

const moduleByKey: Record<ModuleKey, ModuleDefinition> = moduleDefinitions.reduce(
  (acc, module) => {
    acc[module.key] = module;
    return acc;
  },
  {} as Record<ModuleKey, ModuleDefinition>
);

const moduleByPath = new Map(moduleDefinitions.map((module) => [module.path, module]));

const navigationSections: NavigationSection[] = [
  {
    title: "Analytics",
    items: [
      { label: "Overview Dashboard", icon: "dashboard", path: "/" },
      { label: "Google Ads", icon: "brand:google-ads", path: "/google-ads" },
      { label: "Meta Ads", icon: "brand:facebook", path: "/meta-ads" },
      { label: "TikTok Ads", icon: "brand:tiktok", path: "/tiktok-ads" },
      { label: "LinkedIn Ads", icon: "brand:linkedin", path: "/linkedin-ads" },
      { label: "Yandex Ads", icon: "brand:yandex-ads", path: "/yandex-ads" },
      { label: "GA4", icon: "brand:ga4", path: "/ga4" },
      { label: "Growth Intelligence", icon: "insights", path: "/growth-intelligence" },
      { label: "Market Insights", icon: "show_chart", path: "/market-insights" },
      { label: "Commerce Center", icon: "shopping_bag", path: "/commerce-center" },
      { label: "Search Console", icon: "brand:search-console", path: "/search-console" }
    ]
  },
  {
    title: "Configuration",
    items: [
      { label: "Integrations", icon: "extension", path: "/integrations" },
      { label: "Task Board", icon: "task_alt", path: "/task-board" },
      { label: "Custom Report", icon: "description", path: "/custom-report" }
    ]
  },
  {
    title: "System",
    items: [
      { label: "AllanalyticsAI", icon: "auto_awesome", path: "/allanalytics-ai" },
      { label: "Settings", icon: "settings", path: "/settings" },
      { label: "Billing", icon: "payments", path: "/billing" },
      { label: "Support", icon: "support_agent", path: "/support" },
      { label: "Knowledge Base", icon: "menu_book", path: "/knowledge-base" },
      { label: "Onboarding", icon: "rocket_launch", path: "/onboarding" }
    ]
  }
];

const navigationItemByPath = new Map(
  navigationSections.flatMap((section) => section.items).map((item) => [item.path, item])
);

function getPageTitleByPath(pathname: string) {
  const route = moduleByPath.get(pathname);
  if (route) return route.title;

  const navigationItem = navigationItemByPath.get(pathname);
  if (navigationItem) return navigationItem.label;

  const lastSegment = pathname.split("/").filter(Boolean).at(-1);
  if (!lastSegment) return moduleByKey.overview.title;
  return lastSegment
    .split("-")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export { getPageTitleByPath, moduleByKey, moduleDefinitions, navigationSections };
export type { ModuleKey };
