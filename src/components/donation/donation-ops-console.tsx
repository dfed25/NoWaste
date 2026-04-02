"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listings } from "@/lib/marketplace";
import {
  autoFlagUnsoldListingsNearingClose,
  claimDonation,
  convertToDonationReadyItem,
  donationPartners,
  findMatchingPartners,
  markDonationCompleted,
  markDonationPickedUp,
  type DonationReadyItem,
} from "@/lib/donation";

export function DonationOpsConsole() {
  const [queue, setQueue] = useState<DonationReadyItem[]>([]);
  const candidates = useMemo(() => autoFlagUnsoldListingsNearingClose(listings), []);

  function handleConvert() {
    setQueue(candidates.map(convertToDonationReadyItem));
  }

  function handleClaim(itemId: string, partnerId: string) {
    setQueue((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const claimed = claimDonation(item, partnerId);
        return claimed.ok ? claimed.item : item;
      }),
    );
  }

  function handlePickup(itemId: string) {
    setQueue((prev) => prev.map((item) => (item.id === itemId ? markDonationPickedUp(item) : item)));
  }

  function handleComplete(itemId: string) {
    setQueue((prev) =>
      prev.map((item) => (item.id === itemId ? markDonationCompleted(item) : item)),
    );
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h2 className="text-title-md">Donation fallback triggers</h2>
        <p className="text-body-sm text-neutral-600">
          Unsold listings near close are flagged and converted to donation-ready.
        </p>
        <p className="text-xs text-neutral-500">Candidates: {candidates.length}</p>
        <Button onClick={handleConvert}>Convert unsold to donation-ready</Button>
      </Card>

      <Card className="space-y-3">
        <h3 className="text-sm font-semibold text-neutral-900">Donation queue</h3>
        {queue.length === 0 ? (
          <p className="text-xs text-neutral-500">No donation-ready items yet.</p>
        ) : (
          queue.map((item) => {
            const source = listings.find((listing) => listing.id === item.listingId);
            const matches = source
              ? findMatchingPartners(source.distanceMiles, source.pickupWindowStart)
              : donationPartners;

            return (
              <div key={item.id} className="space-y-2 rounded-xl border border-neutral-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-neutral-900">
                    {item.title} (qty {item.quantity})
                  </p>
                  <Badge variant="brand">{item.status.replace("_", " ")}</Badge>
                </div>
                <p className="text-xs text-neutral-500">
                  Matching partners: {matches.map((partner) => partner.name).join(", ") || "None"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {matches.slice(0, 1).map((partner) => (
                    <Button
                      key={partner.id}
                      size="sm"
                      variant="secondary"
                      onClick={() => handleClaim(item.id, partner.id)}
                    >
                      Notify + claim by {partner.name}
                    </Button>
                  ))}
                  <Button size="sm" onClick={() => handlePickup(item.id)} disabled={item.status !== "claimed"}>
                    Mark donation picked up
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleComplete(item.id)}
                    disabled={item.status !== "picked_up"}
                  >
                    Log donation completion
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}

