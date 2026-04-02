import { describe, expect, it } from "vitest";
import { editListing } from "@/lib/marketplace";
import { makeListing } from "@/test/factories";

describe("listing edit behavior", () => {
  it("updates editable listing fields", () => {
    const listing = makeListing();
    const updated = editListing(listing, {
      title: "Updated title",
      priceCents: 650,
    });

    expect(updated.title).toBe("Updated title");
    expect(updated.priceCents).toBe(650);
    expect(updated.id).toBe(listing.id);
  });
});

