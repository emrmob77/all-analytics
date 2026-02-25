'use server';

import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { getUserOrganization } from '@/lib/actions/organization';
import { encryptToken, decryptToken } from '@/lib/crypto';
import { getAdPlatformService } from '@/services/ad-platforms';
import type { AdPlatform } from '@/types';

const AD_PLATFORMS: AdPlatform[] = ['google', 'meta', 'tiktok', 'pinterest', 'google-analytics', 'search-console'];

export interface AdAccount {
  id: string;
  organization_id: string;
  platform: AdPlatform;
  external_account_id: string;
  account_name: string;
  is_active: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// getAdAccounts — list connected ad accounts for the caller's org (admin+)
// ---------------------------------------------------------------------------

export async function getAdAccounts(): Promise<{
  accounts: AdAccount[];
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { accounts: [], error: 'Not authenticated' };

  const membership = await getUserOrganization();
  if (!membership) return { accounts: [], error: 'No organization found' };
  if (!['owner', 'admin'].includes(membership.role)) {
    return { accounts: [], error: 'Only admins can view ad account connections' };
  }

  const { data, error } = await supabase
    .from('ad_accounts')
    .select('*')
    .eq('organization_id', membership.organization.id)
    .order('created_at', { ascending: true });

  if (error) return { accounts: [], error: error.message };
  return { accounts: (data ?? []) as AdAccount[], error: null };
}

// ---------------------------------------------------------------------------
// initiateOAuth — generate state, store in cookie, return the platform auth URL
// ---------------------------------------------------------------------------

export async function initiateOAuth(
  platform: AdPlatform
): Promise<{ authUrl: string | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { authUrl: null, error: 'Not authenticated' };

  const membership = await getUserOrganization();
  if (!membership) return { authUrl: null, error: 'No organization found' };
  if (!['owner', 'admin'].includes(membership.role)) {
    return { authUrl: null, error: 'Only admins can connect ad accounts' };
  }

  if (!AD_PLATFORMS.includes(platform)) {
    return { authUrl: null, error: `Unsupported platform: ${platform}` };
  }

  const state = randomBytes(32).toString('hex');
  const cookieStore = await cookies();

  cookieStore.set(`oauth_state_${platform}`, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const redirectUri = `${appUrl}/api/oauth/${platform}/callback`;

  try {
    const service = getAdPlatformService(platform);
    const authUrl = service.getAuthUrl(redirectUri, state);
    return { authUrl, error: null };
  } catch (err) {
    return {
      authUrl: null,
      error: err instanceof Error ? err.message : 'Failed to generate auth URL',
    };
  }
}

// ---------------------------------------------------------------------------
// disconnectAdAccount — remove ad_accounts + ad_account_tokens (admin+)
// ---------------------------------------------------------------------------

export async function disconnectAdAccount(
  accountId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const membership = await getUserOrganization();
  if (!membership) return { error: 'No organization found' };
  if (!['owner', 'admin'].includes(membership.role)) {
    return { error: 'Only admins can disconnect ad accounts' };
  }

  // ad_account_tokens will cascade-delete via FK constraint
  const { error } = await supabase
    .from('ad_accounts')
    .delete()
    .eq('id', accountId)
    .eq('organization_id', membership.organization.id);

  return { error: error?.message ?? null };
}

// ---------------------------------------------------------------------------
// refreshAdAccountToken — use stored refresh token to get a new access token
// ---------------------------------------------------------------------------

export async function refreshAdAccountToken(
  accountId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const membership = await getUserOrganization();
  if (!membership) return { error: 'No organization found' };
  if (!['owner', 'admin'].includes(membership.role)) {
    return { error: 'Only admins can refresh ad account tokens' };
  }

  // Fetch the account + token row (admin RLS ensures access)
  const { data: account, error: fetchError } = await supabase
    .from('ad_accounts')
    .select('id, platform')
    .eq('id', accountId)
    .eq('organization_id', membership.organization.id)
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };
  if (!account) return { error: 'Ad account not found' };

  const { data: tokenRow, error: tokenFetchError } = await supabase
    .from('ad_account_tokens')
    .select('refresh_token')
    .eq('ad_account_id', accountId)
    .maybeSingle();

  if (tokenFetchError) return { error: tokenFetchError.message };
  if (!tokenRow?.refresh_token) return { error: 'No refresh token stored for this account' };

  let decryptedRefreshToken: string;
  try {
    decryptedRefreshToken = decryptToken(tokenRow.refresh_token);
  } catch {
    return { error: 'Failed to decrypt refresh token' };
  }

  try {
    const service = getAdPlatformService(account.platform as AdPlatform);
    const tokens = await service.refreshToken(decryptedRefreshToken);

    const encryptedAccess = encryptToken(tokens.accessToken);
    const encryptedRefresh = tokens.refreshToken
      ? encryptToken(tokens.refreshToken)
      : tokenRow.refresh_token;

    const { error: updateError } = await supabase
      .from('ad_account_tokens')
      .update({
        access_token: encryptedAccess,
        refresh_token: encryptedRefresh,
        token_expires_at: tokens.expiresAt?.toISOString() ?? null,
      })
      .eq('ad_account_id', accountId);

    return { error: updateError?.message ?? null };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Failed to refresh token',
    };
  }
}
