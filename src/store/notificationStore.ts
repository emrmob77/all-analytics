import { create } from "zustand";

import { createInitialNotifications, type AppNotification, type NotificationCategory } from "@/lib/notifications/notifications";

export type NotificationFilter = "all" | NotificationCategory;

interface NotificationState {
  notifications: AppNotification[];
  categoryFilter: NotificationFilter;
  setCategoryFilter: (filter: NotificationFilter) => void;
  toggleReadState: (notificationId: string) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  reset: () => void;
}

const defaultFilter: NotificationFilter = "all";

function withReadState(notifications: AppNotification[], notificationId: string, isRead: boolean): AppNotification[] {
  return notifications.map((notification) =>
    notification.id === notificationId ? { ...notification, isRead } : notification
  );
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: createInitialNotifications(),
  categoryFilter: defaultFilter,
  setCategoryFilter: (filter) => set({ categoryFilter: filter }),
  toggleReadState: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead: !notification.isRead } : notification
      )
    })),
  markAsRead: (notificationId) =>
    set((state) => ({
      notifications: withReadState(state.notifications, notificationId, true)
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.isRead ? notification : { ...notification, isRead: true }
      )
    })),
  reset: () =>
    set({
      notifications: createInitialNotifications(),
      categoryFilter: defaultFilter
    })
}));

export const selectUnreadNotificationCount = (state: NotificationState) =>
  state.notifications.reduce((total, notification) => total + (notification.isRead ? 0 : 1), 0);
