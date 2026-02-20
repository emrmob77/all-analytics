import type { AdPlatformOAuthService, OAuthTokens } from './types';

const AUTH_URL = 'https://www.facebook.com/v21.0/dialog/oauth';
const TOKEN_URL = 'https://graph.facebook.com/v21.0/oauth/access_token';
const SCOPE = 'ads_management,ads_read';

interface MetaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface MetaAdAccountsResponse {
  data: Array<{ id: string; name: string; account_id: string }>;
}

export class MetaAdsOAuthService implements AdPlatformOAuthService {
  private readonly appId: string;
  private readonly appSecret: string;

  constructor() {
    this.appId = process.env.META_ADS_APP_ID ?? '';
    this.appSecret = process.env.META_ADS_APP_SECRET ?? '';
  }

  getAuthUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: redirectUri,
      scope: SCOPE,
      response_type: 'code',
      state,
    });
    return `${AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<OAuthTokens> {
    const params = new URLSearchParams({
      client_id: this.appId,
      client_secret: this.appSecret,
      redirect_uri: redirectUri,
      code,
    });

    const res = await fetch(`${TOKEN_URL}?${params.toString()}`);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Meta token exchange failed: ${text}`);
    }

    const data: MetaTokenResponse = await res.json();
    return {
      accessToken: data.access_token,
      // Meta has no separate refresh token; the access token itself is passed to
      // the fb_exchange_token grant to obtain a new long-lived token. Store it in
      // refreshToken so that refreshAdAccountToken can reach Meta's refresh path.
      refreshToken: data.access_token,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
    };
  }

  async refreshToken(_refreshToken: string): Promise<OAuthTokens> {
    // Meta uses long-lived tokens; extend via the graph endpoint
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.appId,
      client_secret: this.appSecret,
      fb_exchange_token: _refreshToken,
    });

    const res = await fetch(`${TOKEN_URL}?${params.toString()}`);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Meta token refresh failed: ${text}`);
    }

    const data: MetaTokenResponse = await res.json();
    return {
      accessToken: data.access_token,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
    };
  }

  async getAccountInfo(accessToken: string): Promise<{ externalId: string; name: string }> {
    const params = new URLSearchParams({
      fields: 'id,name,account_id',
      access_token: accessToken,
      limit: '1',
    });

    const res = await fetch(
      `https://graph.facebook.com/v21.0/me/adaccounts?${params.toString()}`
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch Meta Ads account info: ${text}`);
    }

    const data: MetaAdAccountsResponse = await res.json();
    const account = data.data?.[0];
    if (!account) throw new Error('No Meta Ads accounts found');

    // account.id format: "act_1234567890"
    const externalId = account.account_id ?? account.id.replace('act_', '');
    return { externalId, name: account.name };
  }
}
