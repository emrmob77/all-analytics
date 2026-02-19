import { createApiHandler } from "@/lib/api/handler";
import { ensureObjectRecord, readBodyString, readIntegerParam } from "@/lib/api/validation";
import { captureMonitoringEvent, listMonitoringEvents } from "@/lib/observability/monitoring";

export const GET = createApiHandler(async (request) => {
  const url = new URL(request.url);
  const limit = readIntegerParam(url.searchParams, "limit", { min: 1, max: 500 }) ?? 100;

  return {
    data: {
      events: listMonitoringEvents(limit)
    }
  };
});

export const POST = createApiHandler(async (_request, context) => {
  const body = ensureObjectRecord(await context.readJson());

  const event = captureMonitoringEvent({
    source: (readBodyString(body, "source", { maxLength: 20 }) as "frontend" | "backend" | undefined) ?? "frontend",
    level: (readBodyString(body, "level", { maxLength: 20 }) as "info" | "warn" | "error" | undefined) ?? "error",
    message: readBodyString(body, "message", { required: true, maxLength: 500 }) ?? "Unknown error",
    context: ensureObjectRecord(body.context ?? {})
  });

  return {
    data: {
      event
    },
    status: 201
  };
}, {
  rateLimit: {
    limit: 300,
    windowMs: 60_000,
    keyPrefix: "observability-events"
  },
  audit: {
    action: "observability.events.capture"
  }
});
