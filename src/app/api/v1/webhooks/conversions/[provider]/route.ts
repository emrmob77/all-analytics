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
import type { WebhookProvider } from "@/lib/webhooks/types";

const supportedConversionProviders = new Set<WebhookProvider>(["meta", "google"]);

const signatureHeadersByProvider: Record<WebhookProvider, string> = {
  meta: "x-hub-signature-256",
  google: "x-goog-signature",
  shopify: "x-shopify-hmac-sha256",
  hubspot: "x-hubspot-signature",
  salesforce: "x-salesforce-signature"
};

export const POST = createApiHandler(async (request, context) => {
  const provider = parsePathParam(
    context.url.pathname,
    /\/api\/v1\/webhooks\/conversions\/([^/]+)$/,
    "conversion provider"
  ) as WebhookProvider;

  if (!supportedConversionProviders.has(provider)) {
    throw new ApiError({
      status: 400,
      code: "WEBHOOK_PROVIDER_UNSUPPORTED",
      message: `Unsupported conversion webhook provider '${provider}'.`,
      expose: true
    });
  }

  const eventType = `${provider}.conversion_event`;
  const signature = readHeaderOrThrow(request, signatureHeadersByProvider[provider]);
  const sourceId = readFirstHeader(request, [
    "x-event-id",
    "x-meta-event-id",
    "x-goog-request-id"
  ]);
  const rawBody = await request.text();

  try {
    await validateWebhookSecurity({
      provider,
      eventType,
      sourceId,
      signature,
      rawBody
    });

    const payload = await parseWebhookJson(rawBody);
    const recordedEvent = await recordWebhookEvent({
      provider,
      eventType,
      sourceId,
      payload: rawBody,
      status: "accepted"
    });

    return {
      data: {
        accepted: true,
        provider,
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
          provider,
          eventType,
          sourceId,
          payload: rawBody,
          status: "rejected",
          reason: error.code
        });
        recordWebhookDeadLetter({
          provider,
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
    limit: 240,
    windowMs: 60_000,
    keyPrefix: "webhooks-conversions"
  },
  audit: {
    action: "webhooks.conversions.ingest"
  }
});
