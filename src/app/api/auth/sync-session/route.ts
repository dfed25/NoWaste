import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { ADMIN_ROLE_COOKIE, normalizeRole, type AppRole } from "@/lib/admin";
import {
  AUTH_COOKIE_NAME,
  CUSTOMER_ID_COOKIE_NAME,
  NW_RESTAURANT_APP_STATUS_COOKIE_NAME,
  RESTAURANT_ID_COOKIE_NAME,
} from "@/lib/auth-cookies";
import { encodeSignedCustomerId } from "@/lib/customer-id-cookie";
import {
  buildNwSessionCanonical,
  NW_SESSION_SIGNATURE_COOKIE_NAME,
  signNwSessionCanonical,
} from "@/lib/server-session";
import { normalizeRestaurantApplicationStatus } from "@/lib/restaurant-application-status";

const bodySchema = z.object({ access_token: z.string().min(1) }).strict();

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

/** Drop stale HMAC + scope cookies; keep `nw-authenticated` (Supabase session still valid). */
function clearStaleSignedSessionCookies(response: NextResponse) {
  const clearShared = {
    path: "/" as const,
    maxAge: 0,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
  const httpOnly = { ...clearShared, httpOnly: true as const };
  const roleVisible = { ...clearShared, httpOnly: false as const };
  response.cookies.set(CUSTOMER_ID_COOKIE_NAME, "", httpOnly);
  response.cookies.set(RESTAURANT_ID_COOKIE_NAME, "", httpOnly);
  response.cookies.set(NW_RESTAURANT_APP_STATUS_COOKIE_NAME, "", httpOnly);
  response.cookies.set(NW_SESSION_SIGNATURE_COOKIE_NAME, "", httpOnly);
  response.cookies.set(ADMIN_ROLE_COOKIE, "", roleVisible);
}

/**
 * Verifies the Supabase access token and issues signed `nw-*` cookies so APIs and
 * session-summary agree with the browser session (remembers you across reloads).
 */
export async function POST(request: Request) {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "AUTH_SESSION_SECRET is not configured" }, { status: 503 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  if (!url || !anon) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const supabase = createClient(url, anon);
  const { data, error } = await supabase.auth.getUser(parsed.data.access_token);
  if (error || !data.user) {
    const res = NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    clearStaleSignedSessionCookies(res);
    return res;
  }

  const user = data.user;
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  let role: AppRole | undefined =
    normalizeRole(meta?.app_role as string | undefined) ??
    normalizeRole(meta?.role as string | undefined);
  if (!role) role = "customer";

  let restaurantId = "";
  let staffApplicationStatus = "";
  if (role === "restaurant_staff") {
    restaurantId =
      (typeof meta?.restaurant_id === "string" && meta.restaurant_id.trim()) ||
      process.env.DEFAULT_STAFF_RESTAURANT_ID?.trim() ||
      "";
    staffApplicationStatus = normalizeRestaurantApplicationStatus(meta?.restaurant_application_status);
    // Unscoped staff still get a signed session (empty restaurant segment) so onboarding and
    // get-started flows can render until a location is attached in metadata.
  }

  const canonical = buildNwSessionCanonical(role, restaurantId, staffApplicationStatus);
  const signature = signNwSessionCanonical(canonical, secret);

  const shared = {
    path: "/" as const,
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
  const httpOnly = { ...shared, httpOnly: true as const };
  const roleVisible = { ...shared, httpOnly: false as const };

  const res = NextResponse.json({ ok: true, signed: true, role });
  res.cookies.set(AUTH_COOKIE_NAME, "1", httpOnly);
  res.cookies.set(ADMIN_ROLE_COOKIE, role, roleVisible);
  if (role === "restaurant_staff") {
    res.cookies.set(RESTAURANT_ID_COOKIE_NAME, restaurantId, httpOnly);
    res.cookies.set(NW_RESTAURANT_APP_STATUS_COOKIE_NAME, staffApplicationStatus, httpOnly);
  } else {
    res.cookies.set(RESTAURANT_ID_COOKIE_NAME, "", { ...httpOnly, maxAge: 0 });
    res.cookies.set(NW_RESTAURANT_APP_STATUS_COOKIE_NAME, "", { ...httpOnly, maxAge: 0 });
  }
  res.cookies.set(NW_SESSION_SIGNATURE_COOKIE_NAME, signature, httpOnly);

  const signedUserId = encodeSignedCustomerId(user.id);
  if (signedUserId) {
    res.cookies.set(CUSTOMER_ID_COOKIE_NAME, signedUserId, httpOnly);
  } else {
    res.cookies.set(CUSTOMER_ID_COOKIE_NAME, "", { ...httpOnly, maxAge: 0 });
  }

  return res;
}
