import { ApiError } from "@/lib/api/errors";
import type { IntegrationProviderDefinition } from "@/lib/integrations/types";

const oauthClientEnvPrefix = "INTEGRATION_";
const oauthClientEnvSuffix = "_CLIENT_ID";

interface OAuthClientResolution {
  configured: boolean;
  clientId: string;
  envKey: string;
}

interface OAuthStatePayload {
  providerKey: string;
  requestId: string;
  brandId?: string;
  nonce: string;
  issuedAt: number;
}

interface BuildOAuthAuthorizationUrlInput {
  provider: IntegrationProviderDefinition;
  redirectUri: string;
  state: string;
}

interface BuildOAuthAuthorizationUrlResult {
  authorizationUrl: string;
  clientConfigured: boolean;
  clientIdEnvKey: string;
}

const env = (
  globalThis as {
    process?: { env?: Record<string, string | undefined> };
  }
).process?.env ?? {};

function toOAuthClientEnvKey(providerKey: string): string {
  return `${oauthClientEnvPrefix}${providerKey.toUpperCase().replace(/-/g, "_")}${oauthClientEnvSuffix}`;
}

function resolveOAuthClientId(providerKey: string): OAuthClientResolution {
  const envKey = toOAuthClientEnvKey(providerKey);
  const providerClientId = env[envKey]?.trim();
  const defaultClientId = env.INTEGRATION_DEFAULT_CLIENT_ID?.trim();

  if (providerClientId) {
    return {
      configured: true,
      clientId: providerClientId,
      envKey
    };
  }

  if (defaultClientId) {
    return {
      configured: true,
      clientId: defaultClientId,
      envKey
    };
  }

  return {
    configured: false,
    clientId: "demo-client-id",
    envKey
  };
}

function createOAuthState(input: {
  providerKey: string;
  requestId: string;
  brandId?: string;
}): string {
  const payload: OAuthStatePayload = {
    providerKey: input.providerKey,
    requestId: input.requestId,
    brandId: input.brandId,
    nonce:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2, 18),
    issuedAt: Date.now()
  };

  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function parseOAuthState(state: string): OAuthStatePayload {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as Partial<OAuthStatePayload>;

    if (
      !parsed ||
      typeof parsed.providerKey !== "string" ||
      typeof parsed.requestId !== "string" ||
      typeof parsed.nonce !== "string" ||
      typeof parsed.issuedAt !== "number"
    ) {
      throw new Error("missing-fields");
    }

    return {
      providerKey: parsed.providerKey,
      requestId: parsed.requestId,
      brandId: typeof parsed.brandId === "string" ? parsed.brandId : undefined,
      nonce: parsed.nonce,
      issuedAt: parsed.issuedAt
    };
  } catch {
    throw new ApiError({
      status: 400,
      code: "INVALID_OAUTH_STATE",
      message: "OAuth state is invalid or malformed.",
      expose: true
    });
  }
}

function buildOAuthAuthorizationUrl(
  input: BuildOAuthAuthorizationUrlInput
): BuildOAuthAuthorizationUrlResult {
  if (!input.provider.oauth) {
    throw new ApiError({
      status: 400,
      code: "AUTH_MODE_NOT_SUPPORTED",
      message: `${input.provider.name} does not support OAuth2 authentication.`,
      expose: true
    });
  }

  const { clientId, configured, envKey } = resolveOAuthClientId(input.provider.key);
  const authorizationUrl = new URL(input.provider.oauth.authorizationUrl);
  const scope = input.provider.oauth.defaultScopes.join(" ");

  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("redirect_uri", input.redirectUri);
  authorizationUrl.searchParams.set("state", input.state);

  if (scope.length > 0) {
    authorizationUrl.searchParams.set("scope", scope);
  }

  for (const [key, value] of Object.entries(input.provider.oauth.additionalAuthorizeParams ?? {})) {
    authorizationUrl.searchParams.set(key, value);
  }

  return {
    authorizationUrl: authorizationUrl.toString(),
    clientConfigured: configured,
    clientIdEnvKey: envKey
  };
}

function calculateRotationDueAt(rotationDays: number): string {
  const dueAt = new Date();
  dueAt.setUTCDate(dueAt.getUTCDate() + Math.max(1, rotationDays));
  return dueAt.toISOString();
}

function maskSecret(secret: string): string {
  if (secret.length <= 6) {
    return "*".repeat(secret.length);
  }

  return `${secret.slice(0, 4)}${"*".repeat(Math.max(4, secret.length - 6))}${secret.slice(-2)}`;
}

export {
  buildOAuthAuthorizationUrl,
  calculateRotationDueAt,
  createOAuthState,
  maskSecret,
  parseOAuthState,
  resolveOAuthClientId,
  toOAuthClientEnvKey
};
export type { OAuthStatePayload };
