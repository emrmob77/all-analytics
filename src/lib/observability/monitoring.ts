import { randomUUID } from "crypto";

export interface MonitoringEvent {
  id: string;
  source: "frontend" | "backend";
  level: "info" | "warn" | "error";
  message: string;
  context?: Record<string, unknown>;
  createdAt: string;
}

const monitoringStore: MonitoringEvent[] = [];

function nowIso() {
  return new Date().toISOString();
}

function captureMonitoringEvent(input: Omit<MonitoringEvent, "id" | "createdAt">) {
  const event: MonitoringEvent = {
    id: `monitoring_${randomUUID()}`,
    ...input,
    createdAt: nowIso()
  };

  monitoringStore.unshift(event);
  return event;
}

function listMonitoringEvents(limit = 200) {
  return monitoringStore.slice(0, Math.max(0, limit));
}

function captureFrontendError(error: Error, info?: { componentStack?: string }) {
  const event = captureMonitoringEvent({
    source: "frontend",
    level: "error",
    message: error.message,
    context: {
      name: error.name,
      stack: error.stack,
      componentStack: info?.componentStack
    }
  });

  if (typeof window !== "undefined") {
    window.fetch("/api/v1/observability/events", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        source: event.source,
        level: event.level,
        message: event.message,
        context: event.context
      }),
      keepalive: true
    }).catch(() => {
      // noop
    });
  }

  return event;
}

export { captureFrontendError, captureMonitoringEvent, listMonitoringEvents };
