import type {
  CredentialRotationPolicy,
  IntegrationAuthMode,
  IntegrationCategory,
  IntegrationProviderDefinition,
  OAuthConfig
} from "@/lib/integrations/types";

const integrationCategoryLabels: Record<IntegrationCategory, string> = {
  ads: "Ad Networks",
  analytics: "Analytics",
  ecommerce: "E-commerce",
  crm: "CRM & Marketing",
  warehouse: "Data Warehouse & DB",
  support: "Support & Operations"
};

interface ProviderInput {
  key: string;
  name: string;
  category: IntegrationCategory;
  authModes: IntegrationAuthMode[];
  docsUrl: string;
  apiBaseUrl?: string;
  oauth?: Omit<OAuthConfig, "supportsRefreshToken"> & {
    supportsRefreshToken?: boolean;
  };
  credentialRotation?: Partial<CredentialRotationPolicy>;
}

const defaultRotationDays = {
  refreshTokenDays: 90,
  apiKeyDays: 60,
  serviceAccountKeyDays: 180
} as const;

function buildCredentialRotation(
  authModes: IntegrationAuthMode[],
  overrides: Partial<CredentialRotationPolicy> = {}
): CredentialRotationPolicy {
  return {
    refreshTokenDays: authModes.includes("oauth2")
      ? (overrides.refreshTokenDays ?? defaultRotationDays.refreshTokenDays)
      : undefined,
    apiKeyDays: authModes.includes("api_key")
      ? (overrides.apiKeyDays ?? defaultRotationDays.apiKeyDays)
      : undefined,
    serviceAccountKeyDays: authModes.includes("service_account")
      ? (overrides.serviceAccountKeyDays ?? defaultRotationDays.serviceAccountKeyDays)
      : undefined
  };
}

function createProvider(input: ProviderInput): IntegrationProviderDefinition {
  if (input.authModes.includes("oauth2") && !input.oauth) {
    throw new Error(`Provider '${input.key}' requires oauth configuration.`);
  }

  return {
    key: input.key,
    name: input.name,
    category: input.category,
    authModes: input.authModes,
    docsUrl: input.docsUrl,
    apiBaseUrl: input.apiBaseUrl,
    oauth: input.oauth
      ? {
          authorizationUrl: input.oauth.authorizationUrl,
          defaultScopes: input.oauth.defaultScopes,
          supportsRefreshToken: input.oauth.supportsRefreshToken ?? true,
          additionalAuthorizeParams: input.oauth.additionalAuthorizeParams
        }
      : undefined,
    credentialRotation: buildCredentialRotation(input.authModes, input.credentialRotation)
  };
}

