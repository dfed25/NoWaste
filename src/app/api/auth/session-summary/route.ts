import { NextResponse } from "next/server";
import { verifyServerSession } from "@/lib/server-session";

export async function GET(request: Request) {
  const session = verifyServerSession(request);
  if (!session.isAuthenticated || !session.user?.role) {
    return NextResponse.json(
      { authenticated: false, role: null, scopedRestaurantId: null },
      { status: 200 },
    );
  }

  return NextResponse.json({
    authenticated: true,
    role: session.user.role,
    scopedRestaurantId: session.user.scopedRestaurantId ?? null,
  });
}
