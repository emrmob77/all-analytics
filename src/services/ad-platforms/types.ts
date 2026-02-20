export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface AdPlatformOAuthService {
  getAuthUrl(redirectUri: string, state: string): string;
  exchangeCodeForToken(code: string, redirectUri: string): Promise<OAuthTokens>;
  refreshToken(refreshToken: string): Promise<OAuthTokens>;
  getAccountInfo(accessToken: string): Promise<{ externalId: string; name: string }>;
}
