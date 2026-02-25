import type { AdPlatformOAuthService, OAuthTokens } from './types';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
// Read-only access to Search Console data
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly email openid';

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
}

interface SearchConsoleSite {
  siteUrl: string;
  permissionLevel: string;
}

interface SearchConsoleSitesResponse {
  siteEntry?: SearchConsoleSite[];
}

export class SearchConsoleOAuthService implements AdPlatformOAuthService {
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
      throw new Error(`Search Console token exchange failed: ${text}`);
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
      throw new Error(`Search Console token refresh failed: ${text}`);
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
    // List verified Search Console sites
    const res = await fetch(
      'https://www.googleapis.com/webmasters/v3/sites',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (res.ok) {
      const data: SearchConsoleSitesResponse = await res.json();
      // Prefer sc-domain: entries (domain properties) over URL-prefix properties
      const sites = data.siteEntry ?? [];
      const domainProperty = sites.find(s => s.siteUrl.startsWith('sc-domain:'));
      const firstSite = domainProperty ?? sites[0];

      if (firstSite) {
        const rawUrl = firstSite.siteUrl;
        // Clean up URL for display: remove sc-domain: prefix and trailing slash
        const displayUrl = rawUrl
          .replace('sc-domain:', '')
          .replace(/\/$/, '');
        return {
          externalId: encodeURIComponent(rawUrl),
          name: displayUrl || rawUrl,
        };
      }
    } else {
      const text = await res.text();
      console.warn('[search-console] sites list failed:', res.status, text.slice(0, 200));
    }

    // Fallback: use Google profile info
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (profileRes.ok) {
      const profile = await profileRes.json() as { sub?: string; email?: string };
      const externalId = profile.sub ?? `sc-${Date.now()}`;
      const name = profile.email ? `Search Console (${profile.email})` : 'Search Console';
      return { externalId, name };
    }

    return { externalId: `sc-${Date.now()}`, name: 'Search Console' };
  }
}
