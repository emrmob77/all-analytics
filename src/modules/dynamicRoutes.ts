export type RoutePlatformKey =
  | "google-ads"
  | "meta-ads"
  | "tiktok-ads"
  | "linkedin-ads"
  | "yandex-ads"
  | "ga4"
  | "search-console";

export type DynamicRouteKind = "platform" | "placeholder" | "redirect";

export interface DynamicRouteConfig {
  slug: string;
  title: string;
  description: string;
  icon: string;
  kind: DynamicRouteKind;
  platformKeys?: RoutePlatformKey[];
  redirectTo?: string;
}

const dynamicRouteConfigs: DynamicRouteConfig[] = [
  {
    slug: "google-ads",
    title: "Google Ads",
    description: "Campaign, budget and connection health for Google Ads.",
    icon: "brand:google-ads",
    kind: "platform",
    platformKeys: ["google-ads"]
  },
  {
    slug: "meta-ads",
    title: "Meta Ads",
    description: "Campaign and spend visibility for Meta / Facebook Ads.",
    icon: "brand:facebook",
    kind: "platform",
    platformKeys: ["meta-ads"]
  },
  {
    slug: "tiktok-ads",
    title: "TikTok Ads",
    description: "Performance and connection controls for TikTok Ads.",
    icon: "brand:tiktok",
    kind: "platform",
    platformKeys: ["tiktok-ads"]
  },
  {
    slug: "linkedin-ads",
    title: "LinkedIn Ads",
    description: "Lead-gen and campaign health tracking for LinkedIn Ads.",
    icon: "brand:linkedin",
    kind: "platform",
    platformKeys: ["linkedin-ads"]
  },
  {
    slug: "yandex-ads",
    title: "Yandex Ads",
    description: "Regional paid media insights for Yandex Ads.",
    icon: "brand:yandex-ads",
    kind: "platform",
    platformKeys: ["yandex-ads"]
  },
  {
    slug: "ga4",
    title: "GA4",
    description: "Google Analytics 4 channel-level visibility.",
    icon: "brand:ga4",
    kind: "platform",
    platformKeys: ["ga4"]
  },
  {
    slug: "search-console",
    title: "Search Console",
    description: "Organic query and SEO performance from Search Console.",
    icon: "brand:search-console",
    kind: "platform",
    platformKeys: ["search-console"]
  },
  {
    slug: "growth-intelligence",
    title: "Growth Intelligence",
    description: "Forecasting and growth opportunity models will be managed here.",
    icon: "insights",
    kind: "placeholder"
  },
  {
    slug: "market-insights",
    title: "Market Insights",
    description: "Competitive trends and market benchmark analysis module.",
    icon: "show_chart",
    kind: "placeholder"
  },
  {
    slug: "commerce-center",
    title: "Commerce Center",
    description: "Commerce KPIs and product-level profitability dashboard.",
    icon: "shopping_bag",
    kind: "placeholder"
  },
  {
    slug: "task-board",
    title: "Task Board",
    description: "Operational tasks and team execution board.",
    icon: "task_alt",
    kind: "placeholder"
  },
  {
    slug: "custom-report",
    title: "Custom Report",
    description: "Build, schedule and share custom analytics reports.",
    icon: "description",
    kind: "placeholder"
  },
  {
    slug: "allanalytics-ai",
    title: "AllanalyticsAI",
    description: "AI-assisted analysis workflows and recommendations.",
    icon: "auto_awesome",
    kind: "placeholder"
  },
  {
    slug: "glowy-ai",
    title: "AllanalyticsAI",
    description: "Legacy route redirect for AllanalyticsAI.",
    icon: "auto_awesome",
    kind: "redirect",
    redirectTo: "/allanalytics-ai"
  }
];

const configBySlug = new Map(dynamicRouteConfigs.map((config) => [config.slug, config]));

export function getDynamicRouteConfig(slug: string) {
  return configBySlug.get(slug) ?? null;
}

export const dynamicRouteSlugs = dynamicRouteConfigs.map((config) => config.slug);
