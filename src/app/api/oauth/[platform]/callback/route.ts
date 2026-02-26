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

const SETTINGS_URL = '/settings?tab=connections';

function isGoogleCustomerId(value: string): boolean {
  if (!value) return false;
  return value.split(',').every(id => /^\d{10}$/.test(id.trim().replace(/-/g, '')));
}

/**
 * Builds a redirect response and explicitly sets a cookie-deletion header on
 * it so the state cookie is cleared even if Next.js middleware caches the
 * response before the cookieStore mutation propagates.
 */
function redirectWithCookieDeletion(
  url: URL,
  cookieName: string,
  secure: boolean
): NextResponse {
  const response = NextResponse.redirect(url);
  response.cookies.set(cookieName, '', {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform: rawPlatform } = await params;
  console.log(`[oauth/callback] hit — platform: ${rawPlatform}`);

  // 1. Validate platform
  if (!isAdPlatform(rawPlatform)) {
    console.error(`[oauth/callback] invalid platform: ${rawPlatform}`);
    return NextResponse.redirect(
      new URL(`${SETTINGS_URL}&error=invalid_platform`, request.url)
    );
  }
  const platform = rawPlatform;
  const cookieName = `oauth_state_${platform}`;
  const isSecure = process.env.NODE_ENV === 'production';

  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');
  const oauthError = searchParams.get('error');

  console.log(
    `[oauth/${platform}] code: ${code ? 'present' : 'missing'}, state: ${stateParam ? 'present' : 'missing'}, oauthError: ${oauthError}`
  );

  // 2. Handle user-denied flow
  if (oauthError) {
    return NextResponse.redirect(
      new URL(`${SETTINGS_URL}&error=oauth_denied`, request.url)
    );
  }

  if (!code || !stateParam) {
    console.error(`[oauth/${platform}] missing code or state`);
    return NextResponse.redirect(
      new URL(`${SETTINGS_URL}&error=oauth_failed`, request.url)
    );
  }

  // 3. CSRF: validate state cookie
  const cookieStore = await cookies();
  const stateCookie = cookieStore.get(cookieName)?.value;
  console.log(`[oauth/${platform}] state cookie present: ${Boolean(stateCookie)}`);

  if (!stateCookie || stateCookie !== stateParam) {
    console.error(`[oauth/${platform}] state mismatch`);
    return NextResponse.redirect(
      new URL(`${SETTINGS_URL}&error=oauth_failed`, request.url)
    );
  }

  // 4. Auth + org check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectWithCookieDeletion(
      new URL(`${SETTINGS_URL}&error=oauth_failed`, request.url),
      cookieName,
      isSecure
    );
  }

  const membership = await getUserOrganization();
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return redirectWithCookieDeletion(
      new URL(`${SETTINGS_URL}&error=oauth_failed`, request.url),
      cookieName,
      isSecure
    );
  }

  // 5. Exchange code for tokens
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const redirectUri = `${appUrl}/api/oauth/${platform}/callback`;

  try {
    const service = getAdPlatformService(platform);

    const tokens = await service.exchangeCodeForToken(code, redirectUri);
    console.log(`[oauth/${platform}] token exchange OK`);

    const accountInfo = await service.getAccountInfo(tokens.accessToken);

    // Google Ads requires a 10-digit customer ID. Reject malformed values early.
    if (platform === 'google' && !isGoogleCustomerId(accountInfo.externalId)) {
      console.error(
        `[oauth/${platform}] invalid customer id from provider: ${accountInfo.externalId}`
      );
      return redirectWithCookieDeletion(
        new URL(`${SETTINGS_URL}&error=oauth_no_ads_access`, request.url),
        cookieName,
        isSecure
      );
    }

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
      console.error(`[oauth/${platform}] upsert ad_account error:`, upsertError?.message);
      return redirectWithCookieDeletion(
        new URL(`${SETTINGS_URL}&error=oauth_failed&message=${encodeURIComponent(upsertError?.message || 'Database error')}`, request.url),
        cookieName,
        isSecure
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
      console.error(`[oauth/${platform}] upsert token error:`, tokenError.message);
      return redirectWithCookieDeletion(
        new URL(`${SETTINGS_URL}&error=oauth_failed&message=${encodeURIComponent(tokenError.message)}`, request.url),
        cookieName,
        isSecure
      );
    }

    const redirectParams = platform === 'google'
      ? '&connected=true&action_required=true'
      : '&connected=true';

    return redirectWithCookieDeletion(
      new URL(`${SETTINGS_URL}${redirectParams}`, request.url),
      cookieName,
      isSecure
    );
  } catch (err) {
    console.error(`[oauth/${platform}] unexpected error:`, err instanceof Error ? err.message : err);
    return redirectWithCookieDeletion(
      new URL(`${SETTINGS_URL}&error=oauth_failed&message=${encodeURIComponent(err instanceof Error ? err.message : String(err))}`, request.url),
      cookieName,
      isSecure
    );
  }
}
