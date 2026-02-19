import { randomUUID } from "crypto";

export type NotificationEventType = "budget_spike" | "roas_drop" | "integration_failed" | "report_ready";
export type NotificationChannel = "in_app" | "email";

export interface NotificationEventInput {
  tenantId: string;
  userId: string;
  type: NotificationEventType;
  payload: Record<string, unknown>;
}

export interface NotificationQueueItem extends NotificationEventInput {
  id: string;
  queuedAt: string;
  attempts: number;
}

export interface NotificationDeliveryLog {
  id: string;
  tenantId: string;
  userId: string;
  eventType: NotificationEventType;
  channel: NotificationChannel;
  templateKey: string;
  message: string;
  status: "sent" | "failed";
  attempts: number;
  deliveredAt: string;
}

const queueStore: NotificationQueueItem[] = [];
const deliveryLogStore: NotificationDeliveryLog[] = [];

const templateByEvent: Record<NotificationEventType, { templateKey: string; toMessage: (payload: Record<string, unknown>) => string }> = {
  budget_spike: {
    templateKey: "alert_budget_spike_v1",
    toMessage: (payload) =>
      `Budget spike detected for ${(payload.platform as string) ?? "selected platform"}: ${(payload.changePercent as number) ?? 0}% increase.`
  },
  roas_drop: {
    templateKey: "alert_roas_drop_v1",
    toMessage: (payload) =>
      `ROAS dropped below threshold on ${(payload.platform as string) ?? "selected platform"}. Current value: ${(payload.currentRoas as number) ?? 0}.`
  },
  integration_failed: {
    templateKey: "alert_integration_failed_v1",
    toMessage: (payload) =>
      `Integration sync failed for ${(payload.provider as string) ?? "provider"}. Error code: ${(payload.code as string) ?? "unknown"}.`
  },
  report_ready: {
    templateKey: "report_ready_v1",
    toMessage: (payload) =>
      `Report ${(payload.reportName as string) ?? "Scheduled Report"} is ready for download.`
  }
};

function nowIso() {
  return new Date().toISOString();
}

function enqueueNotificationEvent(input: NotificationEventInput) {
  const queueItem: NotificationQueueItem = {
    id: `notif_queue_${randomUUID()}`,
    tenantId: input.tenantId,
    userId: input.userId,
    type: input.type,
    payload: input.payload,
    queuedAt: nowIso(),
    attempts: 0
  };

  queueStore.unshift(queueItem);
  return queueItem;
}

function processNotificationQueue(channels: NotificationChannel[] = ["in_app", "email"]) {
  const processed: NotificationDeliveryLog[] = [];

  while (queueStore.length > 0) {
    const queueItem = queueStore.pop();

    if (!queueItem) {
      continue;
    }

    queueItem.attempts += 1;

    const template = templateByEvent[queueItem.type];

    for (const channel of channels) {
      const deliveryLog: NotificationDeliveryLog = {
        id: `notif_log_${randomUUID()}`,
        tenantId: queueItem.tenantId,
        userId: queueItem.userId,
        eventType: queueItem.type,
        channel,
        templateKey: template.templateKey,
        message: template.toMessage(queueItem.payload),
        status: "sent",
        attempts: queueItem.attempts,
        deliveredAt: nowIso()
      };

      deliveryLogStore.unshift(deliveryLog);
      processed.push(deliveryLog);
    }
  }

  return processed;
}

function listNotificationDeliveryLogs(filters?: {
  tenantId?: string;
  userId?: string;
  eventType?: NotificationEventType;
  limit?: number;
}) {
  const limit = filters?.limit ?? 100;

  return deliveryLogStore
    .filter((log) => {
      if (filters?.tenantId && log.tenantId !== filters.tenantId) return false;
      if (filters?.userId && log.userId !== filters.userId) return false;
      if (filters?.eventType && log.eventType !== filters.eventType) return false;
      return true;
    })
    .slice(0, Math.max(0, limit));
}

function listQueuedNotificationEvents() {
  return queueStore;
}

export {
  enqueueNotificationEvent,
  listNotificationDeliveryLogs,
  listQueuedNotificationEvents,
  processNotificationQueue
};
