import { createApiHandler } from "@/lib/api/handler";
import { listBillingPlans } from "@/lib/billing/plans";

export const GET = createApiHandler(async () => {
  return {
    data: {
      plans: listBillingPlans()
    }
  };
}, {
  rateLimit: {
    limit: 120,
    windowMs: 60_000,
    keyPrefix: "billing-plans"
  }
});
