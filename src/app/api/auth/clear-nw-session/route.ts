import { NextResponse } from "next/server";
import { ADMIN_ROLE_COOKIE } from "@/lib/admin";
import { AUTH_COOKIE_NAME, RESTAURANT_ID_COOKIE_NAME } from "@/lib/auth-cookies";
import { NW_SESSION_SIGNATURE_COOKIE_NAME } from "@/lib/server-session";

/**
 * Clears signed `nw-*` session cookies (httpOnly) so server-side auth matches a logged-out client.
 */
export async function POST() {
  const clearShared = {
    path: "/" as const,
    maxAge: 0,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
  const httpOnly = { ...clearShared, httpOnly: true as const };
  const roleVisible = { ...clearShared, httpOnly: false as const };

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE_NAME, "", httpOnly);
  res.cookies.set(RESTAURANT_ID_COOKIE_NAME, "", httpOnly);
  res.cookies.set(NW_SESSION_SIGNATURE_COOKIE_NAME, "", httpOnly);
  res.cookies.set(ADMIN_ROLE_COOKIE, "", roleVisible);
  return res;
}
