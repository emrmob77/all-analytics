import { ApiError } from "@/lib/api/errors";
import { createApiHandler } from "@/lib/api/handler";
import { ensureObjectRecord, readBodyString } from "@/lib/api/validation";
import { calculateRotationDueAt, maskSecret } from "@/lib/integrations/auth";
import { getIntegrationProviderByKey } from "@/lib/integrations/providerCatalog";

interface ApiKeyCredentialBodyDto {
  providerKey: string;
  apiKey: string;
  label?: string;
  brandId?: string;
}

function parseApiKeyCredentialBody(body: unknown): ApiKeyCredentialBodyDto {
  const record = ensureObjectRecord(body);

  return {
    providerKey: readBodyString(record, "providerKey", {
      required: true,
      maxLength: 80
    }) as string,
    apiKey: readBodyString(record, "apiKey", {
      required: true,
      minLength: 8,
      maxLength: 512,
      trim: false
    }) as string,
    label: readBodyString(record, "label", {
      maxLength: 80
    }),
    brandId: readBodyString(record, "brandId", {
      maxLength: 128
    })
  };
}

export const POST = createApiHandler(async (_request, context) => {
  const payload = parseApiKeyCredentialBody(await context.readJson<unknown>());
  context.requireTenantAccess(payload.brandId);
  const provider = getIntegrationProviderByKey(payload.providerKey);

  if (!provider) {
    throw new ApiError({
      status: 404,
      code: "PROVIDER_NOT_FOUND",
      message: `Unknown provider key: '${payload.providerKey}'.`,
      expose: true
    });
  }

  if (!provider.authModes.includes("api_key")) {
    throw new ApiError({
      status: 400,
      code: "AUTH_MODE_NOT_SUPPORTED",
      message: `${provider.name} does not support API key authentication.`,
      expose: true
    });
  }

  return {
    data: {
      connection: {
        id:
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `conn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`,
        providerKey: provider.key,
        status: "connected",
        authMode: "api_key",
        label: payload.label ?? provider.name,
        keyPreview: maskSecret(payload.apiKey),
        rotationDueAt: provider.credentialRotation.apiKeyDays
          ? calculateRotationDueAt(provider.credentialRotation.apiKeyDays)
          : null
      },
      credentialStorage: {
        status: "simulated",
        recommendation: "Persist encrypted credentials using KMS/secret manager before production rollout."
      }
    }
  };
}, {
  auth: {
    required: true
  },
  rateLimit: {
    limit: 20,
    windowMs: 60_000,
    keyPrefix: "integration-api-key"
  },
  audit: {
    action: "integration.credentials.api_key"
  }
});
