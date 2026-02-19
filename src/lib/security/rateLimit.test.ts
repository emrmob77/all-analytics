import { describe, expect, it } from "vitest";

import { clearRateLimitStore, consumeRateLimit } from "@/lib/security/rateLimit";

describe("rate limit", () => {
  it("blocks requests after limit is reached", () => {
    clearRateLimitStore();

    const first = consumeRateLimit("rate-limit:test", {
      limit: 2,
      windowMs: 60_000
    });
    const second = consumeRateLimit("rate-limit:test", {
      limit: 2,
      windowMs: 60_000
    });
    const third = consumeRateLimit("rate-limit:test", {
      limit: 2,
      windowMs: 60_000
    });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(0);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSec > 0).toBe(true);
  });
});
