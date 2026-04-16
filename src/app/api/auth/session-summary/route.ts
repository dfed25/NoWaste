import { NextResponse } from "next/server";
import { readNwRoleCookieFallback, verifyServerSession } from "@/lib/server-session";

const noStore = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  const session = verifyServerSession(request);
  if (session.isAuthenticated && session.user?.role) {
    return NextResponse.json(
      {
        authenticated: true,
        trust: "signed" as const,
        role: session.user.role,
        scopedRestaurantId: session.user.scopedRestaurantId ?? null,
        restaurantApplicationStatus: session.user.restaurantApplicationStatus ?? null,
      },
      { status: 200, headers: noStore },
    );
  }

  const fallback = readNwRoleCookieFallback(request);
  if (fallback) {
    return NextResponse.json(
      {
        authenticated: true,
        trust: "cookie" as const,
        role: fallback,
        scopedRestaurantId: null,
        restaurantApplicationStatus: null,
      },
      { status: 200, headers: noStore },
    );
  }

  return NextResponse.json(
    {
      authenticated: false,
      trust: "none" as const,
      role: null,
      scopedRestaurantId: null,
      restaurantApplicationStatus: null,
    },
    { status: 200, headers: noStore },
  );
}