const integrationProviderCatalog: IntegrationProviderDefinition[] = [
  createProvider({
    key: "google-ads",
    name: "Google Ads",
    category: "ads",
    authModes: ["oauth2"],
    docsUrl: "https://developers.google.com/google-ads/api/docs/oauth/overview",
    apiBaseUrl: "https://googleads.googleapis.com",
    oauth: {
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      defaultScopes: ["https://www.googleapis.com/auth/adwords"],
      additionalAuthorizeParams: { access_type: "offline", prompt: "consent" }
    }
  }),
  createProvider({
    key: "meta-ads",
    name: "Meta Ads",
    category: "ads",
    authModes: ["oauth2"],
    docsUrl: "https://developers.facebook.com/docs/marketing-api/",
    apiBaseUrl: "https://graph.facebook.com",
    oauth: {
      authorizationUrl: "https://www.facebook.com/v20.0/dialog/oauth",
      defaultScopes: ["ads_read", "ads_management", "business_management"]
    }
  }),
  createProvider({
    key: "tiktok-ads",
    name: "TikTok Ads",
    category: "ads",
    authModes: ["oauth2"],
    docsUrl: "https://ads.tiktok.com/marketing_api/docs",
    apiBaseUrl: "https://business-api.tiktok.com",
    oauth: {
      authorizationUrl: "https://www.tiktok.com/v2/auth/authorize/",
      defaultScopes: ["ads.management", "ads.read"]
    }
  }),
  createProvider({
    key: "linkedin-ads",
    name: "LinkedIn Ads",
    category: "ads",
    authModes: ["oauth2"],
    docsUrl: "https://learn.microsoft.com/linkedin/marketing/",
    apiBaseUrl: "https://api.linkedin.com",
    oauth: {
      authorizationUrl: "https://www.linkedin.com/oauth/v2/authorization",
      defaultScopes: ["r_ads", "rw_ads", "r_organization_social"]
    }
  }),
  createProvider({
    key: "pinterest-ads",
    name: "Pinterest Ads",
    category: "ads",
    authModes: ["oauth2"],
    docsUrl: "https://developers.pinterest.com/docs/api/v5/",
    apiBaseUrl: "https://api.pinterest.com",
    oauth: {
      authorizationUrl: "https://www.pinterest.com/oauth/",
      defaultScopes: ["ads:read", "ads:write", "boards:read"]
    }
  }),
  createProvider({
    key: "microsoft-ads",
    name: "Microsoft Ads",
    category: "ads",
    authModes: ["oauth2"],
    docsUrl: "https://learn.microsoft.com/advertising/guides/authentication-oauth",
    apiBaseUrl: "https://api.ads.microsoft.com",
    oauth: {
      authorizationUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      defaultScopes: ["https://ads.microsoft.com/msads.manage offline_access"],
      additionalAuthorizeParams: { prompt: "consent" }
    }
  }),
  createProvider({
    key: "yandex-ads",
    name: "Yandex Ads",
    category: "ads",
    authModes: ["oauth2"],
    docsUrl: "https://yandex.com/dev/direct/",
    apiBaseUrl: "https://api.direct.yandex.com",
    oauth: {
      authorizationUrl: "https://oauth.yandex.com/authorize",
      defaultScopes: ["direct:api"]
    }
  }),
  createProvider({
    key: "snapchat-ads",
    name: "Snapchat Ads",
    category: "ads",
    authModes: ["oauth2"],
    docsUrl: "https://marketingapi.snapchat.com/docs/",
    apiBaseUrl: "https://adsapi.snapchat.com",
    oauth: {
      authorizationUrl: "https://accounts.snapchat.com/login/oauth2/authorize",
      defaultScopes: ["snapchat-marketing-api"]
    }
  }),
  createProvider({
    key: "x-ads",
    name: "X Ads",
    category: "ads",
    authModes: ["oauth2", "api_key"],
    docsUrl: "https://developer.x.com/en/docs/x-ads-api",
    apiBaseUrl: "https://ads-api.x.com",
    oauth: {
      authorizationUrl: "https://twitter.com/i/oauth2/authorize",
      defaultScopes: ["tweet.read", "users.read", "offline.access"]
    }
  }),
  createProvider({
    key: "reddit-ads",
    name: "Reddit Ads",
    category: "ads",
    authModes: ["oauth2"],
    docsUrl: "https://ads-api.reddit.com/docs/",
    apiBaseUrl: "https://ads-api.reddit.com",
    oauth: {
      authorizationUrl: "https://www.reddit.com/api/v1/authorize",
      defaultScopes: ["read", "adsread", "adsedit"]
    }
  }),
  createProvider({
    key: "amazon-ads",
    name: "Amazon Ads",
    category: "ads",
    authModes: ["oauth2"],
    docsUrl: "https://advertising.amazon.com/API/docs",
    apiBaseUrl: "https://advertising-api.amazon.com",
    oauth: {
      authorizationUrl: "https://www.amazon.com/ap/oa",
      defaultScopes: ["advertising::campaign_management"]
    }
  }),
  createProvider({
    key: "ga4",
    name: "GA4",
    category: "analytics",
    authModes: ["oauth2", "service_account"],
    docsUrl: "https://developers.google.com/analytics/devguides/reporting/data/v1",
    apiBaseUrl: "https://analyticsdata.googleapis.com",
    oauth: {
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      defaultScopes: ["https://www.googleapis.com/auth/analytics.readonly"],
      additionalAuthorizeParams: { access_type: "offline", prompt: "consent" }
    }
  }),
  createProvider({
    key: "search-console",
    name: "Search Console",
    category: "analytics",
    authModes: ["oauth2", "service_account"],
    docsUrl: "https://developers.google.com/webmaster-tools/v1/how-tos/authorizing",
    apiBaseUrl: "https://www.googleapis.com/webmasters/v3",
    oauth: {
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      defaultScopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
      additionalAuthorizeParams: { access_type: "offline", prompt: "consent" }
    }
  }),
  createProvider({
    key: "youtube-analytics",
    name: "YouTube Analytics",
    category: "analytics",
    authModes: ["oauth2"],
    docsUrl: "https://developers.google.com/youtube/analytics",
    apiBaseUrl: "https://youtubeanalytics.googleapis.com",
    oauth: {
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      defaultScopes: [
        "https://www.googleapis.com/auth/yt-analytics.readonly",
        "https://www.googleapis.com/auth/youtube.readonly"
      ],
      additionalAuthorizeParams: { access_type: "offline", prompt: "consent" }
    }
  }),
  createProvider({
    key: "mixpanel",
    name: "Mixpanel",
    category: "analytics",
    authModes: ["api_key"],
    docsUrl: "https://developer.mixpanel.com/reference/overview",
    apiBaseUrl: "https://mixpanel.com/api"
  }),
  createProvider({
    key: "amplitude",
    name: "Amplitude",
    category: "analytics",
    authModes: ["api_key"],
    docsUrl: "https://www.docs.developers.amplitude.com/",
    apiBaseUrl: "https://api2.amplitude.com"
  }),
  createProvider({
    key: "adobe-analytics",
    name: "Adobe Analytics",
    category: "analytics",
    authModes: ["oauth2", "api_key"],
    docsUrl: "https://developer.adobe.com/analytics-apis/docs/2.0/",
    apiBaseUrl: "https://analytics.adobe.io/api",
    oauth: {
      authorizationUrl: "https://ims-na1.adobelogin.com/ims/authorize/v2",
      defaultScopes: ["openid", "AdobeID", "read_organizations"]
    }
  }),
  createProvider({
    key: "shopify",
    name: "Shopify",
    category: "ecommerce",
    authModes: ["oauth2", "api_key"],
    docsUrl: "https://shopify.dev/docs/apps/build/authentication-authorization",
    apiBaseUrl: "https://{shop}.myshopify.com/admin/api",
    oauth: {
      authorizationUrl: "https://{shop}.myshopify.com/admin/oauth/authorize",
      defaultScopes: ["read_orders", "read_products", "read_analytics"]
    }
  }),
  createProvider({
    key: "woocommerce",
    name: "WooCommerce",
    category: "ecommerce",
    authModes: ["api_key"],
    docsUrl: "https://woocommerce.github.io/woocommerce-rest-api-docs/",
    apiBaseUrl: "https://{store}/wp-json/wc/v3"
  }),
  createProvider({
    key: "bigcommerce",
    name: "BigCommerce",
    category: "ecommerce",
    authModes: ["oauth2", "api_key"],
    docsUrl: "https://developer.bigcommerce.com/docs/start/authentication",
    apiBaseUrl: "https://api.bigcommerce.com",
    oauth: {
      authorizationUrl: "https://login.bigcommerce.com/oauth2/authorize",
      defaultScopes: ["store_v2_orders", "store_v2_products"]
    }
  }),
  createProvider({
    key: "magento",
    name: "Magento",
    category: "ecommerce",
    authModes: ["api_key"],
    docsUrl: "https://developer.adobe.com/commerce/webapi/rest/",
    apiBaseUrl: "https://{store}/rest/V1"
  }),
  createProvider({
    key: "amazon-seller-central",
    name: "Amazon Seller Central",
    category: "ecommerce",
    authModes: ["oauth2"],
    docsUrl: "https://developer-docs.amazon.com/sp-api/docs/authorizing-selling-partner-api-applications",
    apiBaseUrl: "https://sellingpartnerapi-na.amazon.com",
    oauth: {
      authorizationUrl: "https://sellercentral.amazon.com/apps/authorize/consent",
      defaultScopes: ["sellingpartnerapi::notifications", "sellingpartnerapi::orders"]
    }
  }),
  createProvider({
    key: "etsy",
    name: "Etsy",
    category: "ecommerce",
    authModes: ["oauth2"],
    docsUrl: "https://developers.etsy.com/documentation/essentials/authentication",
    apiBaseUrl: "https://openapi.etsy.com",
    oauth: {
      authorizationUrl: "https://www.etsy.com/oauth/connect",
      defaultScopes: ["listings_r", "transactions_r", "shops_r"]
    }
  }),
  createProvider({
    key: "hubspot",
    name: "HubSpot",
    category: "crm",
    authModes: ["oauth2", "api_key"],
    docsUrl: "https://developers.hubspot.com/docs/api/overview",
    apiBaseUrl: "https://api.hubapi.com",
    oauth: {
      authorizationUrl: "https://app.hubspot.com/oauth/authorize",
      defaultScopes: ["crm.objects.contacts.read", "crm.objects.deals.read"]
    }
  }),
  createProvider({
    key: "salesforce",
    name: "Salesforce",
    category: "crm",
    authModes: ["oauth2"],
    docsUrl: "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_understanding_authentication.htm",
    apiBaseUrl: "https://login.salesforce.com/services/data",
    oauth: {
      authorizationUrl: "https://login.salesforce.com/services/oauth2/authorize",
      defaultScopes: ["api", "refresh_token"]
    }
  }),
  createProvider({
    key: "pipedrive",
    name: "Pipedrive",
    category: "crm",
    authModes: ["oauth2", "api_key"],
    docsUrl: "https://developers.pipedrive.com/docs/api/v1",
    apiBaseUrl: "https://api.pipedrive.com/v1",
    oauth: {
      authorizationUrl: "https://oauth.pipedrive.com/oauth/authorize",
      defaultScopes: ["deals:read", "activities:read"]
    }
  }),
  createProvider({
    key: "klaviyo",
    name: "Klaviyo",
    category: "crm",
    authModes: ["api_key"],
    docsUrl: "https://developers.klaviyo.com/en/reference/api_overview",
    apiBaseUrl: "https://a.klaviyo.com/api"
  }),
  createProvider({
    key: "mailchimp",
    name: "Mailchimp",
    category: "crm",
    authModes: ["oauth2", "api_key"],
    docsUrl: "https://mailchimp.com/developer/marketing/docs/fundamentals/",
    apiBaseUrl: "https://{dc}.api.mailchimp.com/3.0",
    oauth: {
      authorizationUrl: "https://login.mailchimp.com/oauth2/authorize",
      defaultScopes: ["audience:read", "reports:read"]
    }
  }),
  createProvider({
    key: "activecampaign",
    name: "ActiveCampaign",
    category: "crm",
    authModes: ["api_key"],
    docsUrl: "https://developers.activecampaign.com/reference/overview",
    apiBaseUrl: "https://{account}.api-us1.com/api/3"
  }),
  createProvider({
    key: "brevo",
    name: "Brevo",
    category: "crm",
    authModes: ["api_key"],
    docsUrl: "https://developers.brevo.com/reference/getting-started-1",
    apiBaseUrl: "https://api.brevo.com/v3"
  }),
  createProvider({
    key: "bigquery",
    name: "BigQuery",
    category: "warehouse",
    authModes: ["oauth2", "service_account"],
    docsUrl: "https://cloud.google.com/bigquery/docs/authentication",
    apiBaseUrl: "https://bigquery.googleapis.com",
    oauth: {
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      defaultScopes: ["https://www.googleapis.com/auth/bigquery"],
      additionalAuthorizeParams: { access_type: "offline", prompt: "consent" }
    }
  }),
  createProvider({
    key: "snowflake",
    name: "Snowflake",
    category: "warehouse",
    authModes: ["api_key"],
    docsUrl: "https://docs.snowflake.com/en/developer-guide/sql-api/authenticating",
    apiBaseUrl: "https://{account}.snowflakecomputing.com"
  }),
  createProvider({
    key: "redshift",
    name: "Redshift",
    category: "warehouse",
    authModes: ["api_key"],
    docsUrl: "https://docs.aws.amazon.com/redshift/latest/mgmt/authentication.html",
    apiBaseUrl: "https://redshift.{region}.amazonaws.com"
  }),
  createProvider({
    key: "databricks",
    name: "Databricks",
    category: "warehouse",
    authModes: ["oauth2", "api_key"],
    docsUrl: "https://docs.databricks.com/api/workspace/introduction",
    apiBaseUrl: "https://{workspace}.cloud.databricks.com/api/2.0",
    oauth: {
      authorizationUrl: "https://accounts.cloud.databricks.com/oidc/accounts/{account}/v1/authorize",
      defaultScopes: ["all-apis", "offline_access"]
    }
  }),
  createProvider({
    key: "postgresql",
    name: "PostgreSQL",
    category: "warehouse",
    authModes: ["service_account"],
    docsUrl: "https://www.postgresql.org/docs/current/auth-methods.html"
  }),
  createProvider({
    key: "zendesk",
    name: "Zendesk",
    category: "support",
    authModes: ["oauth2", "api_key"],
    docsUrl: "https://developer.zendesk.com/api-reference/introduction/security-and-auth/",
    apiBaseUrl: "https://{subdomain}.zendesk.com/api/v2",
    oauth: {
      authorizationUrl: "https://{subdomain}.zendesk.com/oauth/authorizations/new",
      defaultScopes: ["read", "write"]
    }
  }),
  createProvider({
    key: "intercom",
    name: "Intercom",
    category: "support",
    authModes: ["oauth2", "api_key"],
    docsUrl: "https://developers.intercom.com/building-apps/docs/authentication-types",
    apiBaseUrl: "https://api.intercom.io",
    oauth: {
      authorizationUrl: "https://app.intercom.com/oauth",
      defaultScopes: ["read_conversations", "read_users"]
    }
  }),
  createProvider({
    key: "freshdesk",
    name: "Freshdesk",
    category: "support",
    authModes: ["api_key"],
    docsUrl: "https://developers.freshdesk.com/api/",
    apiBaseUrl: "https://{domain}.freshdesk.com/api/v2"
  }),
  createProvider({
    key: "slack",
    name: "Slack",
    category: "support",
    authModes: ["oauth2"],
    docsUrl: "https://api.slack.com/authentication/oauth-v2",
    apiBaseUrl: "https://slack.com/api",
    oauth: {
      authorizationUrl: "https://slack.com/oauth/v2/authorize",
      defaultScopes: ["channels:read", "chat:write", "users:read"]
    }
  })
].sort((left, right) => left.name.localeCompare(right.name));

