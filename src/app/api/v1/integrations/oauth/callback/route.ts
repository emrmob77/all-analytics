import { ApiError } from "@/lib/api/errors";
import { createApiHandler } from "@/lib/api/handler";
import { ensureObjectRecord, readBodyString } from "@/lib/api/validation";
import {
  calculateRotationDueAt,
  parseOAuthState
} from "@/lib/integrations/auth";
import { getIntegrationProviderByKey } from "@/lib/integrations/providerCatalog";

interface OAuthCallbackBodyDto {
  providerKey: string;
  code: string;
  state: string;
}

function parseOAuthCallbackBody(body: unknown): OAuthCallbackBodyDto {
  const record = ensureObjectRecord(body);

  return {
    providerKey: readBodyString(record, "providerKey", {
      required: true,
      maxLength: 80
    }) as string,
    code: readBodyString(record, "code", {
      required: true,
      minLength: 4,
      maxLength: 4096
    }) as string,
    state: readBodyString(record, "state", {
      required: true,
      minLength: 10,
      maxLength: 4096
    }) as string
  };
}

export const POST = createApiHandler(async (_request, context) => {
  const payload = parseOAuthCallbackBody(await context.readJson<unknown>());
  const provider = getIntegrationProviderByKey(payload.providerKey);

  if (!provider) {
    throw new ApiError({
      status: 404,
      code: "PROVIDER_NOT_FOUND",
      message: `Unknown provider key: '${payload.providerKey}'.`,
      expose: true
    });
  }

  if (!provider.authModes.includes("oauth2")) {
    throw new ApiError({
      status: 400,
      code: "AUTH_MODE_NOT_SUPPORTED",
      message: `${provider.name} does not support OAuth2 authentication.`,
      expose: true
    });
  }

  const oauthState = parseOAuthState(payload.state);
  context.requireTenantAccess(oauthState.brandId);

  if (oauthState.providerKey !== provider.key) {
    throw new ApiError({
      status: 400,
      code: "INVALID_OAUTH_STATE",
      message: "OAuth state does not match selected provider.",
      expose: true
    });
  }

  if (!provider.oauth) {
    throw new ApiError({
      status: 400,
      code: "AUTH_MODE_NOT_SUPPORTED",
      message: `${provider.name} is missing OAuth2 configuration.`,
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
        authMode: "oauth2",
        exchangedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        refreshTokenRotationDueAt:
          provider.oauth.supportsRefreshToken && provider.credentialRotation.refreshTokenDays
            ? calculateRotationDueAt(provider.credentialRotation.refreshTokenDays)
            : null
      },
      trace: {
        requestId: context.requestId,
        sourceRequestId: oauthState.requestId
      },
      tokenExchange: {
        status: "simulated",
        reason:
          "External provider token exchange is environment-specific and should be completed with provider credentials."
      }
    }
  };
}, {
  auth: {
    required: true
  },
  rateLimit: {
    limit: 30,
    windowMs: 60_000,
    keyPrefix: "integration-oauth-callback"
  },
  audit: {
    action: "integration.oauth.callback"
  }
});
