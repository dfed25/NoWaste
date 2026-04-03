import { beforeEach, describe, expect, it } from "vitest";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { cancelOrder, createReservedOrder, listOrdersForCustomer } from "@/lib/order-store";

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
    const created = await createReservedOrder({
      customerId: "cust_2",
      listingId: "l2",
      listingTitle: "Cancel Listing",
      quantity: 1,
      totalCents: 700,
      pickupWindowStart: "2026-04-02T20:00:00.000Z",
      pickupWindowEnd: "2026-04-02T21:00:00.000Z",
      paymentStatus: "paid",
    });

    const canceled = await cancelOrder(created.id, "cust_2");
    expect(canceled?.fulfillmentStatus).toBe("expired");
    expect(canceled?.paymentStatus).toBe("refunded");
  });
});
