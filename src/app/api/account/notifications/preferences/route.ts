import { NextResponse } from "next/server";
import {
  getNotificationPreferences,
  saveNotificationPreferences,
} from "@/lib/notification-preferences-store";
import { notificationPreferenceSchema } from "@/lib/validation";
import { resolveCustomer, withCustomerCookie } from "@/lib/customer-cookie-utils";

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
