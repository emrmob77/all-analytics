import { ApiError } from "@/lib/api/errors";
import { createApiHandler } from "@/lib/api/handler";
import { ensureObjectRecord, readBodyBoolean, readBodyEnum, readBodyString, readStringParam } from "@/lib/api/validation";
import { listBillingPlans } from "@/lib/billing/plans";
import { getSubscription, listInvoices, updateSubscription } from "@/lib/billing/store";

const planIds = ["free", "pro", "team", "enterprise"] as const;
const cycles = ["monthly", "yearly"] as const;
const statuses = ["trialing", "active", "past_due", "canceled"] as const;

export const GET = createApiHandler(async (request) => {
  const url = new URL(request.url);
  const tenantId = readStringParam(url.searchParams, "tenantId", { required: true, maxLength: 120 }) ?? "";

  const subscription = getSubscription(tenantId);

  if (!subscription) {
    throw new ApiError({
      status: 404,
      code: "SUBSCRIPTION_NOT_FOUND",
      message: "No subscription found for tenant.",
      expose: true
    });
  }

  return {
    data: {
      subscription,
      invoices: listInvoices(tenantId),
      availablePlans: listBillingPlans()
    }
  };
}, {
  rateLimit: {
    limit: 120,
    windowMs: 60_000,
    keyPrefix: "billing-subscription-get"
  }
});

export const PUT = createApiHandler(async (_request, context) => {
  const body = ensureObjectRecord(await context.readJson());
  const tenantId = readBodyString(body, "tenantId", { required: true, maxLength: 120 }) ?? "";

  const updatedSubscription = updateSubscription({
    tenantId,
    planId: readBodyEnum(body, "planId", planIds),
    cycle: readBodyEnum(body, "cycle", cycles),
    status: readBodyEnum(body, "status", statuses),
    cancelAtPeriodEnd: readBodyBoolean(body, "cancelAtPeriodEnd")
  });

  if (!updatedSubscription) {
    throw new ApiError({
      status: 404,
      code: "SUBSCRIPTION_NOT_FOUND",
      message: "No subscription found for tenant.",
      expose: true
    });
  }

  return {
    data: {
      subscription: updatedSubscription
    }
  };
}, {
  rateLimit: {
    limit: 60,
    windowMs: 60_000,
    keyPrefix: "billing-subscription-put"
  },
  audit: {
    action: "billing.subscription.update"
  }
});
