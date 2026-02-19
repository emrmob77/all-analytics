import { ApiError } from "@/lib/api/errors";
import type {
  WebhookProvider,
  WebhookSignatureScheme,
  WebhookVerificationInput,
  WebhookVerificationResult
} from "@/lib/webhooks/types";

const env = (
  globalThis as {
    process?: { env?: Record<string, string | undefined> };
  }
).process?.env ?? {};

const providerSignatureConfig: Record<
  WebhookProvider,
  {
    secretEnv: string;
    scheme: WebhookSignatureScheme;
  }
> = {
  shopify: {
    secretEnv: "WEBHOOK_SECRET_SHOPIFY",
    scheme: "base64-hmac-sha256"
  },
  hubspot: {
    secretEnv: "WEBHOOK_SECRET_HUBSPOT",
    scheme: "hex-hmac-sha256"
  },
  salesforce: {
    secretEnv: "WEBHOOK_SECRET_SALESFORCE",
    scheme: "hex-hmac-sha256"
  },
  meta: {
    secretEnv: "WEBHOOK_SECRET_META",
    scheme: "sha256-prefixed-hex"
  },
  google: {
    secretEnv: "WEBHOOK_SECRET_GOOGLE",
    scheme: "hex-hmac-sha256"
  }
};

function timingSafeEqualString(leftValue: string, rightValue: string): boolean {
  const leftBuffer = Buffer.from(leftValue);
  const rightBuffer = Buffer.from(rightValue);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  let difference = 0;

  for (let index = 0; index < leftBuffer.length; index += 1) {
    difference |= leftBuffer[index] ^ rightBuffer[index];
  }

  return difference === 0;
}

function normalizeSignature(signature: string, scheme: WebhookSignatureScheme): string {
  if (scheme === "sha256-prefixed-hex") {
    return signature.replace(/^sha256=/i, "").trim().toLowerCase();
  }

  if (scheme === "hex-hmac-sha256") {
    return signature.trim().toLowerCase();
  }

  return signature.trim();
}

async function signPayload(
  payload: string,
  secret: string,
  scheme: WebhookSignatureScheme
): Promise<string> {
  const secretKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    secretKey,
    new TextEncoder().encode(payload)
  );

  if (scheme === "base64-hmac-sha256") {
    return Buffer.from(signatureBuffer).toString("base64");
  }

  return Buffer.from(signatureBuffer).toString("hex");
}

function resolveWebhookSecret(provider: WebhookProvider): string {
  const config = providerSignatureConfig[provider];
  const secret = env[config.secretEnv]?.trim();

  if (!secret) {
    throw new ApiError({
      status: 500,
      code: "WEBHOOK_SECRET_MISSING",
      message: `Webhook secret is missing for provider '${provider}'.`,
      details: {
        envKey: config.secretEnv
      },
      expose: true
    });
  }

  return secret;
}

async function verifyWebhookSignature(
  input: WebhookVerificationInput
): Promise<WebhookVerificationResult> {
  const providerConfig = providerSignatureConfig[input.provider];
  const secret = resolveWebhookSecret(input.provider);
  const expectedSignature = await signPayload(
    input.rawBody,
    secret,
    providerConfig.scheme
  );
  const normalizedExpected = normalizeSignature(expectedSignature, providerConfig.scheme);
  const normalizedProvided = normalizeSignature(input.signature, providerConfig.scheme);

  return {
    verified: timingSafeEqualString(normalizedExpected, normalizedProvided),
    scheme: providerConfig.scheme
  };
}

export { verifyWebhookSignature };
