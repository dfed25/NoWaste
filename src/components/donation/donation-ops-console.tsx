"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [claimError, setClaimError] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const candidates = useMemo(
    () => autoFlagUnsoldListingsNearingClose(listings, new Date(nowTick)),
    [nowTick],
  );

  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  function handleConvert() {
    setQueue(candidates.map(convertToDonationReadyItem));
  }

  function handleClaim(itemId: string, partnerId: string) {
    setClaimError(null);
    const currentItem = queue.find((item) => item.id === itemId);
    if (!currentItem) return;

    const claimed = claimDonation(currentItem, partnerId);
    if (!claimed.ok) {
      setClaimError(claimed.reason);
      return;
    }

    setQueue((prev) => prev.map((item) => (item.id === itemId ? claimed.item : item)));
  }

  function handlePickup(itemId: string) {
    setClaimError(null);
    setQueue((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const next = markDonationPickedUp(item);
        if (next.status === item.status) {
          setClaimError("Donation must be claimed before pickup can be marked.");
        }
        return next;
      }),
    );
  }

  function handleComplete(itemId: string) {
    setClaimError(null);
    setQueue((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const next = markDonationCompleted(item);
        if (next.status === item.status) {
          setClaimError("Donation must be picked up before completion can be logged.");
        }
        return next;
      }),
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
                  <Badge variant="brand">{item.status.replaceAll("_", " ")}</Badge>
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
                      disabled={item.status !== "donation_ready"}
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
        {claimError ? (
          <p className="text-xs text-red-600" role="alert" aria-live="polite" aria-atomic="true">
            {claimError}
          </p>
        ) : null}
      </Card>
    </div>
  );
}

