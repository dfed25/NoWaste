import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CUSTOMER_ID_COOKIE_NAME } from "@/lib/auth-cookies";
import { createCustomerId } from "@/lib/customer-id-cookie";

export type ResolvedCustomer = {
  customerId: string;
  shouldSetCookie: boolean;
};

export function withCustomerCookie(response: NextResponse, customerId: string, shouldSet: boolean) {
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

export async function resolveCustomer(request: Request): Promise<ResolvedCustomer> {
  try {
    const cookieStore = await cookies();
    const fromCookie = cookieStore.get(CUSTOMER_ID_COOKIE_NAME)?.value;
    if (fromCookie) {
      return { customerId: fromCookie, shouldSetCookie: false };
    }
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
