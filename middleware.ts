import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routeForRole } from "@/lib/admin";

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

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAuthenticated = request.cookies.get(AUTH_COOKIE_NAME)?.value === "1";
  const role = request.cookies.get("nw-role")?.value;

  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (pathname === "/" && !isAuthenticated) {
    return NextResponse.redirect(new URL("/get-started", request.url));
  }

  if (pathname === "/get-started" && isAuthenticated) {
    return NextResponse.redirect(new URL(routeForRole(role), request.url));
  }

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isAuthPage = authPages.some((page) => pathname.startsWith(page));
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL(routeForRole(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/get-started",
    "/dashboard/:path*",
    "/account/:path*",
    "/onboarding/:path*",
    "/pickups/:path*",
    "/donation/:path*",
    "/admin/:path*",
    "/auth/:path*",
  ],
};
