import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = [
  "/dashboard",
  "/account",
  "/onboarding",
  "/pickups",
  "/donation",
  "/admin",
];

const authPages = ["/auth/login", "/auth/sign-up", "/auth/reset-password"];

const AUTH_COOKIE_NAME = "nw-authenticated";
const ROLE_COOKIE_NAME = "nw-role";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAuthenticated = request.cookies.get(AUTH_COOKIE_NAME)?.value === "1";
  const role = request.cookies.get(ROLE_COOKIE_NAME)?.value;

  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const isAuthPage = authPages.some((page) => pathname.startsWith(page));
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/account/:path*",
    "/onboarding/:path*",
    "/pickups/:path*",
    "/donation/:path*",
    "/admin/:path*",
    "/auth/:path*",
  ],
};

