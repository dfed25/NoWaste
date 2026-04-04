import { NextResponse } from "next/server";
import { verifyServerSession } from "@/lib/server-session";

const noStore = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  const session = verifyServerSession(request);
  if (!session.isAuthenticated || !session.user?.role) {
    return NextResponse.json(
      { authenticated: false, role: null, scopedRestaurantId: null },
      { status: 200, headers: noStore },
    );
  }

  return NextResponse.json(
    {
      authenticated: true,
      role: session.user.role,
      scopedRestaurantId: session.user.scopedRestaurantId ?? null,
    },
    { status: 200, headers: noStore },
  );
}
