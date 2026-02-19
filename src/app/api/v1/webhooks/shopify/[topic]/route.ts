import { ApiError } from "@/lib/api/errors";
import { createApiHandler } from "@/lib/api/handler";
import {
  parsePathParam,
  parseWebhookJson,
  readFirstHeader,
  readHeaderOrThrow,
  validateWebhookSecurity
} from "@/lib/webhooks/ingestion";
import { recordWebhookDeadLetter, recordWebhookEvent } from "@/lib/webhooks/store";

const supportedShopifyTopics = new Set(["orders", "refunds", "products"]);

export const POST = createApiHandler(async (request, context) => {
  const topic = parsePathParam(
    context.url.pathname,
    /\/api\/v1\/webhooks\/shopify\/([^/]+)$/,
    "shopify topic"
  );
  const eventType = `shopify.${topic}`;

  if (!supportedShopifyTopics.has(topic)) {
    throw new ApiError({
      status: 400,
      code: "WEBHOOK_TOPIC_UNSUPPORTED",
      message: `Unsupported Shopify webhook topic '${topic}'.`,
      expose: true
    });
  }

  const signature = readHeaderOrThrow(request, "x-shopify-hmac-sha256");
  const sourceId = readFirstHeader(request, [
    "x-shopify-webhook-id",
    "x-shopify-order-id",
    "x-shopify-shop-domain"
  ]);
  const rawBody = await request.text();

  try {
    await validateWebhookSecurity({
      provider: "shopify",
      eventType,
      sourceId,
      signature,
      rawBody
    });

    const payload = await parseWebhookJson(rawBody);
    const recordedEvent = await recordWebhookEvent({
      provider: "shopify",
      eventType,
      sourceId,
      payload: rawBody,
      status: "accepted"
    });

    return {
      data: {
        accepted: true,
        provider: "shopify",
        topic,
        event: recordedEvent,
        payloadType: typeof payload
      }
    };
  } catch (error) {
    if (error instanceof ApiError) {
      if (
        error.code !== "WEBHOOK_SIGNATURE_INVALID" &&
        error.code !== "WEBHOOK_REPLAY_DETECTED"
      ) {
        await recordWebhookEvent({
          provider: "shopify",
          eventType,
          sourceId,
          payload: rawBody,
          status: "rejected",
          reason: error.code
        });
        recordWebhookDeadLetter({
          provider: "shopify",
          eventType,
          reason: error.code,
          payload: rawBody
        });
      }
    }

    throw error;
  }
}, {
  rateLimit: {
    limit: 300,
    windowMs: 60_000,
    keyPrefix: "webhooks-shopify"
  },
  audit: {
    action: "webhooks.shopify.ingest"
  }
});
