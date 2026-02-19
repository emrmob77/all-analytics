import { createApiHandler } from "@/lib/api/handler";
import { readEnumParam, readIntegerParam, readStringParam } from "@/lib/api/validation";
import { listAuditEvents } from "@/lib/security/audit";

const auditLevelValues = ["info", "warn", "error"] as const;

interface AuditEventsQueryDto {
  limit: number;
  action?: string;
  tenantId?: string;
  userId?: string;
  level?: (typeof auditLevelValues)[number];
}

function parseAuditEventsQuery(url: URL): AuditEventsQueryDto {
  const params = url.searchParams;

  return {
    limit: readIntegerParam(params, "limit", { min: 1, max: 500 }) ?? 100,
    action: readStringParam(params, "action", { maxLength: 120 }),
    tenantId: readStringParam(params, "tenantId", { maxLength: 128 }),
    userId: readStringParam(params, "userId", { maxLength: 128 }),
    level: readEnumParam(params, "level", auditLevelValues)
  };
}

export const GET = createApiHandler(async (request, context) => {
  const query = parseAuditEventsQuery(new URL(request.url));
  context.requireTenantAccess(query.tenantId);

  const items = listAuditEvents(query);

  return {
    data: {
      items,
      count: items.length,
      filters: query
    }
  };
}, {
  auth: {
    required: true,
    roles: ["owner", "admin"]
  },
  rateLimit: {
    limit: 40,
    windowMs: 60_000,
    keyPrefix: "security-audit-events"
  },
  audit: {
    action: "security.audit_events.list"
  }
});
