import type { AdPlatformOAuthService, OAuthTokens } from './types';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
// Read-only access to GA4 properties
const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly email openid';

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
}

interface GA4AccountSummary {
  name: string;
  displayName: string;
  propertySummaries?: Array<{
    property: string;
    displayName: string;
  }>;
}

interface GA4AccountSummariesResponse {
  accountSummaries?: GA4AccountSummary[];
}

export class GoogleAnalyticsOAuthService implements AdPlatformOAuthService {
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor() {
    this.clientId = process.env.GOOGLE_ANALYTICS_CLIENT_ID ?? process.env.GOOGLE_ADS_CLIENT_ID ?? '';
    this.clientSecret = process.env.GOOGLE_ANALYTICS_CLIENT_SECRET ?? process.env.GOOGLE_ADS_CLIENT_SECRET ?? '';
  }

  getAuthUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPE,
      access_type: 'offline',
      prompt: 'consent',
      state,
    });
    return `${AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<OAuthTokens> {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Google Analytics token exchange failed: ${text}`);
    }

    const data: GoogleTokenResponse = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
    };
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokens> {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Google Analytics token refresh failed: ${text}`);
    }

    const data: GoogleTokenResponse = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
    };
  }

  async getAccountInfo(accessToken: string): Promise<{ externalId: string; name: string }> {
    // List GA4 account summaries to find the first accessible property
    const res = await fetch(
      'https://analyticsadmin.googleapis.com/v1beta/accountSummaries',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (res.ok) {
      const data: GA4AccountSummariesResponse = await res.json();
      const firstAccount = data.accountSummaries?.[0];
      const firstProperty = firstAccount?.propertySummaries?.[0];

      if (firstProperty) {
        // property format: "properties/123456789"
        const externalId = firstProperty.property.replace('properties/', '');
        const name = firstProperty.displayName ?? `GA4 (${externalId})`;
        return { externalId, name };
      }

      if (firstAccount) {
        // Fallback: use account ID if no properties found
        const externalId = firstAccount.name.replace('accounts/', '');
        return { externalId, name: firstAccount.displayName ?? `GA4 Account (${externalId})` };
      }
    } else {
      const text = await res.text();
      console.warn('[google-analytics] accountSummaries failed:', res.status, text.slice(0, 200));
    }

    // Fallback: use Google profile info
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (profileRes.ok) {
      const profile = await profileRes.json() as { sub?: string; email?: string };
      const externalId = profile.sub ?? `ga4-${Date.now()}`;
      const name = profile.email ? `GA4 (${profile.email})` : 'Google Analytics 4';
      return { externalId, name };
    }

    return { externalId: `ga4-${Date.now()}`, name: 'Google Analytics 4' };
  }
}
