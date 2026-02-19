import { beforeEach, describe, expect, it } from "vitest";

import {
  clearWebhookStores,
  listWebhookDeadLetters,
  listWebhookEvents,
  recordWebhookDeadLetter,
  recordWebhookEvent
} from "@/lib/webhooks/store";

describe("webhook store", () => {
  beforeEach(() => {
    clearWebhookStores();
  });

  it("stores accepted/rejected webhook events", async () => {
    await recordWebhookEvent({
      provider: "shopify",
      eventType: "shopify.orders",
      sourceId: "evt_1",
      payload: "{\"id\":\"1\"}",
      status: "accepted"
    });
    await recordWebhookEvent({
      provider: "meta",
      eventType: "meta.conversion_event",
      sourceId: "evt_2",
      payload: "{\"id\":\"2\"}",
      status: "rejected",
      reason: "signature_failed"
    });

    const events = listWebhookEvents();

    expect(events).toHaveLength(2);
    expect(events[0]?.status).toBe("rejected");
    expect(events[1]?.status).toBe("accepted");
  });

  it("stores webhook dead letters", () => {
    recordWebhookDeadLetter({
      provider: "google",
      eventType: "google.conversion_event",
      reason: "replay_detected",
      payload: "{\"event\":\"dup\"}"
    });

    const deadLetters = listWebhookDeadLetters();

    expect(deadLetters).toHaveLength(1);
    expect(deadLetters[0]?.reason).toBe("replay_detected");
  });
});
