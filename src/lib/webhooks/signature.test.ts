import { afterEach, describe, expect, it } from "vitest";

import { verifyWebhookSignature } from "@/lib/webhooks/signature";

async function signPayload(payload: string, secret: string, format: "base64" | "hex"): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));

  return format === "base64"
    ? Buffer.from(signature).toString("base64")
    : Buffer.from(signature).toString("hex");
}

describe("webhook signature verification", () => {
  afterEach(() => {
    delete process.env.WEBHOOK_SECRET_SHOPIFY;
    delete process.env.WEBHOOK_SECRET_META;
  });

  it("verifies Shopify base64 signature", async () => {
    process.env.WEBHOOK_SECRET_SHOPIFY = "shopify-secret";
    const rawBody = JSON.stringify({ id: "order_1", total_price: 100 });
    const signature = await signPayload(rawBody, process.env.WEBHOOK_SECRET_SHOPIFY, "base64");

    const result = await verifyWebhookSignature({
      provider: "shopify",
      rawBody,
      signature
    });

    expect(result.verified).toBe(true);
  });

  it("verifies Meta sha256-prefixed signature", async () => {
    process.env.WEBHOOK_SECRET_META = "meta-secret";
    const rawBody = JSON.stringify({ conversion_id: "conv_1", value: 42.5 });
    const signatureHex = await signPayload(rawBody, process.env.WEBHOOK_SECRET_META, "hex");

    const result = await verifyWebhookSignature({
      provider: "meta",
      rawBody,
      signature: `sha256=${signatureHex}`
    });

    expect(result.verified).toBe(true);
  });
});
