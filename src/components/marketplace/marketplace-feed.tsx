"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states/empty-state";
import type { ListingItem } from "@/lib/marketplace";
import { filterListings, listings as fallbackListings } from "@/lib/marketplace";

export function MarketplaceFeed() {
  const [keyword, setKeyword] = useState("");
  const [maxDistanceMiles, setMaxDistanceMiles] = useState<number | "">("");
  const [pickupPart, setPickupPart] = useState<"any" | "afternoon" | "evening" | "night">("any");
  const [dietary, setDietary] = useState<"any" | "vegan" | "vegetarian" | "gluten_free" | "dairy_free">("any");
  const [maxPriceCents, setMaxPriceCents] = useState<number | "">("");
  const [sourceListings, setSourceListings] = useState<ListingItem[]>(fallbackListings);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadListings() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/listings", { cache: "no-store" });
        const payload = (await response.json()) as {
          listings?: ListingItem[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load listings");
        }

        if (isMounted && Array.isArray(payload.listings)) {
          setSourceListings(payload.listings);
          setLoadError(null);
        }
      } catch (error) {
        if (!isMounted) return;
        setLoadError(error instanceof Error ? error.message : "Failed to load listings");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadListings();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(
    () =>
      filterListings(sourceListings, {
        keyword: keyword || undefined,
        maxDistanceMiles: maxDistanceMiles === "" ? undefined : maxDistanceMiles,
        pickupPart,
        dietary,
        maxPriceCents: maxPriceCents === "" ? undefined : maxPriceCents,
      }),
    [dietary, keyword, maxDistanceMiles, maxPriceCents, pickupPart, sourceListings],
  );

  return (
    <div className="space-y-4">
      <Card className="space-y-4 border-neutral-200/80">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-title-md">Find nearby surplus</h2>
            <p className="text-sm text-neutral-600">Fresh listings from restaurants in your area.</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setKeyword("");
              setMaxDistanceMiles("");
              setPickupPart("any");
              setDietary("any");
              setMaxPriceCents("");
            }}
          >
            Reset filters
          </Button>
        </div>

        <Input
          label="Search by keyword"
          placeholder="Meals, bakery, neighborhood..."
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />

        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-neutral-800">Nearby (miles)</span>
            <input
              type="number"
              className="h-11 rounded-xl border border-neutral-300 bg-white px-3 text-sm"
              placeholder="Any"
              value={maxDistanceMiles}
              onChange={(event) =>
                setMaxDistanceMiles(
                  event.target.value === "" ? "" : Number(event.target.value),
                )
              }
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-neutral-800">Pickup time</span>
            <select
              className="h-11 rounded-xl border border-neutral-300 bg-white px-3 text-sm"
              value={pickupPart}
              onChange={(event) =>
                setPickupPart(
                  event.target.value as "any" | "afternoon" | "evening" | "night",
                )
              }
            >
              <option value="any">Any</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
              <option value="night">Night</option>
            </select>
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-neutral-800">Dietary</span>
            <select
              className="h-11 rounded-xl border border-neutral-300 bg-white px-3 text-sm"
              value={dietary}
              onChange={(event) =>
                setDietary(
                  event.target.value as
                    | "any"
                    | "vegan"
                    | "vegetarian"
                    | "gluten_free"
                    | "dairy_free",
                )
              }
            >
              <option value="any">Any</option>
              <option value="vegan">Vegan</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="gluten_free">Gluten-free</option>
              <option value="dairy_free">Dairy-free</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-neutral-800">Max price (USD)</span>
            <input
              type="number"
              className="h-11 rounded-xl border border-neutral-300 bg-white px-3 text-sm"
              placeholder="Any"
              value={maxPriceCents === "" ? "" : (maxPriceCents / 100).toString()}
              onChange={(event) => {
                const dollars = event.target.value;
                if (dollars === "") {
                  setMaxPriceCents("");
                  return;
                }
                const numeric = Number(dollars);
                setMaxPriceCents(Number.isFinite(numeric) ? Math.round(numeric * 100) : "");
              }}
            />
          </label>
        </div>
      </Card>

      {loadError ? (
        <Card className="border-red-200 bg-red-50 text-red-800">
          <p className="text-sm font-medium">Could not refresh listings from API.</p>
          <p className="mt-1 text-sm">Showing local fallback data. Error: {loadError}</p>
        </Card>
      ) : null}

      {isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="space-y-3 border-neutral-200/80">
              <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-200" />
              <div className="h-3 w-full animate-pulse rounded bg-neutral-100" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-neutral-100" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No listings match these filters"
          description="Try broadening distance, time, or dietary options."
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((listing) => (
            <Card key={listing.id} className="space-y-3 border-neutral-200/80">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-neutral-900">{listing.title}</h3>
                <p className="text-sm font-semibold text-neutral-800">
                  ${(listing.priceCents / 100).toFixed(2)}
                </p>
              </div>

              <p className="text-sm text-neutral-600">{listing.description}</p>

              <div className="flex flex-wrap items-center gap-1.5">
                {listing.dietary.length > 0 ? (
                  listing.dietary.map((tag) => (
                    <Badge key={tag} variant="neutral">
                      {tag.replace("_", " ")}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="neutral">chef selection</Badge>
                )}
                <Badge variant="brand">{listing.quantityRemaining} left</Badge>
              </div>

              <p className="text-xs text-neutral-500">
                {listing.restaurantName} · {listing.distanceMiles} mi · Pickup{" "}
                {new Date(listing.pickupWindowStart).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>

              <div className="flex gap-2">
                <Link
                  href={`/listings/${listing.id}`}
                  className="inline-flex h-9 items-center justify-center rounded-xl bg-brand-600 px-3 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                >
                  View listing
                </Link>
                <Link
                  href={`/restaurants/${listing.restaurantId}`}
                  className="inline-flex h-9 items-center justify-center rounded-xl bg-neutral-100 px-3 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
                >
                  Restaurant
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
