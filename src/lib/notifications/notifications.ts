export type NotificationCategory = "performance" | "integrations" | "workspace" | "system";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  createdAt: string;
  isRead: boolean;
  actionLabel?: string;
  actionHref?: string;
}

export const notificationCategoryMeta: Record<
  NotificationCategory,
  {
    label: string;
    icon: string;
    iconClassName: string;
  }
> = {
  performance: {
    label: "Performance",
    icon: "insights",
    iconClassName: "text-violet-600 dark:text-violet-300"
  },
  integrations: {
    label: "Integrations",
    icon: "extension",
    iconClassName: "text-cyan-600 dark:text-cyan-300"
  },
  workspace: {
    label: "Workspace",
    icon: "groups",
    iconClassName: "text-indigo-600 dark:text-indigo-300"
  },
  system: {
    label: "System",
    icon: "notifications_active",
    iconClassName: "text-amber-600 dark:text-amber-300"
  }
};

/**
 * Provides seeded notifications for the in-app notification center.
 * Timestamps are generated from "now" so relative time labels remain meaningful.
 */
export function createInitialNotifications(): AppNotification[] {
  const now = Date.now();

  return [
    {
      id: "notif_google_ads_spike",
      title: "Google Ads spend increased 38%",
      message: "Brand: Nova Retail Group. Daily spend passed your threshold within the last hour.",
      category: "performance",
      createdAt: new Date(now - 12 * 60 * 1000).toISOString(),
      isRead: false,
      actionLabel: "Review campaign",
      actionHref: "/google-ads"
    },
    {
      id: "notif_search_console_reauth",
      title: "Search Console requires reconnect",
      message: "OAuth token expires soon. Reconnect to avoid data sync interruption.",
      category: "integrations",
      createdAt: new Date(now - 47 * 60 * 1000).toISOString(),
      isRead: false,
      actionLabel: "Open integrations",
      actionHref: "/integrations"
    },
    {
      id: "notif_weekly_report",
      title: "Weekly custom report is ready",
      message: "Performance Summary - Week 7 has been generated successfully.",
      category: "workspace",
      createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      actionLabel: "Open report",
      actionHref: "/custom-report"
    },
    {
      id: "notif_team_role_change",
      title: "Role update applied",
      message: "Emre Aksoy is now assigned as Marketing Lead in your workspace.",
      category: "workspace",
      createdAt: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      actionLabel: "Go to team",
      actionHref: "/team"
    },
    {
      id: "notif_connector_health",
      title: "TikTok Ads connector recovered",
      message: "Connector health moved from failed to connected after automatic retry.",
      category: "integrations",
      createdAt: new Date(now - 15 * 60 * 60 * 1000).toISOString(),
      isRead: false,
      actionLabel: "Open TikTok Ads",
      actionHref: "/tiktok-ads"
    },
    {
      id: "notif_system_maintenance",
      title: "Scheduled maintenance reminder",
      message: "Planned analytics indexing maintenance starts in 4 hours.",
      category: "system",
      createdAt: new Date(now - 20 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      actionLabel: "View settings",
      actionHref: "/settings"
    }
  ];
}
