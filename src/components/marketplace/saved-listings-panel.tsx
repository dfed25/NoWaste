"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/states/empty-state";
import type { ListingItem } from "@/lib/marketplace";
import {
  notifySavedListingsChanged,
  SAVED_LISTINGS_CHANGED_EVENT,
  SAVED_LISTINGS_KEY,
  readSavedListingIdsFromStorage,
  writeSavedListingIdsToStorage,
} from "@/lib/saved-listings";

type SavedListingsPanelProps = {
  compact?: boolean;
  initialListings?: ListingItem[];
};

export function SavedListingsPanel({ compact = false, initialListings }: SavedListingsPanelProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [listings, setListings] = useState<ListingItem[]>(initialListings ?? []);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function syncSavedIds() {
      setSavedIds(readSavedListingIdsFromStorage(window.localStorage));
    }

    syncSavedIds();
    window.addEventListener(SAVED_LISTINGS_CHANGED_EVENT, syncSavedIds);
    window.addEventListener("storage", syncSavedIds);

    return () => {
      window.removeEventListener(SAVED_LISTINGS_CHANGED_EVENT, syncSavedIds);
      window.removeEventListener("storage", syncSavedIds);
    };
  }, []);

  useEffect(() => {
    if (initialListings && initialListings.length > 0) {
      setListings(initialListings);
      setIsLoading(false);
      return;
    }

    let mounted = true;
    async function load() {
      try {
        const response = await fetch("/api/listings", { cache: "no-store" });
        const payload = (await response.json()) as {
          listings?: ListingItem[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Could not load saved listings");
        }

        if (mounted && Array.isArray(payload.listings)) {
          setListings(payload.listings);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Could not load saved listings");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [initialListings]);

  const savedSet = useMemo(() => new Set(savedIds), [savedIds]);
  const savedListings = useMemo(() => {
    return listings
      .filter((listing) => savedSet.has(listing.id))
      .sort((a, b) => new Date(a.pickupWindowStart).getTime() - new Date(b.pickupWindowStart).getTime());
  }, [listings, savedSet]);

  function unsaveListing(id: string) {
    setSavedIds((previous) => {
      const next = previous.filter((value) => value !== id);
      writeSavedListingIdsToStorage(window.localStorage, next);
      notifySavedListingsChanged();
      return next;
    });
  }

  if (isLoading) {
    return (
      <Card className="space-y-2 border-neutral-200/80">
        <p className="text-sm text-neutral-600">Loading saved picks...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="space-y-2 border-red-200 bg-red-50 text-red-800">
        <p className="text-sm font-medium">Saved listings unavailable.</p>
        <p className="text-sm">{error}</p>
      </Card>
    );
  }

  if (savedListings.length === 0) {
    return (
      <EmptyState
        title="No saved picks yet"
        description="Save listings from the marketplace to build your shortlist."
      />
    );
  }

  const displayed = compact ? savedListings.slice(0, 2) : savedListings;

  return (
    <div className="space-y-3">
      {displayed.map((listing) => {
        const soldOut = listing.quantityRemaining <= 0;
        return (
          <Card key={listing.id} className="space-y-2 border-neutral-200/80">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-neutral-900">{listing.title}</h3>
              <Badge variant={soldOut ? "danger" : "brand"}>
                {soldOut ? "Sold out" : `${listing.quantityRemaining} left`}
              </Badge>
            </div>
            <p className="text-xs text-neutral-600">
              {listing.restaurantName} · ${(listing.priceCents / 100).toFixed(2)} · {listing.distanceMiles.toFixed(1)} mi
            </p>
            <div className="flex flex-wrap gap-2">
              {soldOut ? (
                <span className="inline-flex h-9 items-center justify-center rounded-xl bg-neutral-200 px-3 text-sm font-medium text-neutral-500">
                  Checkout unavailable
                </span>
              ) : (
                <Link
                  href={`/checkout/${listing.id}`}
                  className="inline-flex h-9 items-center justify-center rounded-xl bg-brand-600 px-3 text-sm font-medium text-white transition-colors hover:bg-brand-700"
                >
                  Reserve
                </Link>
              )}
              <Link
                href={`/listings/${listing.id}`}
                className="inline-flex h-9 items-center justify-center rounded-xl bg-neutral-100 px-3 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-200"
              >
                View
              </Link>
              <button
                type="button"
                onClick={() => unsaveListing(listing.id)}
                className="inline-flex h-9 items-center justify-center rounded-xl bg-white px-3 text-sm font-medium text-neutral-700 ring-1 ring-neutral-300 transition-colors hover:bg-neutral-50"
              >
                Unsave
              </button>
            </div>
          </Card>
        );
      })}

      {compact && savedListings.length > displayed.length ? (
        <Link href="/saved" className="text-sm font-medium text-brand-700 hover:underline">
          See all saved listings ({savedListings.length})
        </Link>
      ) : null}

      {!compact ? (
        <p className="text-xs text-neutral-500">Saved locally on this device using `{SAVED_LISTINGS_KEY}`.</p>
      ) : null}
    </div>
  );
}
