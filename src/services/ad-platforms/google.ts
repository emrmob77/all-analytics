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

function isGoogleCustomerId(value: string): boolean {
  return /^\d{10}$/.test(value.replace(/-/g, ''));
}

function pickPreferredCustomerId(
  customerIds: string[],
  loginCustomerId?: string
): string | null {
  if (!customerIds.length) return null;
  if (!loginCustomerId) return customerIds[0];

  const normalizedLoginId = loginCustomerId.replace(/-/g, '');
  const childCustomerId = customerIds.find(id => id !== normalizedLoginId);
  return childCustomerId ?? customerIds[0];
}

async function getGoogleTokenUserEmail(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json() as { email?: string };
    return data.email ?? null;
  } catch {
    return null;
  }
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
      prompt: 'consent select_account',
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
    // Try current Google Ads API versions in order (newest first).
    const versions = ['v21', 'v20', 'v19'];
    let lastError = 'Unable to fetch accessible Google Ads customers.';
    const loginCustomerId = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID ?? '').replace(/-/g, '');

    for (const version of versions) {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? '',
      };
      if (loginCustomerId) headers['login-customer-id'] = loginCustomerId;

      const res = await fetch(
        `https://googleads.googleapis.com/${version}/customers:listAccessibleCustomers`,
        { headers }
      );

      const text = await res.text();

      if (res.ok) {
        let data: { resourceNames?: string[] };
        try {
          data = JSON.parse(text) as { resourceNames?: string[] };
        } catch {
          throw new Error(`Google Ads ${version} returned invalid JSON.`);
        }
        const customerIds = (data.resourceNames ?? [])
          .map(resourceName => resourceName.split('/')[1] ?? resourceName)
          .filter(isGoogleCustomerId);
        const externalId = pickPreferredCustomerId(customerIds, loginCustomerId || undefined);
        if (externalId) {
          return { externalId, name: `Google Ads (${externalId})` };
        }
        throw new Error(
          'No accessible Google Ads customer found. Make sure this Google user is added to your MCC/test account and invitation is accepted.'
        );
      }

      // Version-specific errors should continue to older versions.
      if (res.status === 404 || text.includes('UNSUPPORTED_VERSION') || text.toLowerCase().includes('deprecated')) {
        lastError = `Google Ads API ${version} is unavailable`;
        continue;
      }

      // Developer token / auth / permission issues should fail fast.
      if (text.includes('DEVELOPER_TOKEN_INVALID')) {
        throw new Error('Google Ads developer token is invalid. Check GOOGLE_ADS_DEVELOPER_TOKEN.');
      }
      if (text.includes('DEVELOPER_TOKEN_NOT_APPROVED')) {
        throw new Error(
          'Developer token is test-only and this account is not a test account. Use a Google Ads test account or request Basic/Standard access.'
        );
      }
      if (text.includes('NOT_ADS_USER')) {
        const tokenEmail = await getGoogleTokenUserEmail(accessToken);
        const withEmail = tokenEmail ? ` OAuth user: ${tokenEmail}.` : '';
        throw new Error(
          `Connected Google user is not associated with any Google Ads account.${withEmail} Add this user to MCC/test account and accept the invitation.`
        );
      }
      if (res.status === 401 || res.status === 403) {
        throw new Error(`Google Ads authorization failed (${res.status}).`);
      }

      let message = `Google Ads ${version} account lookup failed (${res.status}).`;
      try {
        const parsed = JSON.parse(text) as { error?: { message?: string } };
        if (parsed.error?.message) message = parsed.error.message;
      } catch {
        // Keep the generic message.
      }
      throw new Error(message);
    }

    throw new Error(lastError);
  }
}
