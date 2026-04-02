import { describe, expect, it } from "vitest";
import { reserveListingQuantity } from "@/lib/marketplace";
import { makeListing } from "@/test/factories";

describe("reservation flow", () => {
  it("reserves quantity when enough inventory exists", () => {
    const listing = makeListing({ quantityRemaining: 4 });
    const result = reserveListingQuantity(listing, 2);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.updated.quantityRemaining).toBe(2);
    }
  });

  it("fails when quantity exceeds inventory", () => {
    const listing = makeListing({ quantityRemaining: 1 });
    const result = reserveListingQuantity(listing, 2);
    expect(result.ok).toBe(false);
  });

  it("fails when quantity is less than 1", () => {
    const listing = makeListing({ quantityRemaining: 3 });
    const zeroQuantity = reserveListingQuantity(listing, 0);
    const negativeQuantity = reserveListingQuantity(listing, -1);

    expect(zeroQuantity.ok).toBe(false);
    expect(negativeQuantity.ok).toBe(false);

    if (!zeroQuantity.ok) {
      expect(zeroQuantity.reason).toBe("Quantity must be at least 1.");
    }
    if (!negativeQuantity.ok) {
      expect(negativeQuantity.reason).toBe("Quantity must be at least 1.");
    }
  });
});

