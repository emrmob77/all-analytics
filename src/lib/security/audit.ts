type AuditEventLevel = "info" | "warn" | "error";

interface AuditEvent {
  id: string;
  timestamp: string;
  level: AuditEventLevel;
  action: string;
  route: string;
  method: string;
  status: number;
  requestId: string;
  userId?: string;
  tenantId?: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

const MAX_AUDIT_EVENTS = 5000;
const auditEventStore: AuditEvent[] = [];

function buildAuditEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `audit_${crypto.randomUUID()}`;
  }

  return `audit_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function recordAuditEvent(
  input: Omit<AuditEvent, "id" | "timestamp"> & {
    timestamp?: string;
  }
): AuditEvent {
  const event: AuditEvent = {
    id: buildAuditEventId(),
    timestamp: input.timestamp ?? new Date().toISOString(),
    level: input.level,
    action: input.action,
    route: input.route,
    method: input.method,
    status: input.status,
    requestId: input.requestId,
    userId: input.userId,
    tenantId: input.tenantId,
    message: input.message,
    metadata: input.metadata
  };

  auditEventStore.unshift(event);
  if (auditEventStore.length > MAX_AUDIT_EVENTS) {
    auditEventStore.splice(MAX_AUDIT_EVENTS);
  }

  return event;
}

function listAuditEvents(filters?: {
  limit?: number;
  action?: string;
  tenantId?: string;
  userId?: string;
  level?: AuditEventLevel;
}): AuditEvent[] {
  const limit = filters?.limit ?? 100;

  return auditEventStore
    .filter((event) => {
      if (filters?.action && event.action !== filters.action) {
        return false;
      }

      if (filters?.tenantId && event.tenantId !== filters.tenantId) {
        return false;
      }

      if (filters?.userId && event.userId !== filters.userId) {
        return false;
      }

      if (filters?.level && event.level !== filters.level) {
        return false;
      }

      return true;
    })
    .slice(0, Math.max(0, limit));
}

function clearAuditEvents(): void {
  auditEventStore.splice(0, auditEventStore.length);
}

export { clearAuditEvents, listAuditEvents, recordAuditEvent };
export type { AuditEvent, AuditEventLevel };
