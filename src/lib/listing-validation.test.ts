import { describe, expect, it } from "vitest";
import { listingSchema } from "@/lib/validation";

describe("listing creation validation", () => {
  it("accepts valid listing input", () => {
    const result = listingSchema.safeParse({
      title: "Surplus wraps",
      description: "Fresh wraps from lunch service.",
      allergyNotes: "Contains gluten.",
      quantityTotal: 5,
      discountedPriceCents: 899,
      pickupWindowStart: "2026-04-02T19:00",
      pickupWindowEnd: "2026-04-02T20:00",
      reservationCutoffAt: "2026-04-02T18:30",
      donationFallbackEnabled: true,
      listingType: "consumer",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid pickup window order", () => {
    const result = listingSchema.safeParse({
      title: "Bad window",
      description: "This should fail validation due to wrong times.",
      quantityTotal: 2,
      discountedPriceCents: 500,
      pickupWindowStart: "2026-04-02T20:00",
      pickupWindowEnd: "2026-04-02T19:00",
      reservationCutoffAt: "2026-04-02T18:30",
      donationFallbackEnabled: false,
      listingType: "consumer",
    });
    expect(result.success).toBe(false);
  });
});

