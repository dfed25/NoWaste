import { describe, expect, it } from "vitest";
import { markPickedUp, verifyPickupCode } from "@/lib/pickup";
import { makeOrder } from "@/test/factories";

describe("pickup confirmation flow", () => {
  it("verifies pickup code", () => {
    const order = makeOrder();
    expect(verifyPickupCode(order, "NW-TEST-0001")).toBe(true);
    expect(verifyPickupCode(order, "wrong")).toBe(false);
  });

  it("marks reserved order as picked up", () => {
    const order = makeOrder();
    const picked = markPickedUp(order);
    expect(picked.fulfillmentStatus).toBe("picked_up");
  });

  it("throws for invalid terminal transitions", () => {
    const pickedUpOrder = makeOrder({ fulfillmentStatus: "picked_up" });
    expect(() => markPickedUp(pickedUpOrder)).toThrow("Invalid fulfillment transition");
  });
});

