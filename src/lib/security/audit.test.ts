import { describe, expect, it } from "vitest";

import { clearAuditEvents, listAuditEvents, recordAuditEvent } from "@/lib/security/audit";

describe("audit event store", () => {
  it("records and filters audit events", () => {
    clearAuditEvents();

    recordAuditEvent({
      level: "info",
      action: "integration.oauth.start",
      route: "/api/v1/integrations/oauth/start",
      method: "POST",
      status: 200,
      requestId: "req-1",
      userId: "user-1",
      tenantId: "tenant-1"
    });
    recordAuditEvent({
      level: "warn",
      action: "sync.jobs.run",
      route: "/api/v1/sync/jobs/job-1/run",
      method: "POST",
      status: 429,
      requestId: "req-2",
      userId: "user-1",
      tenantId: "tenant-1"
    });

    const all = listAuditEvents();
    const onlySync = listAuditEvents({ action: "sync.jobs.run" });

    expect(all).toHaveLength(2);
    expect(onlySync).toHaveLength(1);
    expect(onlySync[0]?.status).toBe(429);
  });
});
