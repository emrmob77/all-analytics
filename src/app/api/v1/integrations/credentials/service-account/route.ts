import { ApiError } from "@/lib/api/errors";
import { createApiHandler } from "@/lib/api/handler";
import { ensureObjectRecord, readBodyString } from "@/lib/api/validation";
import { calculateRotationDueAt, maskSecret } from "@/lib/integrations/auth";
import { getIntegrationProviderByKey } from "@/lib/integrations/providerCatalog";

interface ServiceAccountCredentialBodyDto {
  providerKey: string;
  clientEmail: string;
  privateKeyId: string;
  projectId?: string;
  brandId?: string;
}

function parseServiceAccountCredentialBody(body: unknown): ServiceAccountCredentialBodyDto {
  const record = ensureObjectRecord(body);

  return {
    providerKey: readBodyString(record, "providerKey", {
      required: true,
      maxLength: 80
    }) as string,
    clientEmail: readBodyString(record, "clientEmail", {
      required: true,
      minLength: 5,
      maxLength: 320
    }) as string,
    privateKeyId: readBodyString(record, "privateKeyId", {
      required: true,
      minLength: 6,
      maxLength: 256
    }) as string,
    projectId: readBodyString(record, "projectId", {
      maxLength: 128
    }),
    brandId: readBodyString(record, "brandId", {
      maxLength: 128
    })
  };
}

function validateEmail(value: string): string {
  const normalized = value.trim();
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);

  if (!isValid) {
    throw new ApiError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Invalid 'clientEmail' parameter: must be a valid email address.",
      expose: true
    });
  }

  return normalized;
}

export const POST = createApiHandler(async (_request, context) => {
  const payload = parseServiceAccountCredentialBody(await context.readJson<unknown>());
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

  if (!provider.authModes.includes("service_account")) {
    throw new ApiError({
      status: 400,
      code: "AUTH_MODE_NOT_SUPPORTED",
      message: `${provider.name} does not support service account authentication.`,
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
        authMode: "service_account",
        clientEmail: validateEmail(payload.clientEmail),
        projectId: payload.projectId ?? null,
        privateKeyIdPreview: maskSecret(payload.privateKeyId),
        rotationDueAt: provider.credentialRotation.serviceAccountKeyDays
          ? calculateRotationDueAt(provider.credentialRotation.serviceAccountKeyDays)
          : null
      },
      credentialStorage: {
        status: "simulated",
        recommendation:
          "Store service account private key material in a managed secret vault and rotate by policy."
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
    keyPrefix: "integration-service-account"
  },
  audit: {
    action: "integration.credentials.service_account"
  }
});
