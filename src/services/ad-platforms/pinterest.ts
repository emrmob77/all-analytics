import type { AdPlatformOAuthService, OAuthTokens } from './types';

const AUTH_URL = 'https://www.pinterest.com/oauth/';
const TOKEN_URL = 'https://api.pinterest.com/v5/oauth/token';
const SCOPE = 'ads:read,ads:write';

interface PinterestTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
}

interface PinterestAdAccountResponse {
  items: Array<{ id: string; name: string }>;
}

export class PinterestAdsOAuthService implements AdPlatformOAuthService {
  private readonly appId: string;
  private readonly appSecret: string;

  constructor() {
    this.appId = process.env.PINTEREST_ADS_APP_ID ?? '';
    this.appSecret = process.env.PINTEREST_ADS_APP_SECRET ?? '';
  }

  getAuthUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPE,
      state,
    });
    return `${AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<OAuthTokens> {
    const credentials = Buffer.from(`${this.appId}:${this.appSecret}`).toString('base64');

    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Pinterest token exchange failed: ${text}`);
    }

    const data: PinterestTokenResponse = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
    };
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokens> {
    const credentials = Buffer.from(`${this.appId}:${this.appSecret}`).toString('base64');

    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Pinterest token refresh failed: ${text}`);
    }

    const data: PinterestTokenResponse = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
    };
  }

  async getAccountInfo(accessToken: string): Promise<{ externalId: string; name: string }> {
    const res = await fetch('https://api.pinterest.com/v5/ad_accounts', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch Pinterest Ads account info: ${text}`);
    }

    const data: PinterestAdAccountResponse = await res.json();
    const account = data.items?.[0];
    if (!account) throw new Error('No Pinterest Ads accounts found');

    return { externalId: account.id, name: account.name };
  }
}
