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
});

