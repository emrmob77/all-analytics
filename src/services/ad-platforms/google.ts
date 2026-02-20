import type { AdPlatformOAuthService, OAuthTokens } from './types';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/adwords';

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
}

export class GoogleAdsOAuthService implements AdPlatformOAuthService {
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor() {
    this.clientId = process.env.GOOGLE_ADS_CLIENT_ID ?? '';
    this.clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET ?? '';
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
      throw new Error(`Google token exchange failed: ${text}`);
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
      throw new Error(`Google token refresh failed: ${text}`);
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
    // Use the Google Ads API to fetch the customer ID.
    // For a real integration this would use the Google Ads API client library
    // and list accessible customers. Here we use the REST endpoint.
    const res = await fetch(
      'https://googleads.googleapis.com/v18/customers:listAccessibleCustomers',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? '',
        },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch Google Ads account info: ${text}`);
    }

    const data = await res.json() as { resourceNames?: string[] };
    const resourceName = data.resourceNames?.[0];
    if (!resourceName) throw new Error('No Google Ads accounts found');

    // resourceName format: "customers/1234567890"
    const externalId = resourceName.split('/')[1] ?? resourceName;
    return { externalId, name: `Google Ads (${externalId})` };
  }
}
