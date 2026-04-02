export type DietaryTag = "vegan" | "vegetarian" | "gluten_free" | "dairy_free";

export type ListingItem = {
  id: string;
  title: string;
  description: string;
  restaurantId: string;
  restaurantName: string;
  distanceMiles: number;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  dietary: DietaryTag[];
  priceCents: number;
  quantityRemaining: number;
  allergyNotes?: string;
};

export type RestaurantItem = {
  id: string;
  name: string;
  description: string;
  distanceMiles: number;
  address: string;
  tags: string[];
};

export type CustomerOrder = {
  id: string;
  listingId: string;
  listingTitle: string;
  totalCents: number;
  quantity: number;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  createdAt: string;
  fulfillmentStatus: "reserved" | "picked_up" | "missed_pickup" | "expired";
  paymentStatus: "paid" | "refunded";
  reservationCode: string;
};

export const restaurants: RestaurantItem[] = [
  {
    id: "r1",
    name: "Green Fork Kitchen",
    description: "Seasonal bowls and salads.",
    distanceMiles: 1.2,
    address: "20 Market St, SF, CA",
    tags: ["healthy", "bowls"],
  },
  {
    id: "r2",
    name: "Brick Oven Bakery",
    description: "Daily bread and pastry surplus.",
    distanceMiles: 2.4,
    address: "111 Pine Ave, SF, CA",
    tags: ["bakery", "pastry"],
  },
];

export const listings: ListingItem[] = [
  {
    id: "l1",
    title: "Evening surplus bowl packs",
    description: "Assorted grain bowls prepared today.",
    restaurantId: "r1",
    restaurantName: "Green Fork Kitchen",
    distanceMiles: 1.2,
    pickupWindowStart: "2026-04-02T20:30:00.000Z",
    pickupWindowEnd: "2026-04-02T21:15:00.000Z",
    dietary: ["vegetarian", "dairy_free"],
    priceCents: 899,
    quantityRemaining: 6,
    allergyNotes: "Contains sesame.",
  },
  {
    id: "l2",
    title: "Bakery surprise bags",
    description: "Mixed pastries and bread from end of day.",
    restaurantId: "r2",
    restaurantName: "Brick Oven Bakery",
    distanceMiles: 2.4,
    pickupWindowStart: "2026-04-02T19:45:00.000Z",
    pickupWindowEnd: "2026-04-02T20:30:00.000Z",
    dietary: ["vegetarian"],
    priceCents: 650,
    quantityRemaining: 10,
    allergyNotes: "Contains wheat, eggs, and dairy.",
  },
  {
    id: "l3",
    title: "Vegan meal packs",
    description: "Plant-based dinner packs ready for pickup.",
    restaurantId: "r1",
    restaurantName: "Green Fork Kitchen",
    distanceMiles: 1.2,
    pickupWindowStart: "2026-04-02T21:00:00.000Z",
    pickupWindowEnd: "2026-04-02T21:30:00.000Z",
    dietary: ["vegan", "gluten_free"],
    priceCents: 1099,
    quantityRemaining: 4,
  },
];

export const mockOrders: CustomerOrder[] = [
  {
    id: "ord_1001",
    listingId: "l1",
    listingTitle: "Evening surplus bowl packs",
    totalCents: 1798,
    quantity: 2,
    pickupWindowStart: "2026-04-02T20:30:00.000Z",
    pickupWindowEnd: "2026-04-02T21:15:00.000Z",
    createdAt: "2026-04-02T18:42:00.000Z",
    fulfillmentStatus: "reserved",
    paymentStatus: "paid",
    reservationCode: "NW-3H4K-8P2M",
  },
  {
    id: "ord_1002",
    listingId: "l2",
    listingTitle: "Bakery surprise bags",
    totalCents: 650,
    quantity: 1,
    pickupWindowStart: "2026-04-01T19:45:00.000Z",
    pickupWindowEnd: "2026-04-01T20:30:00.000Z",
    createdAt: "2026-04-01T17:30:00.000Z",
    fulfillmentStatus: "expired",
    paymentStatus: "refunded",
    reservationCode: "NW-9L1D-2T7Q",
  },
];

type MarketplaceFilters = {
  keyword?: string;
  maxDistanceMiles?: number;
  pickupPart?: "any" | "afternoon" | "evening" | "night";
  dietary?: DietaryTag | "any";
  maxPriceCents?: number;
};

export function filterListings(
  source: ListingItem[],
  filters: MarketplaceFilters,
): ListingItem[] {
  return source.filter((listing) => {
    if (filters.keyword) {
      const q = filters.keyword.toLowerCase();
      const haystack = `${listing.title} ${listing.description} ${listing.restaurantName}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    if (filters.maxDistanceMiles && listing.distanceMiles > filters.maxDistanceMiles) {
      return false;
    }

    if (filters.maxPriceCents && listing.priceCents > filters.maxPriceCents) {
      return false;
    }

    if (filters.dietary && filters.dietary !== "any") {
      if (!listing.dietary.includes(filters.dietary)) return false;
    }

    if (filters.pickupPart && filters.pickupPart !== "any") {
      const hour = new Date(listing.pickupWindowStart).getHours();
      if (filters.pickupPart === "afternoon" && (hour < 12 || hour >= 17)) return false;
      if (filters.pickupPart === "evening" && (hour < 17 || hour >= 21)) return false;
      if (filters.pickupPart === "night" && hour < 21) return false;
    }

    return true;
  });
}

export function getListingById(id: string) {
  return listings.find((listing) => listing.id === id) ?? null;
}

export function getRestaurantById(id: string) {
  return restaurants.find((restaurant) => restaurant.id === id) ?? null;
}

export function getOrdersForCustomer() {
  return mockOrders;
}

export function generatePickupCode(orderId: string) {
  const base = orderId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const chunked = `${base.slice(0, 2)}-${base.slice(2, 6)}-${base.slice(6, 10)}`;
  return `NW-${chunked}`.slice(0, 14);
}

export function canCancelOrder(order: CustomerOrder, now = new Date()) {
  if (order.fulfillmentStatus !== "reserved") return false;
  const pickupStart = new Date(order.pickupWindowStart).getTime();
  const nowTs = now.getTime();
  return nowTs < pickupStart - 30 * 60 * 1000;
}

export function qualifiesForRefund(order: CustomerOrder) {
  return order.fulfillmentStatus === "expired" || order.fulfillmentStatus === "missed_pickup";
}

