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
    '/login',
    '/register',
  ],
}
