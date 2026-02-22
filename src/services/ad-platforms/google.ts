import type { AdPlatformOAuthService, OAuthTokens } from './types';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/adwords email openid';

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
    // Try current Google Ads API versions in order
    const versions = ['v19', 'v20', 'v21'];

    for (const version of versions) {
      const res = await fetch(
        `https://googleads.googleapis.com/${version}/customers:listAccessibleCustomers`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? '',
          },
        }
      );

      if (res.status === 404) continue; // version not found, try next

      if (res.ok) {
        const data = await res.json() as { resourceNames?: string[] };
        const resourceName = data.resourceNames?.[0];
        if (resourceName) {
          const externalId = resourceName.split('/')[1] ?? resourceName;
          return { externalId, name: `Google Ads (${externalId})` };
        }
      }

      // Non-404 error — log and fall through to profile fallback
      const text = await res.text();
      console.warn(`[google-ads] ${version} listAccessibleCustomers failed (${res.status}):`, text.slice(0, 200));
      break;
    }

    // Fallback: use Google profile info so the OAuth connection still completes
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (profileRes.ok) {
      const profile = await profileRes.json() as { sub?: string; email?: string };
      const externalId = profile.sub ?? profile.email ?? `google-${Date.now()}`;
      const name = profile.email ? `Google Ads (${profile.email})` : 'Google Ads Account';
      console.log('[google-ads] using profile fallback, externalId:', externalId);
      return { externalId, name };
    }

    // Absolute last resort — never block the connection
    const externalId = `google-${Date.now()}`;
    console.warn('[google-ads] all account info fetches failed, using timestamp fallback');
    return { externalId, name: 'Google Ads Account' };
  }
}
