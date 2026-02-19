import { describe, expect, it } from "vitest";

import { clearReplayProtectionStore, registerWebhookReplayKey } from "@/lib/webhooks/replay";

describe("webhook replay protection", () => {
  it("detects duplicate replay keys within the window", () => {
    clearReplayProtectionStore();

    const first = registerWebhookReplayKey("shopify:orders:event-1", 10_000);
    const second = registerWebhookReplayKey("shopify:orders:event-1", 10_000);

    expect(first.duplicate).toBe(false);
    expect(second.duplicate).toBe(true);
  });
});
