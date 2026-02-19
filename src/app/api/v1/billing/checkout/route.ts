import { ApiError } from "@/lib/api/errors";
import { createApiHandler } from "@/lib/api/handler";
import { ensureObjectRecord, readBodyEnum, readBodyString } from "@/lib/api/validation";
import type { BillingPlanId } from "@/lib/billing/plans";
import { getBillingPlan } from "@/lib/billing/plans";
import {
  cancelCheckoutSession,
  completeCheckoutSession,
  createCheckoutSession,
  type CheckoutSessionRecord,
  type SubscriptionRecord,
  type BillingCycle
} from "@/lib/billing/store";

const planIds = ["free", "pro", "team", "enterprise"] as const;
const cycles = ["monthly", "yearly"] as const;
const checkoutActions = ["create", "complete", "cancel"] as const;

type CheckoutAction = (typeof checkoutActions)[number];

interface CheckoutApiResponse {
  session?: CheckoutSessionRecord;
  checkoutUrl?: string;
  subscription?: SubscriptionRecord;
}

export const POST = createApiHandler<CheckoutApiResponse>(async (_request, context) => {
  const body = ensureObjectRecord(await context.readJson());

  const action = (readBodyEnum(body, "action", checkoutActions, { required: true }) ?? "create") as CheckoutAction;

  if (action === "create") {
    const tenantId = readBodyString(body, "tenantId", { required: true, maxLength: 120 }) ?? "";
    const planId = (readBodyEnum(body, "planId", planIds, { required: true }) ?? "free") as BillingPlanId;
    const cycle = (readBodyEnum(body, "cycle", cycles, { required: true }) ?? "monthly") as BillingCycle;
    const successUrl =
      readBodyString(body, "successUrl", { maxLength: 500 }) ?? "http://localhost:3000/checkout/success";
    const cancelUrl =
      readBodyString(body, "cancelUrl", { maxLength: 500 }) ?? "http://localhost:3000/checkout/cancel";

    if (!getBillingPlan(planId)) {
      throw new ApiError({
        status: 404,
        code: "PLAN_NOT_FOUND",
        message: "Selected plan does not exist.",
        expose: true
      });
    }

    const session = createCheckoutSession({
      tenantId,
      planId,
      cycle,
      successUrl,
      cancelUrl
    });

    return {
      data: {
        session,
        checkoutUrl: `${successUrl}?session_id=${session.id}`
      },
      status: 201
    };
  }

  const sessionId = readBodyString(body, "sessionId", { required: true, maxLength: 255 }) ?? "";

  if (action === "complete") {
    const subscription = completeCheckoutSession(sessionId);

    if (!subscription) {
      throw new ApiError({
        status: 404,
        code: "CHECKOUT_SESSION_NOT_FOUND",
        message: "Checkout session could not be found.",
        expose: true
      });
    }

    return {
      data: {
        subscription
      }
    };
  }

  const session = cancelCheckoutSession(sessionId);

  if (!session) {
    throw new ApiError({
      status: 404,
      code: "CHECKOUT_SESSION_NOT_FOUND",
      message: "Checkout session could not be found.",
      expose: true
    });
  }

  return {
    data: {
      session
    }
  };
}, {
  rateLimit: {
    limit: 30,
    windowMs: 60_000,
    keyPrefix: "billing-checkout"
  },
  audit: {
    action: "billing.checkout"
  }
});
