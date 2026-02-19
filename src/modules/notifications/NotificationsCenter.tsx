"use client";

import Link from "next/link";
import { useMemo } from "react";

import Badge from "@/components/ui/Badge";
import {
  notificationCategoryMeta,
  type AppNotification,
  type NotificationCategory
} from "@/lib/notifications/notifications";
import {
  selectUnreadNotificationCount,
  useNotificationStore,
  type NotificationFilter
} from "@/store/notificationStore";
import { cn } from "@/utils/cn";

const filterOptions: Array<{ value: NotificationFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "performance", label: "Performance" },
  { value: "integrations", label: "Integrations" },
  { value: "workspace", label: "Workspace" },
  { value: "system", label: "System" }
];

function formatRelativeTime(timestamp: string) {
  const parsedTimestamp = new Date(timestamp).getTime();

  if (Number.isNaN(parsedTimestamp)) {
    return "Unknown";
  }

  const elapsedMinutes = Math.max(1, Math.floor((Date.now() - parsedTimestamp) / (1000 * 60)));

  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h ago`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays}d ago`;
}

function sortByNewest(notifications: AppNotification[]) {
  return [...notifications].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return bTime - aTime;
  });
}

function NotificationsCenter() {
  const notifications = useNotificationStore((state) => state.notifications);
  const categoryFilter = useNotificationStore((state) => state.categoryFilter);
  const setCategoryFilter = useNotificationStore((state) => state.setCategoryFilter);
  const toggleReadState = useNotificationStore((state) => state.toggleReadState);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const unreadCount = useNotificationStore(selectUnreadNotificationCount);

  const categoryCounts = useMemo(() => {
    const initialCounts: Record<NotificationCategory, number> = {
      performance: 0,
      integrations: 0,
      workspace: 0,
      system: 0
    };

    for (const notification of notifications) {
      initialCounts[notification.category] += 1;
    }

    return initialCounts;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    const byCategory =
      categoryFilter === "all"
        ? notifications
        : notifications.filter((notification) => notification.category === categoryFilter);

    return sortByNewest(byCategory);
  }, [notifications, categoryFilter]);

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-border-light bg-surface-light p-5 shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-text-main-light dark:text-text-main-dark">Notifications Center</h2>
            <p className="mt-1 text-sm text-text-muted-light dark:text-text-muted-dark">
              Track integration, performance and workspace alerts in one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-lg border border-border-light bg-background-light px-3 py-1.5 text-sm font-medium text-text-main-light dark:border-border-dark dark:bg-background-dark dark:text-text-main-dark">
              <span className="material-icons-round text-[18px] text-rose-500 dark:text-rose-400">notifications</span>
              {unreadCount} unread
            </span>
            <Link
              className="inline-flex min-h-10 items-center rounded-lg border border-border-light bg-background-light px-3 py-1.5 text-sm font-medium text-text-main-light transition-colors hover:bg-gray-100 dark:border-border-dark dark:bg-background-dark dark:text-text-main-dark dark:hover:bg-gray-800"
              href="/notifications/preferences"
            >
              Notification Preferences
            </Link>

            <button
              className="inline-flex min-h-10 items-center rounded-lg border border-border-light bg-background-light px-3 py-1.5 text-sm font-medium text-text-main-light transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-border-dark dark:bg-background-dark dark:text-text-main-dark dark:hover:bg-gray-800"
              disabled={unreadCount === 0}
              onClick={markAllAsRead}
              type="button"
            >
              Mark all as read
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border-light bg-surface-light p-5 shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <div className="flex flex-wrap items-center gap-2">
          {filterOptions.map((filterOption) => {
            const itemCount = filterOption.value === "all" ? notifications.length : categoryCounts[filterOption.value];
            const isActive = categoryFilter === filterOption.value;

            return (
              <button
                className={cn(
                  "inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "border-primary bg-secondary text-text-main-light dark:text-text-main-dark"
                    : "border-border-light text-text-muted-light hover:bg-gray-50 dark:border-border-dark dark:text-text-muted-dark dark:hover:bg-gray-800"
                )}
                key={filterOption.value}
                onClick={() => setCategoryFilter(filterOption.value)}
                type="button"
              >
                {filterOption.label}
                <span
                  className={cn(
                    "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] leading-none",
                    isActive
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-text-muted-light dark:bg-gray-700 dark:text-text-muted-dark"
                  )}
                >
                  {itemCount}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => {
            const categoryMeta = notificationCategoryMeta[notification.category];

            return (
              <article
                className={cn(
                  "rounded-xl border p-4 shadow-sm transition-colors",
                  notification.isRead
                    ? "border-border-light bg-surface-light dark:border-border-dark dark:bg-surface-dark"
                    : "border-primary/30 bg-secondary/35 dark:border-primary/40 dark:bg-surface-dark"
                )}
                key={notification.id}
              >
                <div className="flex flex-wrap items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border-light bg-background-light dark:border-border-dark dark:bg-background-dark">
                    <span className={cn("material-icons-round text-[18px]", categoryMeta.iconClassName)}>
                      {categoryMeta.icon}
                    </span>
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-text-main-light dark:text-text-main-dark">{notification.title}</h3>
                      {!notification.isRead ? (
                        <Badge showDot={false} size="sm" statusTone="green">
                          New
                        </Badge>
                      ) : null}
                    </div>

                    <p className="mt-1 text-sm text-text-muted-light dark:text-text-muted-dark">{notification.message}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-muted-light dark:text-text-muted-dark">
                      <span className="rounded-full border border-border-light px-2 py-0.5 dark:border-border-dark">
                        {categoryMeta.label}
                      </span>
                      <span aria-hidden="true">•</span>
                      <span>{formatRelativeTime(notification.createdAt)}</span>
                      {notification.actionHref && notification.actionLabel ? (
                        <>
                          <span aria-hidden="true">•</span>
                          <Link
                            className="font-semibold text-primary hover:underline"
                            href={notification.actionHref}
                            onClick={() => markAsRead(notification.id)}
                          >
                            {notification.actionLabel}
                          </Link>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <button
                    className="inline-flex min-h-9 items-center rounded-lg border border-border-light bg-background-light px-3 py-1 text-xs font-medium text-text-main-light transition-colors hover:bg-gray-100 dark:border-border-dark dark:bg-background-dark dark:text-text-main-dark dark:hover:bg-gray-800"
                    onClick={() => toggleReadState(notification.id)}
                    type="button"
                  >
                    {notification.isRead ? "Mark unread" : "Mark read"}
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <section className="rounded-xl border border-dashed border-border-light bg-surface-light p-8 text-center dark:border-border-dark dark:bg-surface-dark">
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
              No notifications found for the selected category.
            </p>
          </section>
        )}
      </section>
    </div>
  );
}

export default NotificationsCenter;