const integrationProviderByKey = new Map(integrationProviderCatalog.map((provider) => [provider.key, provider]));

interface ListIntegrationProvidersFilters {
  category?: IntegrationCategory;
  authMode?: IntegrationAuthMode;
  search?: string;
  limit?: number;
}

function listIntegrationProviders(filters: ListIntegrationProvidersFilters = {}): IntegrationProviderDefinition[] {
  const normalizedSearch = filters.search?.trim().toLowerCase();
  const limit = filters.limit ?? integrationProviderCatalog.length;

  return integrationProviderCatalog
    .filter((provider) => {
      if (filters.category && provider.category !== filters.category) {
        return false;
      }

      if (filters.authMode && !provider.authModes.includes(filters.authMode)) {
        return false;
      }

      if (
        normalizedSearch &&
        !provider.name.toLowerCase().includes(normalizedSearch) &&
        !provider.key.toLowerCase().includes(normalizedSearch)
      ) {
        return false;
      }

      return true;
    })
    .slice(0, Math.max(0, limit));
}

function getIntegrationProviderByKey(providerKey: string): IntegrationProviderDefinition | undefined {
  return integrationProviderByKey.get(providerKey);
}

function getIntegrationCategoryLabel(category: IntegrationCategory): string {
  return integrationCategoryLabels[category];
}

export type { ListIntegrationProvidersFilters };
export {
  getIntegrationCategoryLabel,
  getIntegrationProviderByKey,
  integrationCategoryLabels,
  integrationProviderCatalog,
  listIntegrationProviders
};
