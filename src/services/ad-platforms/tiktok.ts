import type { AdPlatformOAuthService, OAuthTokens } from './types';

const AUTH_URL = 'https://business-api.tiktok.com/portal/auth';
const TOKEN_URL = 'https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/';
const SCOPE = 'user.info.basic,ad.read,ad.account.readonly';

interface TikTokTokenResponse {
  code: number;
  message: string;
  data: {
    access_token: string;
    refresh_token?: string;
    access_token_expire_in?: number;
    refresh_token_expire_in?: number;
    advertiser_ids?: string[];
  };
}

interface TikTokAdvertiserResponse {
  code: number;
  message: string;
  data: {
    list: Array<{ advertiser_id: string; advertiser_name: string }>;
  };
}

export class TikTokAdsOAuthService implements AdPlatformOAuthService {
  private readonly appId: string;
  private readonly appSecret: string;

  constructor() {
    this.appId = process.env.TIKTOK_ADS_APP_ID ?? '';
    this.appSecret = process.env.TIKTOK_ADS_APP_SECRET ?? '';
  }

  getAuthUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      app_id: this.appId,
      redirect_uri: redirectUri,
      scope: SCOPE,
      state,
    });
    return `${AUTH_URL}?${params.toString()}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async exchangeCodeForToken(code: string, _redirectUri: string): Promise<OAuthTokens> {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: this.appId,
        secret: this.appSecret,
        auth_code: code,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`TikTok token exchange failed: ${text}`);
    }

    const data: TikTokTokenResponse = await res.json();
    if (data.code !== 0) {
      throw new Error(`TikTok token exchange error: ${data.message}`);
    }

    return {
      accessToken: data.data.access_token,
      refreshToken: data.data.refresh_token,
      expiresAt: data.data.access_token_expire_in
        ? new Date(Date.now() + data.data.access_token_expire_in * 1000)
        : undefined,
    };
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokens> {
    const res = await fetch(
      'https://business-api.tiktok.com/open_api/v1.3/oauth2/refresh_token/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: this.appId,
          secret: this.appSecret,
          refresh_token: refreshToken,
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`TikTok token refresh failed: ${text}`);
    }

    const data: TikTokTokenResponse = await res.json();
    if (data.code !== 0) {
      throw new Error(`TikTok token refresh error: ${data.message}`);
    }

    return {
      accessToken: data.data.access_token,
      refreshToken: data.data.refresh_token ?? refreshToken,
      expiresAt: data.data.access_token_expire_in
        ? new Date(Date.now() + data.data.access_token_expire_in * 1000)
        : undefined,
    };
  }

  async getAccountInfo(accessToken: string): Promise<{ externalId: string; name: string }> {
    // TikTok Marketing API requires app_id and secret as query params in addition
    // to the Access-Token header for the advertiser list endpoint.
    const params = new URLSearchParams({
      app_id: this.appId,
      secret: this.appSecret,
    });
    const res = await fetch(
      `https://business-api.tiktok.com/open_api/v1.3/oauth2/advertiser/get/?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Access-Token': accessToken,
        },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch TikTok Ads account info: ${text}`);
    }

    const data: TikTokAdvertiserResponse = await res.json();
    if (data.code !== 0) {
      throw new Error(`TikTok account info error: ${data.message}`);
    }

    const advertiser = data.data?.list?.[0];
    if (!advertiser) throw new Error('No TikTok Ads accounts found');

    return {
      externalId: advertiser.advertiser_id,
      name: advertiser.advertiser_name,
    };
  }
}
