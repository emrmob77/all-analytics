import { createApiHandler } from "@/lib/api/handler";
import { readIntegerParam, readStringParam } from "@/lib/api/validation";
import {
  listNotificationDeliveryLogs,
  listQueuedNotificationEvents,
  type NotificationEventType
} from "@/lib/notifications/deliveryPipeline";

const eventTypes = ["budget_spike", "roas_drop", "integration_failed", "report_ready"] as const;

function isEventType(value: string): value is NotificationEventType {
  return (eventTypes as readonly string[]).includes(value);
}

export const GET = createApiHandler(async (request) => {
  const url = new URL(request.url);

  const eventTypeInput = readStringParam(url.searchParams, "eventType", { maxLength: 120 });

  return {
    data: {
      queue: listQueuedNotificationEvents(),
      logs: listNotificationDeliveryLogs({
        tenantId: readStringParam(url.searchParams, "tenantId", { maxLength: 120 }),
        userId: readStringParam(url.searchParams, "userId", { maxLength: 120 }),
        eventType: eventTypeInput && isEventType(eventTypeInput) ? eventTypeInput : undefined,
        limit: readIntegerParam(url.searchParams, "limit", { min: 1, max: 500 })
      })
    }
  };
}, {
  rateLimit: {
    limit: 120,
    windowMs: 60_000,
    keyPrefix: "notifications-delivery-logs"
  }
});
