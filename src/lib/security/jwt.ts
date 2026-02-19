import { ApiError } from "@/lib/api/errors";

interface JwtHeader {
  alg?: string;
  typ?: string;
}

interface JwtClaims {
  sub?: string;
  user_id?: string;
  tenant_id?: string;
  brand_id?: string;
  tenantId?: string;
  role?: string;
  roles?: string[];
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

const env = (
  globalThis as {
    process?: { env?: Record<string, string | undefined> };
  }
).process?.env ?? {};

function getJwtSecret(): string {
  const secret = (env.API_JWT_SECRET ?? env.JWT_SECRET ?? "").trim();

  if (secret.length === 0) {
    throw new ApiError({
      status: 500,
      code: "JWT_SECRET_MISSING",
      message: "JWT verification secret is missing.",
      expose: true
    });
  }

  return secret;
}

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return new Uint8Array(Buffer.from(padded, "base64"));
}

function decodeBase64UrlText(value: string): string {
  return Buffer.from(decodeBase64Url(value)).toString("utf8");
}

function timingSafeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let diff = 0;

  for (let index = 0; index < left.length; index += 1) {
    diff |= left[index] ^ right[index];
  }

  return diff === 0;
}

function parseJwtParts(token: string) {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new ApiError({
      status: 401,
      code: "INVALID_JWT",
      message: "JWT format is invalid.",
      expose: true
    });
  }

  return {
    header: parts[0],
    payload: parts[1],
    signature: parts[2]
  };
}

function parseJwtJson<TPayload>(base64UrlValue: string, errorCode: string, fieldLabel: string): TPayload {
  try {
    const rawText = decodeBase64UrlText(base64UrlValue);
    return JSON.parse(rawText) as TPayload;
  } catch {
    throw new ApiError({
      status: 401,
      code: errorCode,
      message: `${fieldLabel} is not valid JSON.`,
      expose: true
    });
  }
}

async function verifyJwtSignature(token: string): Promise<JwtClaims> {
  const secret = getJwtSecret();
  const { header, payload, signature } = parseJwtParts(token);

  const parsedHeader = parseJwtJson<JwtHeader>(header, "INVALID_JWT_HEADER", "JWT header");

  if (parsedHeader.alg !== "HS256") {
    throw new ApiError({
      status: 401,
      code: "UNSUPPORTED_JWT_ALGORITHM",
      message: "Only HS256 JWT algorithm is supported.",
      expose: true
    });
  }

  const encoder = new TextEncoder();
  const signingKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );

  const signedValue = `${header}.${payload}`;
  const expectedSignature = new Uint8Array(
    await crypto.subtle.sign("HMAC", signingKey, encoder.encode(signedValue))
  );
  const actualSignature = decodeBase64Url(signature);

  if (!timingSafeEqual(expectedSignature, actualSignature)) {
    throw new ApiError({
      status: 401,
      code: "INVALID_JWT_SIGNATURE",
      message: "JWT signature is invalid.",
      expose: true
    });
  }

  return parseJwtJson<JwtClaims>(payload, "INVALID_JWT_PAYLOAD", "JWT payload");
}

function validateJwtExpiry(claims: JwtClaims): void {
  if (typeof claims.exp !== "number") {
    return;
  }

  const nowSec = Math.floor(Date.now() / 1000);

  if (claims.exp <= nowSec) {
    throw new ApiError({
      status: 401,
      code: "JWT_EXPIRED",
      message: "JWT token has expired.",
      expose: true
    });
  }
}

function getBearerTokenFromRequest(request: Request): string {
  const authHeader = request.headers.get("authorization")?.trim();

  if (!authHeader) {
    throw new ApiError({
      status: 401,
      code: "AUTH_TOKEN_REQUIRED",
      message: "Authorization header is required.",
      expose: true
    });
  }

  const [scheme, token] = authHeader.split(/\s+/, 2);

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    throw new ApiError({
      status: 401,
      code: "AUTH_TOKEN_INVALID",
      message: "Authorization header must use Bearer token format.",
      expose: true
    });
  }

  return token;
}

async function verifyBearerToken(request: Request): Promise<JwtClaims> {
  const token = getBearerTokenFromRequest(request);
  const claims = await verifyJwtSignature(token);
  validateJwtExpiry(claims);
  return claims;
}

export { verifyBearerToken };
export type { JwtClaims };
