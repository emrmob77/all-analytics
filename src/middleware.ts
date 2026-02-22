import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/campaigns/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/adgroups/:path*',
    '/audiences/:path*',
    '/keywords/:path*',
    '/creatives/:path*',
    '/budget/:path*',
    '/billing/:path*',
    '/google-ads/:path*',
    '/meta-ads/:path*',
    '/tiktok-ads/:path*',
    '/pinterest-ads/:path*',
    '/google-analytics/:path*',
    '/search-console/:path*',
    '/login',
    '/register',
    '/invitations/:path*',
  ],
}
