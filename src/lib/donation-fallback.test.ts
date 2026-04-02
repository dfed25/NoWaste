import { describe, expect, it } from "vitest";
import {
  claimDonation,
  convertToDonationReadyItem,
  markDonationCompleted,
  markDonationPickedUp,
} from "@/lib/donation";
import { makeListing } from "@/test/factories";

describe("donation fallback flow", () => {
  it("converts listing to donation-ready", () => {
    const listing = makeListing({ id: "l_don", quantityRemaining: 2 });
    const item = convertToDonationReadyItem(listing);
    expect(item.status).toBe("donation_ready");
    expect(item.quantity).toBe(2);
  });

  it("prevents double claim conflicts", () => {
    const item = convertToDonationReadyItem(makeListing({ id: "l_claim", quantityRemaining: 1 }));
    const first = claimDonation(item, "dp1");
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const second = claimDonation(first.item, "dp2");
    expect(second.ok).toBe(false);
  });

  it("supports picked-up then completed transitions", () => {
    const item = convertToDonationReadyItem(makeListing({ id: "l_done" }));
    const claimed = claimDonation(item, "dp1");
    if (!claimed.ok) throw new Error("Expected claim success");
    const picked = markDonationPickedUp(claimed.item);
    const done = markDonationCompleted(picked);
    expect(done.status).toBe("completed");
  });
});

