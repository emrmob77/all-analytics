import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Auth gerektiren rotalar
  const protectedPaths = [
    '/dashboard',
    '/campaigns',
    '/reports',
    '/settings',
    '/adgroups',
    '/audiences',
    '/keywords',
    '/creatives',
    '/budget',
    '/billing',
    '/google-ads',
    '/meta-ads',
    '/tiktok-ads',
    '/pinterest-ads',
    '/google-analytics',
    '/search-console',
  ]
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  )

  // Auth sayfaları
  const authPaths = ['/login', '/register']
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path))

  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(({ name, value, ...options }) => {
      redirectResponse.cookies.set(name, value, options)
    })
    return redirectResponse
  }

  if (user && isAuthPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(({ name, value, ...options }) => {
      redirectResponse.cookies.set(name, value, options)
    })
    return redirectResponse
  }

  return supabaseResponse
}
