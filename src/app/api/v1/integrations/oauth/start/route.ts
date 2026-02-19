import { ApiError } from "@/lib/api/errors";
import { createApiHandler } from "@/lib/api/handler";
import { ensureObjectRecord, readBodyString } from "@/lib/api/validation";
import {
  buildOAuthAuthorizationUrl,
  createOAuthState
} from "@/lib/integrations/auth";
import { getIntegrationProviderByKey } from "@/lib/integrations/providerCatalog";

interface OAuthStartBodyDto {
  providerKey: string;
  redirectUri: string;
  brandId?: string;
}

function parseOAuthStartBody(body: unknown): OAuthStartBodyDto {
  const record = ensureObjectRecord(body);

  return {
    providerKey: readBodyString(record, "providerKey", {
      required: true,
      maxLength: 80
    }) as string,
    redirectUri: readBodyString(record, "redirectUri", {
      required: true,
      maxLength: 2048
    }) as string,
    brandId: readBodyString(record, "brandId", {
      maxLength: 128
    })
  };
}

function normalizeRedirectUri(value: string): string {
  let redirectUri: URL;

  try {
    redirectUri = new URL(value);
  } catch {
    throw new ApiError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Invalid 'redirectUri' parameter: must be a valid absolute URL.",
      expose: true
    });
  }

  if (redirectUri.protocol !== "https:" && redirectUri.protocol !== "http:") {
    throw new ApiError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Invalid 'redirectUri' parameter: only http/https protocols are allowed.",
      expose: true
    });
  }

  return redirectUri.toString();
}

export const POST = createApiHandler(async (_request, context) => {
  const payload = parseOAuthStartBody(await context.readJson<unknown>());
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

  if (!provider.authModes.includes("oauth2")) {
    throw new ApiError({
      status: 400,
      code: "AUTH_MODE_NOT_SUPPORTED",
      message: `${provider.name} does not support OAuth2 authentication.`,
      expose: true
    });
  }

  const redirectUri = normalizeRedirectUri(payload.redirectUri);
  const state = createOAuthState({
    providerKey: provider.key,
    requestId: context.requestId,
    brandId: payload.brandId
  });
  const authorization = buildOAuthAuthorizationUrl({
    provider,
    redirectUri,
    state
  });

  return {
    data: {
      provider: {
        key: provider.key,
        name: provider.name
      },
      authMode: "oauth2",
      redirectUri,
      authorizationUrl: authorization.authorizationUrl,
      state,
      scopes: provider.oauth?.defaultScopes ?? [],
      refreshToken: {
        supported: provider.oauth?.supportsRefreshToken ?? false,
        rotationDays: provider.credentialRotation.refreshTokenDays ?? null
      },
      clientConfiguration: {
        configured: authorization.clientConfigured,
        envKey: authorization.clientIdEnvKey
      }
    }
  };
}, {
  auth: {
    required: true
  },
  rateLimit: {
    limit: 40,
    windowMs: 60_000,
    keyPrefix: "integration-oauth-start"
  },
  audit: {
    action: "integration.oauth.start"
  }
});
