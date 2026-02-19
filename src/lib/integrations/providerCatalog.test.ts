import { describe, expect, it } from "vitest";

import { integrationProviderCatalog, listIntegrationProviders } from "@/lib/integrations/providerCatalog";

const requiredProviderKeys = [
  "google-ads",
  "meta-ads",
  "tiktok-ads",
  "linkedin-ads",
  "pinterest-ads",
  "microsoft-ads",
  "yandex-ads",
  "snapchat-ads",
  "x-ads",
  "reddit-ads",
  "amazon-ads",
  "ga4",
  "search-console",
  "youtube-analytics",
  "mixpanel",
  "amplitude",
  "adobe-analytics",
  "shopify",
  "woocommerce",
  "bigcommerce",
  "magento",
  "amazon-seller-central",
  "etsy",
  "hubspot",
  "salesforce",
  "pipedrive",
  "klaviyo",
  "mailchimp",
  "activecampaign",
  "brevo",
  "bigquery",
  "snowflake",
  "redshift",
  "databricks",
  "postgresql",
  "zendesk",
  "intercom",
  "freshdesk",
  "slack"
] as const;

describe("integrationProviderCatalog", () => {
  it("contains every provider required by task 22.2", () => {
    const keys = new Set(integrationProviderCatalog.map((provider) => provider.key));

    expect(integrationProviderCatalog).toHaveLength(requiredProviderKeys.length);
    for (const key of requiredProviderKeys) {
      expect(keys.has(key)).toBe(true);
    }
  });

  it("defines oauth scopes and rotation plan for oauth providers", () => {
    for (const provider of integrationProviderCatalog) {
      if (!provider.authModes.includes("oauth2")) {
        continue;
      }

      expect(provider.oauth).toBeDefined();
      expect((provider.oauth?.defaultScopes.length ?? 0) > 0).toBe(true);
      expect((provider.credentialRotation.refreshTokenDays ?? 0) > 0).toBe(true);
    }
  });

  it("filters providers by category and auth mode", () => {
    const onlyAds = listIntegrationProviders({ category: "ads" });
    const oauthOnly = listIntegrationProviders({ authMode: "oauth2" });

    expect(onlyAds.every((provider) => provider.category === "ads")).toBe(true);
    expect(oauthOnly.every((provider) => provider.authModes.includes("oauth2"))).toBe(true);
  });
});
