import { describe, expect, it } from "vitest";

import { completeCheckoutSession, createCheckoutSession, getSubscription } from "@/lib/billing/store";

describe("billing store", () => {
  it("creates and completes checkout session", () => {
    const session = createCheckoutSession({
      tenantId: "brand-1",
      planId: "pro",
      cycle: "monthly",
      successUrl: "http://localhost:3000/checkout/success",
      cancelUrl: "http://localhost:3000/checkout/cancel"
    });

    const subscription = completeCheckoutSession(session.id);

    expect(subscription).not.toBeNull();
    expect(getSubscription("brand-1")?.planId).toBe("pro");
  });
});
