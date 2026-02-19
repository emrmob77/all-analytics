import { afterEach, describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/errors";
import { verifyBearerToken } from "@/lib/security/jwt";

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

async function signJwt(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = {
    alg: "HS256",
    typ: "JWT"
  };

  const encodedHeader = encodeBase64Url(JSON.stringify(header));
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput));
  const encodedSignature = Buffer.from(signature).toString("base64url");

  return `${signingInput}.${encodedSignature}`;
}

describe("JWT verification", () => {
  afterEach(() => {
    delete process.env.API_JWT_SECRET;
  });

  it("verifies a valid HS256 bearer token", async () => {
    process.env.API_JWT_SECRET = "test-secret";
    const token = await signJwt(
      {
        sub: "user-1",
        tenant_id: "tenant-1",
        role: "admin",
        exp: Math.floor(Date.now() / 1000) + 60
      },
      process.env.API_JWT_SECRET
    );
    const request = new Request("http://localhost/api/v1/example", {
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    const claims = await verifyBearerToken(request);

    expect(claims.sub).toBe("user-1");
    expect(claims.tenant_id).toBe("tenant-1");
  });

  it("throws for an expired token", async () => {
    process.env.API_JWT_SECRET = "test-secret";
    const token = await signJwt(
      {
        sub: "user-1",
        exp: Math.floor(Date.now() / 1000) - 60
      },
      process.env.API_JWT_SECRET
    );
    const request = new Request("http://localhost/api/v1/example", {
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    await expect(verifyBearerToken(request)).rejects.toBeInstanceOf(ApiError);
  });
});
