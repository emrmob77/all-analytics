import { createApiHandler } from "@/lib/api/handler";
import { ensureObjectRecord, readBodyString } from "@/lib/api/validation";
import { createBillingPortalUrl } from "@/lib/billing/store";

export const POST = createApiHandler(async (_request, context) => {
  const body = ensureObjectRecord(await context.readJson());
  const tenantId = readBodyString(body, "tenantId", { required: true, maxLength: 120 }) ?? "";

  return {
    data: {
      portalUrl: createBillingPortalUrl(tenantId)
    }
  };
}, {
  rateLimit: {
    limit: 30,
    windowMs: 60_000,
    keyPrefix: "billing-portal"
  },
  audit: {
    action: "billing.portal"
  }
});
