import "server-only";
import { restaurants } from "@/lib/marketplace";
import { getRestaurantOnboardingDraft } from "@/lib/restaurant-onboarding-store";
import { getRestaurantRegistryEntry } from "@/lib/restaurant-registry";

export type ResolvedListingRestaurant = {
  id: string;
  name: string;
  distanceMiles: number;
};

/**
 * Seed fixtures, onboarding drafts, and signup registry supply enough to create listings for new venues.
 */
export async function resolveRestaurantForListing(
  restaurantId: string,
): Promise<ResolvedListingRestaurant | null> {
  const seed = restaurants.find((r) => r.id === restaurantId);
  if (seed) {
    return { id: seed.id, name: seed.name, distanceMiles: seed.distanceMiles };
  }

  const draft = await getRestaurantOnboardingDraft(restaurantId);
  if (draft?.data?.restaurantName?.trim()) {
    return {
      id: restaurantId,
      name: draft.data.restaurantName.trim(),
      distanceMiles: 0,
    };
  }

  const reg = await getRestaurantRegistryEntry(restaurantId);
  if (reg?.businessLegalName?.trim()) {
    return {
      id: restaurantId,
      name: reg.businessLegalName.trim(),
      distanceMiles: 0,
    };
  }

  return null;
}
