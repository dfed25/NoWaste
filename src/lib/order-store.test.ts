import { beforeEach, describe, expect, it } from "vitest";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import {
  cancelOrder,
  createReservedOrder,
  listOrdersForCustomer,
  listOrdersForRestaurant,
  updateOrderFulfillment,
} from "@/lib/order-store";

const DATA_DIR = path.join(process.cwd(), ".nowaste-data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

describe("order-store", () => {
  beforeEach(async () => {
    await mkdir(DATA_DIR, { recursive: true });
    await rm(ORDERS_FILE, { force: true });
  });

  it("creates and lists customer orders", async () => {
    await createReservedOrder({
      customerId: "cust_1",
      listingId: "l1",
      listingTitle: "Test Listing",
      restaurantId: "r1",
      restaurantName: "Test Kitchen",
      quantity: 2,
      totalCents: 1800,
      pickupWindowStart: "2026-04-02T20:00:00.000Z",
      pickupWindowEnd: "2026-04-02T21:00:00.000Z",
      paymentStatus: "paid",
    });

    const orders = await listOrdersForCustomer("cust_1");
    expect(orders.length).toBe(1);
    expect(orders[0]?.listingId).toBe("l1");
    expect(orders[0]?.fulfillmentStatus).toBe("reserved");
  });

  it("cancels only reserved orders for the same customer", async () => {
    const pickupStart = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const pickupEnd = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const created = await createReservedOrder({
      customerId: "cust_2",
      listingId: "l2",
      listingTitle: "Cancel Listing",
      restaurantId: "r2",
      restaurantName: "Cancel Cafe",
      quantity: 1,
      totalCents: 700,
      pickupWindowStart: pickupStart.toISOString(),
      pickupWindowEnd: pickupEnd.toISOString(),
      paymentStatus: "paid",
    });

    const wrongCustomerResult = await cancelOrder(created.id, "cust_other");
    expect(wrongCustomerResult).toBeNull();

    const canceled = await cancelOrder(created.id, "cust_2");
    expect(canceled?.fulfillmentStatus).toBe("expired");
    expect(canceled?.paymentStatus).toBe("refunded");
  });

  it("lists and updates fulfillment for a restaurant", async () => {
    const created = await createReservedOrder({
      customerId: "cust_r",
      listingId: "lx",
      listingTitle: "Staff test",
      restaurantId: "r_staff",
      restaurantName: "Staff Place",
      quantity: 1,
      totalCents: 500,
      pickupWindowStart: "2026-04-02T20:00:00.000Z",
      pickupWindowEnd: "2026-04-02T21:00:00.000Z",
      paymentStatus: "paid",
    });

    const listed = await listOrdersForRestaurant("r_staff");
    expect(listed.some((o) => o.id === created.id)).toBe(true);

    const picked = await updateOrderFulfillment(created.id, "picked_up");
    expect(picked?.fulfillmentStatus).toBe("picked_up");

    const again = await updateOrderFulfillment(created.id, "missed_pickup");
    expect(again).toBeNull();
  });
});
