import { beforeEach, describe, expect, it } from "vitest";

import { selectUnreadNotificationCount, useNotificationStore } from "@/store/notificationStore";

describe("notificationStore", () => {
  beforeEach(() => {
    useNotificationStore.getState().reset();
  });

  it("returns unread count and marks all notifications as read", () => {
    const initialUnread = selectUnreadNotificationCount(useNotificationStore.getState());

    expect(initialUnread).toBeGreaterThan(0);

    useNotificationStore.getState().markAllAsRead();

    const unreadAfterMarkAll = selectUnreadNotificationCount(useNotificationStore.getState());
    expect(unreadAfterMarkAll).toBe(0);
  });

  it("toggles read state for a notification", () => {
    const firstNotification = useNotificationStore.getState().notifications[0];
    const initialReadState = firstNotification.isRead;

    useNotificationStore.getState().toggleReadState(firstNotification.id);
    const toggledNotification = useNotificationStore
      .getState()
      .notifications.find((notification) => notification.id === firstNotification.id);

    expect(toggledNotification?.isRead).toBe(!initialReadState);
  });

  it("stores the selected category filter", () => {
    useNotificationStore.getState().setCategoryFilter("integrations");

    expect(useNotificationStore.getState().categoryFilter).toBe("integrations");
  });
});
