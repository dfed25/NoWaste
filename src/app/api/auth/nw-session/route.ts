import { NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_ROLE_COOKIE } from "@/lib/admin";
import { AUTH_COOKIE_NAME, RESTAURANT_ID_COOKIE_NAME } from "@/lib/auth-cookies";
import {
  buildNwSessionCanonical,
  NW_SESSION_SIGNATURE_COOKIE_NAME,
  signNwSessionCanonical,
} from "@/lib/server-session";

const bodySchema = z
  .object({
    role: z.enum(["customer", "restaurant_staff", "admin"]),
    restaurantId: z.string().optional(),
  })
  .strict();

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function allowNwSessionIssue() {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_NW_SESSION_ISSUE === "1";
}

/**
 * Issues `nw-authenticated`, `nw-role`, optional `nw-restaurant-id`, and signed `nw-session-sig`
 * so restaurant scope cannot be altered without invalidating the HMAC.
 *
 * Disabled in production unless `ALLOW_NW_SESSION_ISSUE=1`. Replace with a verified Supabase
 * (or similar) callback when user profiles own `restaurantId`.
 */
export async function POST(request: Request) {
  if (!allowNwSessionIssue()) {
    return NextResponse.json({ error: "Session issue API is disabled in this environment" }, { status: 403 });
  }

  if (process.env.NODE_ENV === "production") {
    const issueSecret = process.env.NW_SESSION_ISSUE_SECRET;
    const provided = request.headers.get("x-nw-session-issue-secret");
    if (!issueSecret || provided !== issueSecret) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "AUTH_SESSION_SECRET is not configured" }, { status: 503 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid body" },
      { status: 400 },
    );
  }

  const { role } = parsed.data;
  const restaurantId =
    role === "restaurant_staff" ? (parsed.data.restaurantId?.trim() ?? "") : "";

  if (role === "restaurant_staff" && !restaurantId) {
    return NextResponse.json({ error: "restaurantId is required for restaurant_staff" }, { status: 400 });
  }

  const canonical = buildNwSessionCanonical(role, restaurantId);
  const signature = signNwSessionCanonical(canonical, secret);

  const res = NextResponse.json({ ok: true });
  const shared = {
    path: "/" as const,
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
  const httpOnly = { ...shared, httpOnly: true as const };
  const roleVisible = { ...shared, httpOnly: false as const };

  res.cookies.set(AUTH_COOKIE_NAME, "1", httpOnly);
  res.cookies.set(ADMIN_ROLE_COOKIE, role, roleVisible);
  if (role === "restaurant_staff") {
    res.cookies.set(RESTAURANT_ID_COOKIE_NAME, restaurantId, httpOnly);
  } else {
    res.cookies.set(RESTAURANT_ID_COOKIE_NAME, "", { ...httpOnly, maxAge: 0 });
  }
  res.cookies.set(NW_SESSION_SIGNATURE_COOKIE_NAME, signature, httpOnly);
  return res;
}
