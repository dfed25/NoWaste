import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CUSTOMER_ID_COOKIE_NAME } from "@/lib/auth-cookies";
import { createCustomerId } from "@/lib/customer-id-cookie";
import {
  getNotificationPreferences,
  saveNotificationPreferences,
} from "@/lib/notification-preferences-store";
import { notificationPreferenceSchema } from "@/lib/validation";

function withCustomerCookie(response: NextResponse, customerId: string, shouldSet: boolean) {
  if (!shouldSet) return response;

  response.cookies.set(CUSTOMER_ID_COOKIE_NAME, customerId, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

async function resolveCustomer(request: Request): Promise<{ customerId: string; shouldSetCookie: boolean }> {
  try {
    const cookieStore = await cookies();
    const fromCookie = cookieStore.get(CUSTOMER_ID_COOKIE_NAME)?.value;
    if (fromCookie) return { customerId: fromCookie, shouldSetCookie: false };
  } catch {
    // cookies() can fail in direct unit tests.
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${CUSTOMER_ID_COOKIE_NAME}=([^;]+)`));
  if (match?.[1]) {
    try {
      return { customerId: decodeURIComponent(match[1]), shouldSetCookie: false };
    } catch {
      return { customerId: match[1], shouldSetCookie: false };
    }
  }

  return {
    customerId: createCustomerId(),
    shouldSetCookie: true,
  };
}

export async function GET(request: Request) {
  let resolved: { customerId: string; shouldSetCookie: boolean };
  try {
    resolved = await resolveCustomer(request);
  } catch (error) {
    console.error("Failed resolving customer for notification preferences", error);
    return NextResponse.json({ error: "Account is temporarily unavailable" }, { status: 503 });
  }

  try {
    const preference = await getNotificationPreferences(resolved.customerId);
    const response = NextResponse.json({ preference }, { status: 200 });
    return withCustomerCookie(response, resolved.customerId, resolved.shouldSetCookie);
  } catch (error) {
    console.error("Failed to fetch notification preferences", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  let resolved: { customerId: string; shouldSetCookie: boolean };
  try {
    resolved = await resolveCustomer(request);
  } catch (error) {
    console.error("Failed resolving customer for notification preferences", error);
    return NextResponse.json({ error: "Account is temporarily unavailable" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON payload" }, { status: 400 });
  }

  const current = await getNotificationPreferences(resolved.customerId);
  const mergedCandidate = {
    ...current,
    ...(body && typeof body === "object" ? (body as Record<string, unknown>) : {}),
    userId: resolved.customerId,
  };

  const parsed = notificationPreferenceSchema.safeParse(mergedCandidate);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid preferences payload" },
      { status: 400 },
    );
  }

  try {
    const preference = await saveNotificationPreferences(resolved.customerId, parsed.data);
    const response = NextResponse.json({ ok: true, preference }, { status: 200 });
    return withCustomerCookie(response, resolved.customerId, resolved.shouldSetCookie);
  } catch (error) {
    console.error("Failed to save notification preferences", error);
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
  }
}
