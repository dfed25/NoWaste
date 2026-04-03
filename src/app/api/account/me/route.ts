import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createCustomerId,
  encodeSignedCustomerId,
  getCustomerIdCookieName,
  parseCustomerIdCookie,
  parseCustomerIdCookieFromCookieHeader,
} from "@/lib/customer-id-cookie";
import { getAccountProfile, saveAccountProfile } from "@/lib/account-profile-store";
import { accountSettingsSchema } from "@/lib/validation";

type ResolvedCustomer = {
  customerId?: string;
  encodedCookieValue?: string;
};

async function resolveCustomer(request: Request): Promise<ResolvedCustomer> {
  try {
    const cookieStore = await cookies();
    const rawValue = cookieStore.get(getCustomerIdCookieName())?.value;
    const parsed = parseCustomerIdCookie(rawValue);
    if (parsed.customerId) {
      if (parsed.needsResign) {
        const encoded = encodeSignedCustomerId(parsed.customerId);
        return { customerId: parsed.customerId, encodedCookieValue: encoded };
      }
      return { customerId: parsed.customerId };
    }
  } catch {
    // cookies() can fail outside request scope in direct tests.
  }

  const fallback = parseCustomerIdCookieFromCookieHeader(request);
  if (fallback.customerId) {
    if (fallback.needsResign) {
      const encoded = encodeSignedCustomerId(fallback.customerId);
      return { customerId: fallback.customerId, encodedCookieValue: encoded };
    }
    return { customerId: fallback.customerId };
  }

  const customerId = createCustomerId();
  const encodedCookieValue = encodeSignedCustomerId(customerId);
  return { customerId, encodedCookieValue };
}

function withCustomerCookie(response: NextResponse, encodedCookieValue?: string) {
  if (!encodedCookieValue) return response;

  response.cookies.set(getCustomerIdCookieName(), encodedCookieValue, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export async function GET(request: Request) {
  const resolved = await resolveCustomer(request);
  if (!resolved.customerId) {
    return NextResponse.json({ error: "Account is temporarily unavailable" }, { status: 503 });
  }

  try {
    const profile = await getAccountProfile(resolved.customerId);
    const response = NextResponse.json({ profile }, { status: 200 });
    return withCustomerCookie(response, resolved.encodedCookieValue);
  } catch (error) {
    console.error("Failed to fetch account profile", { error });
    return NextResponse.json({ error: "Failed to fetch account profile" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const resolved = await resolveCustomer(request);
  if (!resolved.customerId) {
    return NextResponse.json({ error: "Account is temporarily unavailable" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON payload" }, { status: 400 });
  }

  const parsed = accountSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid account settings payload" },
      { status: 400 },
    );
  }

  try {
    const profile = await saveAccountProfile(resolved.customerId, parsed.data);
    const response = NextResponse.json({ ok: true, profile }, { status: 200 });
    return withCustomerCookie(response, resolved.encodedCookieValue);
  } catch (error) {
    console.error("Failed to save account profile", { error });
    return NextResponse.json({ error: "Failed to save account profile" }, { status: 500 });
  }
}
