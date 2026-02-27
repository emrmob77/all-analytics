import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { getAdPlatformService } from '@/services/ad-platforms';
import { getUserOrganization } from '@/lib/actions/organization';
import type { AdPlatform } from '@/types';

const VALID_PLATFORMS: AdPlatform[] = ['google', 'meta', 'tiktok', 'pinterest'];
const SETTINGS_URL = '/settings?tab=connections';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform: rawPlatform } = await params;

  if (!VALID_PLATFORMS.includes(rawPlatform as AdPlatform)) {
    return NextResponse.redirect(new URL(`${SETTINGS_URL}&error=invalid_platform`, request.url));
  }
  const platform = rawPlatform as AdPlatform;

  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const membership = await getUserOrganization();
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.redirect(new URL(`${SETTINGS_URL}&error=oauth_failed`, request.url));
  }

  // Generate state and build auth URL
  const state = randomBytes(32).toString('hex');
  const statePayload = JSON.stringify({
    state,
    user_id: user.id,
    organization_id: membership.organization.id,
  });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const redirectUri = `${appUrl}/api/oauth/${platform}/callback`;

  let authUrl: string;
  try {
    const service = getAdPlatformService(platform);
    authUrl = service.getAuthUrl(redirectUri, state);
  } catch (err) {
    console.error(`[oauth/${platform}/initiate] error:`, err);
    return NextResponse.redirect(new URL(`${SETTINGS_URL}&error=oauth_failed`, request.url));
  }

  // Set state cookie on the redirect response — reliable server-side Set-Cookie
  const response = NextResponse.redirect(authUrl);
  response.cookies.set(`oauth_state_${platform}`, statePayload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  console.log(`[oauth/${platform}/initiate] redirecting to platform, state set`);
  return response;
}
