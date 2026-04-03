import { cookies } from "next/headers";
import { RESTAURANT_ID_COOKIE_NAME } from "@/lib/auth-cookies";
import { verifyServerSession } from "@/lib/server-session";

export type ListingAuthContext = {
  isAuthenticated: boolean;
  role: string | undefined;
  scopedRestaurantId: string | undefined;
};

export async function resolveListingAuthContext(request: Request): Promise<ListingAuthContext> {
  const verified = verifyServerSession(request);
  if (!verified.isAuthenticated || !verified.user?.role) {
    return {
      isAuthenticated: false,
      role: undefined,
      scopedRestaurantId: undefined,
    };
  }

  const cookieStore = await cookies();
  const role = verified.user.role;
  // Staff scope comes from the restaurant id cookie once the session is verified; replace with
  // server-stored restaurant binding when user profiles carry restaurantId.
  const scopedRestaurantId =
    role === "restaurant_staff" ? cookieStore.get(RESTAURANT_ID_COOKIE_NAME)?.value : undefined;

  return {
    isAuthenticated: true,
    role,
    scopedRestaurantId,
  };
}
