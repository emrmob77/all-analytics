import { ApiError } from "@/lib/api/errors";
import { registerWebhookReplayKey } from "@/lib/webhooks/replay";
import { recordWebhookDeadLetter, recordWebhookEvent } from "@/lib/webhooks/store";
import { verifyWebhookSignature } from "@/lib/webhooks/signature";
import type { WebhookProvider } from "@/lib/webhooks/types";

function parsePathParam(pathname: string, pattern: RegExp, label: string): string {
  const matched = pathname.match(pattern);

  if (!matched?.[1]) {
    throw new ApiError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: `Could not resolve ${label} from webhook path.`,
      expose: true
    });
  }

  return decodeURIComponent(matched[1]).trim().toLowerCase();
}

function readHeaderOrThrow(request: Request, headerName: string): string {
  const headerValue = request.headers.get(headerName)?.trim();

  if (!headerValue) {
    throw new ApiError({
      status: 400,
      code: "WEBHOOK_HEADER_MISSING",
      message: `Required webhook header '${headerName}' is missing.`,
      expose: true
    });
  }

  return headerValue;
}

function readFirstHeader(
  request: Request,
  headerNames: string[]
): string | undefined {
  for (const headerName of headerNames) {
    const headerValue = request.headers.get(headerName)?.trim();

    if (headerValue) {
      return headerValue;
    }
  }

  return undefined;
}

async function validateWebhookSecurity(input: {
  provider: WebhookProvider;
  eventType: string;
  sourceId?: string;
  signature: string;
  rawBody: string;
}): Promise<void> {
  const verification = await verifyWebhookSignature({
    provider: input.provider,
    signature: input.signature,
    rawBody: input.rawBody
  });

  if (!verification.verified) {
    await recordWebhookEvent({
      provider: input.provider,
      eventType: input.eventType,
      sourceId: input.sourceId,
      payload: input.rawBody,
      status: "rejected",
      reason: "signature_verification_failed"
    });
    recordWebhookDeadLetter({
      provider: input.provider,
      eventType: input.eventType,
      reason: "signature_verification_failed",
      payload: input.rawBody
    });

    throw new ApiError({
      status: 401,
      code: "WEBHOOK_SIGNATURE_INVALID",
      message: "Webhook signature verification failed.",
      details: {
        scheme: verification.scheme
      },
      expose: true
    });
  }

  const replayKey = [
    input.provider,
    input.eventType,
    input.sourceId ?? "no-source-id"
  ].join(":");
  const replayRegistration = registerWebhookReplayKey(replayKey);

  if (replayRegistration.duplicate) {
    await recordWebhookEvent({
      provider: input.provider,
      eventType: input.eventType,
      sourceId: input.sourceId,
      payload: input.rawBody,
      status: "rejected",
      reason: "replay_detected"
    });
    recordWebhookDeadLetter({
      provider: input.provider,
      eventType: input.eventType,
      reason: "replay_detected",
      payload: input.rawBody
    });

    throw new ApiError({
      status: 409,
      code: "WEBHOOK_REPLAY_DETECTED",
      message: "Duplicate webhook replay detected.",
      expose: true
    });
  }
}

async function parseWebhookJson(rawBody: string): Promise<unknown> {
  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    throw new ApiError({
      status: 400,
      code: "INVALID_JSON",
      message: "Webhook payload must be valid JSON.",
      expose: true
    });
  }
}

export {
  parsePathParam,
  parseWebhookJson,
  readFirstHeader,
  readHeaderOrThrow,
  validateWebhookSecurity
};
