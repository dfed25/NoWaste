import type { ListingItem } from "@/lib/marketplace";

export type DonationPartner = {
  id: string;
  name: string;
  serviceRadiusMiles: number;
  hours: {
    startHour: number;
    endHour: number;
  };
  acceptsNotifications: {
    email: boolean;
    sms: boolean;
  };
};

export type DonationReadyItem = {
  id: string;
  listingId: string;
  restaurantId: string;
  title: string;
  quantity: number;
  readyAt: string;
  status: "donation_ready" | "claimed" | "picked_up" | "completed";
  claimedByPartnerId?: string;
};

export const donationPartners: DonationPartner[] = [
  {
    id: "dp1",
    name: "City Food Rescue",
    serviceRadiusMiles: 10,
    hours: { startHour: 8, endHour: 22 },
    acceptsNotifications: { email: true, sms: true },
  },
  {
    id: "dp2",
    name: "Night Meals Collective",
    serviceRadiusMiles: 5,
    hours: { startHour: 12, endHour: 23 },
    acceptsNotifications: { email: true, sms: false },
  },
];

export function autoFlagUnsoldListingsNearingClose(
  listings: ListingItem[],
  now = new Date(),
): ListingItem[] {
  return listings.filter((listing) => {
    const closeTs = new Date(listing.pickupWindowEnd).getTime();
    const minutesRemaining = (closeTs - now.getTime()) / (60 * 1000);
    return listing.quantityRemaining > 0 && minutesRemaining <= 45 && minutesRemaining >= 0;
  });
}

export function convertToDonationReadyItem(listing: ListingItem): DonationReadyItem {
  return {
    id: `don_${listing.id}`,
    listingId: listing.id,
    restaurantId: listing.restaurantId,
    title: listing.title,
    quantity: listing.quantityRemaining,
    readyAt: new Date().toISOString(),
    status: "donation_ready",
  };
}

export function findMatchingPartners(
  listingDistanceMiles: number,
  pickupStartIso: string,
  partners = donationPartners,
) {
  const hour = new Date(pickupStartIso).getHours();
  return partners.filter((partner) => {
    const withinRadius = listingDistanceMiles <= partner.serviceRadiusMiles;
    const withinHours = hour >= partner.hours.startHour && hour < partner.hours.endHour;
    return withinRadius && withinHours;
  });
}

export function claimDonation(
  item: DonationReadyItem,
  partnerId: string,
): { ok: true; item: DonationReadyItem } | { ok: false; reason: string } {
  if (item.status !== "donation_ready") {
    return { ok: false, reason: "Donation is no longer claimable." };
  }

  return {
    ok: true,
    item: { ...item, status: "claimed", claimedByPartnerId: partnerId },
  };
}

export function markDonationPickedUp(item: DonationReadyItem) {
  if (item.status !== "claimed") return item;
  return { ...item, status: "picked_up" as const };
}

export function markDonationCompleted(item: DonationReadyItem) {
  if (item.status !== "picked_up") return item;
  return { ...item, status: "completed" as const };
}

