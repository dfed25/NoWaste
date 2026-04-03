import type { CustomerOrder, ListingItem } from "@/lib/marketplace";

export function makeListing(overrides: Partial<ListingItem> = {}): ListingItem {
  return {
    id: "listing_test",
    title: "Factory listing",
    description: "Factory listing description with enough length.",
    restaurantId: "r_test",
    restaurantName: "Factory Restaurant",
    distanceMiles: 1,
    pickupWindowStart: "2026-04-02T20:00:00.000Z",
    pickupWindowEnd: "2026-04-02T21:00:00.000Z",
    dietary: ["vegetarian"],
    priceCents: 700,
    quantityRemaining: 3,
    ...overrides,
  };
}

export function makeOrder(overrides: Partial<CustomerOrder> = {}): CustomerOrder {
  return {
    id: "ord_test",
    listingId: "listing_test",
    restaurantId: "r_test",
    restaurantName: "Factory Restaurant",
    listingTitle: "Factory listing",
    totalCents: 1400,
    quantity: 2,
    pickupWindowStart: "2026-04-02T20:00:00.000Z",
    pickupWindowEnd: "2026-04-02T21:00:00.000Z",
    createdAt: "2026-04-02T18:00:00.000Z",
    fulfillmentStatus: "reserved",
    paymentStatus: "paid",
    reservationCode: "NW-TEST-0001",
    ...overrides,
  };
}

