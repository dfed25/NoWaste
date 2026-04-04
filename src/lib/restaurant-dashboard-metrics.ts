import "server-only";
import type { StatusIndicatorStatus } from "@/lib/status-indicator-status";
import { autoFlagUnsoldListingsNearingClose } from "@/lib/donation";
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

/** Pickup window overlaps the server-local calendar day (demo-friendly; replace with venue TZ when available). */
function pickupOverlapsLocalToday(listing: {
  pickupWindowStart: string;
  pickupWindowEnd: string;
}): boolean {
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;
  const ws = new Date(listing.pickupWindowStart).getTime();
  const we = new Date(listing.pickupWindowEnd).getTime();
  if (!Number.isFinite(ws) || !Number.isFinite(we)) return false;
  return we > dayStart && ws < dayEnd;
}

export async function getRestaurantDashboardData(restaurantId: string): Promise<{
  metrics: RestaurantDashboardMetrics;
  activity: DashboardActivityItem[];
  tonightListings: TonightListingRow[];
}> {
  let listings: Awaited<ReturnType<typeof listManagedListings>> = [];
  let orders: Awaited<ReturnType<typeof listOrdersForRestaurant>> = [];

  try {
    listings = await listManagedListings({ restaurantId });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== "ENOENT") {
      console.error("getRestaurantDashboardData: listManagedListings failed", error);
    }
  }

  try {
    orders = await listOrdersForRestaurant(restaurantId);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== "ENOENT") {
      console.error("getRestaurantDashboardData: listOrdersForRestaurant failed", error);
    }
  }

  const active = listings.filter((l) => l.status === "active");
  const activeToday = active.filter(pickupOverlapsLocalToday);
  const itemsRemaining = active.reduce((sum, l) => sum + l.quantityRemaining, 0);
  const donationCandidates = autoFlagUnsoldListingsNearingClose(active);
  const donationEligible = donationCandidates.length;
  const nearDonationIds = new Set(donationCandidates.map((l) => l.id));

  const activeReservations = orders.filter((o) => o.fulfillmentStatus === "reserved").length;

  const activity: DashboardActivityItem[] = orders.slice(0, 8)
    .map((order) => ({
      id: order.id,
      at: order.createdAt,
      text: `Order ${order.id.slice(-8)} — ${order.listingTitle} (${order.fulfillmentStatus.replaceAll("_", " ")}, ${order.paymentStatus})`,
    }));

  const tonightListings: TonightListingRow[] = [...activeToday]
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
