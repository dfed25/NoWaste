import {
  canStaffOperateMarketplace,
  normalizeRestaurantApplicationStatus,
  type RestaurantApplicationStatus,
} from "@/lib/restaurant-application-status";
import { verifyServerSession } from "@/lib/server-session";

export type ListingAuthContext = {
  isAuthenticated: boolean;
  role: string | undefined;
  scopedRestaurantId: string | undefined;
  restaurantApplicationStatus?: RestaurantApplicationStatus;
};

export function staffRestaurantOperationsBlocked(
  context: ListingAuthContext,
): { status: number; error: string } | null {
  if (context.role !== "restaurant_staff") return null;
  const status = normalizeRestaurantApplicationStatus(context.restaurantApplicationStatus);
  if (canStaffOperateMarketplace(status)) return null;
  if (status === "pending_verification") {
    return {
      status: 403,
      error: "Complete verification on the restaurant onboarding page before publishing or managing orders.",
    };
  }
  if (status === "pending_approval") {
    return {
      status: 403,
      error: "Your application is awaiting admin approval. You can still finish your location profile.",
    };
  }
  if (status === "rejected") {
    return { status: 403, error: "This restaurant application was not approved." };
  }
  if (status === "suspended") {
    return { status: 403, error: "This restaurant account is suspended." };
  }
  return { status: 403, error: "Restaurant is not approved for marketplace operations." };
}

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
    restaurantApplicationStatus: verified.user.restaurantApplicationStatus,
  };
}
