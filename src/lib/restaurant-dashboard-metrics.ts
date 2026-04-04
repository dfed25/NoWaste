import "server-only";
import type { StatusIndicatorStatus } from "@/components/ui/status-indicator";
import { autoFlagUnsoldListingsNearingClose } from "@/lib/donation";
import type { ListingItem } from "@/lib/marketplace";
import { listManagedListings } from "@/lib/marketplace-store";
import { listOrdersForRestaurant } from "@/lib/order-store";

export type RestaurantDashboardMetrics = {
  activeListings: number;
  activeReservations: number;
  itemsRemaining: number;
  donationEligible: number;
};

export type DashboardActivityItem = {
  id: string;
  text: string;
  at: string;
};

export type TonightListingRow = {
  id: string;
  title: string;
  qty: number;
  status: StatusIndicatorStatus;
};

export async function getRestaurantDashboardData(restaurantId: string): Promise<{
  metrics: RestaurantDashboardMetrics;
  activity: DashboardActivityItem[];
  tonightListings: TonightListingRow[];
}> {
  const listings = await listManagedListings({ restaurantId });
  const active = listings.filter((l) => l.status === "active");
  const itemsRemaining = active.reduce((sum, l) => sum + l.quantityRemaining, 0);
  const donationCandidates = autoFlagUnsoldListingsNearingClose(active as ListingItem[]);
  const donationEligible = donationCandidates.length;
  const nearDonationIds = new Set(donationCandidates.map((l) => l.id));

  const orders = await listOrdersForRestaurant(restaurantId);
  const activeReservations = orders.filter((o) => o.fulfillmentStatus === "reserved").length;

  const activity: DashboardActivityItem[] = [...orders]
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 8)
    .map((order) => ({
      id: order.id,
      at: order.createdAt,
      text: `Order ${order.id.slice(-8)} — ${order.listingTitle} (${order.fulfillmentStatus.replaceAll("_", " ")}, ${order.paymentStatus})`,
    }));

  const tonightListings: TonightListingRow[] = [...active]
    .sort(
      (a, b) =>
        new Date(a.pickupWindowEnd).getTime() - new Date(b.pickupWindowEnd).getTime(),
    )
    .slice(0, 8)
    .map((l) => {
      let status: StatusIndicatorStatus = "active";
      if (nearDonationIds.has(l.id)) status = "donation_eligible";
      else if (l.quantityRemaining <= 0) status = "reserved";
      return {
        id: l.id,
        title: l.title,
        qty: l.quantityRemaining,
        status,
      };
    });

  return {
    metrics: {
      activeListings: active.length,
      activeReservations,
      itemsRemaining,
      donationEligible,
    },
    activity,
    tonightListings,
  };
}
