import { describe, expect, it } from "vitest";
import { expireStaleReservations } from "@/lib/pickup";
import { makeOrder } from "@/test/factories";

describe("expiration job behavior", () => {
  it("expires stale reserved orders", () => {
    const orders = [
      makeOrder({
        id: "ord_old",
        pickupWindowEnd: "2020-01-01T00:00:00.000Z",
        fulfillmentStatus: "reserved",
      }),
    ];
    const result = expireStaleReservations(orders, new Date("2026-04-02T23:00:00.000Z"));
    expect(result[0]?.fulfillmentStatus).toBe("expired");
  });
});

