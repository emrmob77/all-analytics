const integrationAuthModeValues = ["oauth2", "api_key", "service_account"] as const;
type IntegrationAuthMode = (typeof integrationAuthModeValues)[number];

const integrationCategoryValues = ["ads", "analytics", "ecommerce", "crm", "warehouse", "support"] as const;
type IntegrationCategory = (typeof integrationCategoryValues)[number];

interface OAuthConfig {
  authorizationUrl: string;
  defaultScopes: string[];
  supportsRefreshToken: boolean;
  additionalAuthorizeParams?: Record<string, string>;
}

interface CredentialRotationPolicy {
  refreshTokenDays?: number;
  apiKeyDays?: number;
  serviceAccountKeyDays?: number;
}

interface IntegrationProviderDefinition {
  key: string;
  name: string;
  category: IntegrationCategory;
  authModes: IntegrationAuthMode[];
  docsUrl: string;
  apiBaseUrl?: string;
  oauth?: OAuthConfig;
  credentialRotation: CredentialRotationPolicy;
}

export {
  integrationAuthModeValues,
  integrationCategoryValues
};
export type {
  CredentialRotationPolicy,
  IntegrationAuthMode,
  IntegrationCategory,
  IntegrationProviderDefinition,
  OAuthConfig
};
