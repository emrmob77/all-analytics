import { afterEach, describe, expect, it } from "vitest";

import {
  buildOAuthAuthorizationUrl,
  createOAuthState,
  maskSecret,
  parseOAuthState
} from "@/lib/integrations/auth";
import { getIntegrationProviderByKey } from "@/lib/integrations/providerCatalog";

describe("integration auth helpers", () => {
  afterEach(() => {
    delete process.env.INTEGRATION_GOOGLE_ADS_CLIENT_ID;
  });

  it("creates and parses oauth state payload", () => {
    const state = createOAuthState({
      providerKey: "google-ads",
      requestId: "req_123",
      brandId: "brand_456"
    });
    const parsed = parseOAuthState(state);

    expect(parsed.providerKey).toBe("google-ads");
    expect(parsed.requestId).toBe("req_123");
    expect(parsed.brandId).toBe("brand_456");
    expect(parsed.nonce.length > 0).toBe(true);
  });

  it("builds authorization url with provider scopes", () => {
    process.env.INTEGRATION_GOOGLE_ADS_CLIENT_ID = "google-client-id";
    const provider = getIntegrationProviderByKey("google-ads");
    if (!provider) {
      throw new Error("google-ads provider not found");
    }

    const result = buildOAuthAuthorizationUrl({
      provider,
      redirectUri: "https://app.allanalytics.com/auth/callback",
      state: "state-123"
    });
    const url = new URL(result.authorizationUrl);

    expect(url.searchParams.get("client_id")).toBe("google-client-id");
    expect(url.searchParams.get("redirect_uri")).toBe("https://app.allanalytics.com/auth/callback");
    expect(url.searchParams.get("state")).toBe("state-123");
    expect(url.searchParams.get("scope")).toContain("googleapis");
    expect(result.clientConfigured).toBe(true);
  });

  it("masks secret values for previews", () => {
    expect(maskSecret("abcd1234efgh")).toBe("abcd******gh");
    expect(maskSecret("abc12")).toBe("*****");
  });
});
