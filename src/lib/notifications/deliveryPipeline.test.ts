import { describe, expect, it } from "vitest";

import {
  enqueueNotificationEvent,
  listNotificationDeliveryLogs,
  processNotificationQueue
} from "@/lib/notifications/deliveryPipeline";

describe("notification delivery pipeline", () => {
  it("maps events to delivery logs", () => {
    enqueueNotificationEvent({
      tenantId: "brand-1",
      userId: "user_demo_1",
      type: "budget_spike",
      payload: {
        platform: "Google Ads",
        changePercent: 22
      }
    });

    const processed = processNotificationQueue();

    expect(processed.length).toBeGreaterThan(0);
    expect(listNotificationDeliveryLogs({ limit: 1 }).length).toBe(1);
  });
});
