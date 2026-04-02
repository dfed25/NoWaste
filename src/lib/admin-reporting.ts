import { listings, mockOrders, restaurants } from "@/lib/marketplace";
import { donations, users } from "@/lib/admin-mocks";

export function getAdminTables() {
  return { restaurants, listings, orders: mockOrders, donations, users };
}

export function getReportingMetrics() {
  const soldCount = mockOrders.filter((order) => order.fulfillmentStatus === "picked_up").length;
  const donatedCount = donations.length;
  const totalRecoveredCents = mockOrders
    .filter((order) => order.paymentStatus === "paid" && order.fulfillmentStatus === "picked_up")
    .reduce((sum, order) => sum + order.totalCents, 0);

  return {
    soldVsDonated: { soldCount, donatedCount },
    wastePreventedLbs: soldCount * 2.5 + donatedCount * 3.2,
    revenueRecoveredDollars: totalRecoveredCents / 100,
    listingConversionRate: listings.length === 0 ? 0 : (mockOrders.length / listings.length) * 100,
    activeRestaurants: restaurants.length,
  };
}

export function buildCsvExport() {
  const metrics = getReportingMetrics();
  const lines = [
    "metric,value",
    `sold_count,${metrics.soldVsDonated.soldCount}`,
    `donated_count,${metrics.soldVsDonated.donatedCount}`,
    `waste_prevented_lbs,${metrics.wastePreventedLbs.toFixed(2)}`,
    `revenue_recovered_dollars,${metrics.revenueRecoveredDollars.toFixed(2)}`,
    `listing_conversion_rate,${metrics.listingConversionRate.toFixed(2)}`,
    `active_restaurants,${metrics.activeRestaurants}`,
  ];
  return lines.join("\n");
}

