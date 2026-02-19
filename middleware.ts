import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPrefixes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/pricing",
  "/features",
  "/security",
  "/about",
  "/contact-sales",
  "/privacy",
  "/terms",
  "/cookies",
  "/saas",
  "/checkout",
  "/api/v1/auth"
];

const protectedPrefixes = [
  "/",
  "/performance",
  "/campaigns",
  "/channels",
  "/integrations",
  "/settings",
  "/team",
  "/attribution",
  "/notifications",
  "/support",
  "/knowledge-base",
  "/billing",
  "/onboarding"
];

function isPublicPath(pathname: string) {
  return publicPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function middleware(request: NextRequest) {
  const enforceAuth = process.env.AUTH_ENFORCED === "true";

  if (!enforceAuth) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  if (isPublicPath(pathname) || !isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get("allanalytics_session")?.value;

  if (!sessionToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
