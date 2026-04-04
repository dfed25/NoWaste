"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

type AppRole = "customer" | "restaurant_staff" | "admin" | null;

function donationQueueUrl(role: AppRole, restaurantId: string) {
  const base = "/api/donation/queue";
  if (role === "admin" && restaurantId) {
    return `${base}?restaurantId=${encodeURIComponent(restaurantId)}`;
  }
  return base;
}

async function putDonationQueueWithRetry(
  url: string,
  queue: DonationReadyItem[],
  maxAttempts: number,
): Promise<{ ok: true } | { ok: false; message: string }> {
  let lastMessage = "Save failed";
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queue }),
      });
      if (response.ok) {
        return { ok: true };
      }
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      lastMessage = payload.error || `Save failed (${response.status})`;
      const transient = response.status === 502 || response.status === 503 || response.status === 504;
      if (transient && attempt < maxAttempts - 1) {
        await new Promise((r) => window.setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      return { ok: false, message: lastMessage };
    } catch {
      lastMessage = "Network error saving queue";
      if (attempt < maxAttempts - 1) {
        await new Promise((r) => window.setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      return { ok: false, message: lastMessage };
    }
  }
  return { ok: false, message: lastMessage };
}

export function DonationOpsConsole() {
  const [listings, setListings] = useState<ManagedListing[]>([]);
  const [listingsError, setListingsError] = useState<string | null>(null);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [sessionRole, setSessionRole] = useState<AppRole | undefined>(undefined);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [queue, setQueue] = useState<DonationReadyItem[]>([]);
  const [queueHydrated, setQueueHydrated] = useState(false);
  const skipNextPersist = useRef(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [queueSaveError, setQueueSaveError] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session-summary", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { role?: string | null } | null) => {
        if (cancelled || !payload) return;
        const r = payload.role;
        if (r === "customer" || r === "restaurant_staff" || r === "admin") {
          setSessionRole(r);
        } else {
          setSessionRole(null);
        }
      })
      .catch(() => {
        if (!cancelled) setSessionRole(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const restaurantIds = useMemo(() => {
    const ids = [...new Set(listings.map((l) => l.restaurantId))].sort();
    return ids;
  }, [listings]);

  useEffect(() => {
    if (!listings.length || sessionRole === undefined || sessionRole === null) return;
    if (sessionRole === "restaurant_staff") {
      setSelectedRestaurantId(listings[0]!.restaurantId);
      return;
    }
    if (sessionRole === "admin") {
      setSelectedRestaurantId((prev) => {
        if (prev && restaurantIds.includes(prev)) return prev;
        return restaurantIds[0] ?? "";
      });
    }
  }, [listings, restaurantIds, sessionRole]);

  const activeListingItems = useMemo(() => {
    if (!selectedRestaurantId) return [];
    return listings.filter(
      (l) => l.status === "active" && l.restaurantId === selectedRestaurantId,
    ) as ListingItem[];
  }, [listings, selectedRestaurantId]);

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

  const loadQueue = useCallback(async () => {
    if (sessionRole === undefined) return;
    if (!selectedRestaurantId) {
      skipNextPersist.current = true;
      setQueue([]);
      setQueueHydrated(true);
      return;
    }
    try {
      const url = donationQueueUrl(sessionRole, selectedRestaurantId);
      const response = await fetch(url, { credentials: "include" });
      const payload = (await response.json().catch(() => ({}))) as {
        queue?: DonationReadyItem[];
        error?: string;
      };
      if (!response.ok) {
        setQueueSaveError(payload.error || "Could not load donation queue.");
        setQueueHydrated(true);
        return;
      }
      setQueueSaveError(null);
      skipNextPersist.current = true;
      setQueue(Array.isArray(payload.queue) ? payload.queue : []);
      setQueueHydrated(true);
    } catch {
      setQueueSaveError("Network error loading donation queue.");
      setQueueHydrated(true);
    }
  }, [selectedRestaurantId, sessionRole]);

  useEffect(() => {
    if (listingsLoading || listingsError) return;
    if (sessionRole === undefined) return;
    void loadQueue();
  }, [listingsLoading, listingsError, loadQueue, sessionRole, selectedRestaurantId]);

  useEffect(() => {
    if (!queueHydrated) return;
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    if (!selectedRestaurantId || sessionRole === undefined || sessionRole === null) return;

    const timer = window.setTimeout(() => {
      const url = donationQueueUrl(sessionRole, selectedRestaurantId);
      void (async () => {
        const result = await putDonationQueueWithRetry(url, queue, 3);
        if (!result.ok) {
          setQueueSaveError(result.message);
        } else {
          setQueueSaveError(null);
        }
      })();
    }, 450);
    return () => window.clearTimeout(timer);
  }, [queue, queueHydrated, selectedRestaurantId, sessionRole]);

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
      {sessionRole === "admin" && restaurantIds.length > 0 ? (
        <Card className="space-y-2 p-4">
          <label className="flex flex-col gap-1 text-sm text-neutral-800">
            <span className="font-medium">Restaurant scope</span>
            <select
              className="h-11 rounded-xl border border-neutral-300 px-3 text-sm"
              value={selectedRestaurantId}
              onChange={(e) => {
                skipNextPersist.current = true;
                setSelectedRestaurantId(e.target.value);
                setQueueHydrated(false);
              }}
            >
              {restaurantIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
            <span className="text-xs text-neutral-500">
              Queue load/save uses this id. Add ?restaurantId= on APIs for admins.
            </span>
          </label>
        </Card>
      ) : null}
      {queueSaveError ? (
        <p className="text-sm text-red-600" role="alert">
          {queueSaveError}
        </p>
      ) : null}
      <Card className="space-y-2">
        <h2 className="text-title-md">Donation fallback triggers</h2>
        <p className="text-body-sm text-neutral-600">
          Unsold listings near close are flagged and converted to donation-ready.
        </p>
        <p className="text-xs text-neutral-500">Candidates: {candidates.length}</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleConvert} disabled={!selectedRestaurantId}>
            Convert unsold to donation-ready
          </Button>
          <Button type="button" variant="secondary" onClick={() => void loadListings()}>
            Refresh listings
          </Button>
          <Button type="button" variant="secondary" onClick={() => void loadQueue()}>
            Reload saved queue
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
