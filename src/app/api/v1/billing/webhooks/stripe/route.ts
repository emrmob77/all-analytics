import { createApiHandler } from "@/lib/api/handler";
import { ensureObjectRecord, readBodyBoolean, readBodyString } from "@/lib/api/validation";

export const POST = createApiHandler(async (_request, context) => {
  const body = ensureObjectRecord(await context.readJson());

  const eventType = readBodyString(body, "eventType", { required: true, maxLength: 120 }) ?? "";
  const eventId = readBodyString(body, "eventId", { required: true, maxLength: 255 }) ?? "";
  const tenantId = readBodyString(body, "tenantId", { required: true, maxLength: 120 }) ?? "";

  const idempotencyKey = `stripe_webhook:${eventId}`;

  return {
    data: {
      received: true,
      eventType,
      tenantId,
      idempotencyKey,
      processedAt: new Date().toISOString(),
      // Demo mode only: payload validation is mocked.
      signatureVerified: readBodyBoolean(body, "signatureVerified") ?? true
    },
    status: 202
  };
}, {
  rateLimit: {
    limit: 200,
    windowMs: 60_000,
    keyPrefix: "billing-webhook-stripe"
  },
  audit: {
    action: "billing.webhook.stripe"
  }
});
