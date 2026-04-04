"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ListingItem, ManagedListing } from "@/lib/marketplace";
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
  const [listings, setListings] = useState<ManagedListing[]>([]);
  const [listingsError, setListingsError] = useState<string | null>(null);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [queue, setQueue] = useState<DonationReadyItem[]>([]);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  const activeListingItems = useMemo(
    () => listings.filter((l) => l.status === "active") as ListingItem[],
    [listings],
  );

  const candidates = useMemo(
    () => autoFlagUnsoldListingsNearingClose(activeListingItems, new Date(nowTick)),
    [activeListingItems, nowTick],
  );

  const loadListings = useCallback(async () => {
    setListingsError(null);
    setListingsLoading(true);
    try {
      const response = await fetch("/api/listings", { credentials: "include" });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        listings?: ManagedListing[];
      };
      if (!response.ok) {
        setListingsError(payload.error || "Could not load listings.");
        setListings([]);
        return;
      }
      setListings(Array.isArray(payload.listings) ? payload.listings : []);
    } catch {
      setListingsError("Network error loading listings.");
      setListings([]);
    } finally {
      setListingsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadListings();
  }, [loadListings]);

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
      {listingsError ? (
        <p className="text-sm text-red-600" role="alert">
          {listingsError}
        </p>
      ) : null}
      {listingsLoading ? <p className="text-sm text-neutral-500">Loading live listings…</p> : null}
      <Card className="space-y-2">
        <h2 className="text-title-md">Donation fallback triggers</h2>
        <p className="text-body-sm text-neutral-600">
          Unsold listings near close are flagged and converted to donation-ready.
        </p>
        <p className="text-xs text-neutral-500">Candidates: {candidates.length}</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleConvert}>Convert unsold to donation-ready</Button>
          <Button type="button" variant="secondary" onClick={() => void loadListings()}>
            Refresh listings
          </Button>
        </div>
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

