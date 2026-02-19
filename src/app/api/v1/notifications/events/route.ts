import { createApiHandler } from "@/lib/api/handler";
import { ensureObjectRecord, readBodyString } from "@/lib/api/validation";
import {
  enqueueNotificationEvent,
  processNotificationQueue,
  type NotificationEventType
} from "@/lib/notifications/deliveryPipeline";

const eventTypes = ["budget_spike", "roas_drop", "integration_failed", "report_ready"] as const;

function isEventType(value: string): value is NotificationEventType {
  return (eventTypes as readonly string[]).includes(value);
}

export const POST = createApiHandler(async (_request, context) => {
  const body = ensureObjectRecord(await context.readJson());

  const tenantId = readBodyString(body, "tenantId", { maxLength: 120 }) ?? "brand-1";
  const userId = readBodyString(body, "userId", { maxLength: 120 }) ?? "user_demo_1";
  const eventTypeInput = readBodyString(body, "eventType", { required: true, maxLength: 120 }) ?? "report_ready";

  const eventType: NotificationEventType = isEventType(eventTypeInput) ? eventTypeInput : "report_ready";

  const queueItem = enqueueNotificationEvent({
    tenantId,
    userId,
    type: eventType,
    payload: ensureObjectRecord(body.payload ?? {})
  });

  const deliveryLogs = processNotificationQueue(["in_app", "email"]);

  return {
    data: {
      queueItem,
      deliveryLogs
    },
    status: 201
  };
}, {
  rateLimit: {
    limit: 120,
    windowMs: 60_000,
    keyPrefix: "notifications-events"
  },
  audit: {
    action: "notifications.event.enqueue"
  }
});
