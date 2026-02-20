import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { encryptToken } from '@/lib/crypto';
import { getAdPlatformService } from '@/services/ad-platforms';
import { getUserOrganization } from '@/lib/actions/organization';
import type { AdPlatform } from '@/types';

const VALID_PLATFORMS: AdPlatform[] = ['google', 'meta', 'tiktok', 'pinterest'];

function isAdPlatform(value: string): value is AdPlatform {
  return VALID_PLATFORMS.includes(value as AdPlatform);
}

const SETTINGS_URL = '/settings?tab=ad-accounts';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform: rawPlatform } = await params;

  // 1. Validate platform
  if (!isAdPlatform(rawPlatform)) {
    return NextResponse.redirect(
      new URL(`${SETTINGS_URL}&error=invalid_platform`, request.url)
    );
  }
  const platform = rawPlatform;

  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');
  const oauthError = searchParams.get('error');

  // 2. Handle user-denied flow
  if (oauthError) {
    return NextResponse.redirect(
      new URL(`${SETTINGS_URL}&error=oauth_denied`, request.url)
    );
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(
      new URL(`${SETTINGS_URL}&error=oauth_failed`, request.url)
    );
  }

  // 3. CSRF: validate state cookie
  const cookieStore = await cookies();
  const stateCookie = cookieStore.get(`oauth_state_${platform}`)?.value;

  if (!stateCookie || stateCookie !== stateParam) {
    return NextResponse.redirect(
      new URL(`${SETTINGS_URL}&error=oauth_failed`, request.url)
    );
  }

  // Clear the state cookie immediately
  cookieStore.delete(`oauth_state_${platform}`);

  // 4. Auth + org check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL(`${SETTINGS_URL}&error=oauth_failed`, request.url)
    );
  }

  const membership = await getUserOrganization();
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.redirect(
      new URL(`${SETTINGS_URL}&error=oauth_failed`, request.url)
    );
  }

  // 5. Exchange code for tokens
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const redirectUri = `${appUrl}/api/oauth/${platform}/callback`;

  try {
    const service = getAdPlatformService(platform);

    const tokens = await service.exchangeCodeForToken(code, redirectUri);
    const accountInfo = await service.getAccountInfo(tokens.accessToken);

    // 6. Upsert ad_account
    const { data: adAccount, error: upsertError } = await supabase
      .from('ad_accounts')
      .upsert(
        {
          organization_id: membership.organization.id,
          platform,
          external_account_id: accountInfo.externalId,
          account_name: accountInfo.name,
          is_active: true,
        },
        {
          onConflict: 'organization_id,platform,external_account_id',
        }
      )
      .select('id')
      .single();

    if (upsertError || !adAccount) {
      return NextResponse.redirect(
        new URL(`${SETTINGS_URL}&error=oauth_failed`, request.url)
      );
    }

    // 7. Upsert ad_account_tokens (encrypted)
    const encryptedAccess = encryptToken(tokens.accessToken);
    const encryptedRefresh = tokens.refreshToken
      ? encryptToken(tokens.refreshToken)
      : null;

    const { error: tokenError } = await supabase
      .from('ad_account_tokens')
      .upsert(
        {
          ad_account_id: adAccount.id,
          access_token: encryptedAccess,
          refresh_token: encryptedRefresh,
          token_expires_at: tokens.expiresAt?.toISOString() ?? null,
        },
        { onConflict: 'ad_account_id' }
      );

    if (tokenError) {
      return NextResponse.redirect(
        new URL(`${SETTINGS_URL}&error=oauth_failed`, request.url)
      );
    }

    return NextResponse.redirect(
      new URL(`${SETTINGS_URL}&connected=true`, request.url)
    );
  } catch {
    return NextResponse.redirect(
      new URL(`${SETTINGS_URL}&error=oauth_failed`, request.url)
    );
  }
}
