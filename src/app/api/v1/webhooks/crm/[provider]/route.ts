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

const supportedCrmProviders = new Set<WebhookProvider>(["hubspot", "salesforce"]);

const signatureHeadersByProvider: Record<WebhookProvider, string> = {
  hubspot: "x-hubspot-signature",
  salesforce: "x-salesforce-signature",
  shopify: "x-shopify-hmac-sha256",
  meta: "x-hub-signature-256",
  google: "x-goog-signature"
};

export const POST = createApiHandler(async (request, context) => {
  const provider = parsePathParam(
    context.url.pathname,
    /\/api\/v1\/webhooks\/crm\/([^/]+)$/,
    "crm provider"
  ) as WebhookProvider;

  if (!supportedCrmProviders.has(provider)) {
    throw new ApiError({
      status: 400,
      code: "WEBHOOK_PROVIDER_UNSUPPORTED",
      message: `Unsupported CRM webhook provider '${provider}'.`,
      expose: true
    });
  }

  const eventType = `${provider}.crm_event`;
  const signature = readHeaderOrThrow(request, signatureHeadersByProvider[provider]);
  const sourceId = readFirstHeader(request, [
    "x-event-id",
    "x-hubspot-event-id",
    "x-salesforce-event-id"
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
    keyPrefix: "webhooks-crm"
  },
  audit: {
    action: "webhooks.crm.ingest"
  }
});
