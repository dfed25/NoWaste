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

  const role = verified.user.role;
  const scopedRestaurantId =
    role === "restaurant_staff" ? verified.user.scopedRestaurantId : undefined;

  return {
    isAuthenticated: true,
    role,
    scopedRestaurantId,
  };
}
