"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states/empty-state";
import type { ListingItem } from "@/lib/marketplace";
import { filterListings, listings as fallbackListings } from "@/lib/marketplace";
import {
  notifySavedListingsChanged,
  readSavedListingIdsFromStorage,
  writeSavedListingIdsToStorage,
} from "@/lib/saved-listings";

type SortBy = "recommended" | "price_low" | "price_high" | "distance" | "pickup_soon";

type AccountDefaultsResponse = {
  profile?: {
    dietaryPreferences?: Array<"vegan" | "vegetarian" | "gluten_free" | "dairy_free">;
    defaultMaxDistanceMiles?: number;
  };
};

type MarketplaceFeedProps = {
  initialListings?: ListingItem[];
};

export function MarketplaceFeed({ initialListings }: MarketplaceFeedProps) {
  const [keyword, setKeyword] = useState("");
  const [maxDistanceMiles, setMaxDistanceMiles] = useState<number | "">("");
  const [pickupPart, setPickupPart] = useState<"any" | "afternoon" | "evening" | "night">("any");
  const [dietary, setDietary] = useState<"any" | "vegan" | "vegetarian" | "gluten_free" | "dairy_free">("any");
  const [maxPriceCents, setMaxPriceCents] = useState<number | "">("");
  const [sortBy, setSortBy] = useState<SortBy>("recommended");
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [savedOnly, setSavedOnly] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const didRestoreSaved = useRef(false);
  const didEmitSavedChangeAfterHydration = useRef(false);
  const didApplyAccountDefaults = useRef(false);
  const [sourceListings, setSourceListings] = useState<ListingItem[]>(
    initialListings ?? fallbackListings,
  );
  const [isLoading, setIsLoading] = useState(initialListings === undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);

  useEffect(() => {
    if (initialListings !== undefined) {
      setSourceListings(initialListings);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

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
  }, [initialListings]);


  useEffect(() => {
    if (didApplyAccountDefaults.current) return;

    let mounted = true;

    async function applyAccountDefaults() {
      try {
        const response = await fetch("/api/account/me", { cache: "no-store" });
        if (!response.ok) return;

        const payload = (await response.json()) as AccountDefaultsResponse;
        const profile = payload.profile;
        if (!mounted || !profile) return;

        if (
          maxDistanceMiles === "" &&
          typeof profile.defaultMaxDistanceMiles === "number" &&
          profile.defaultMaxDistanceMiles > 0
        ) {
          setMaxDistanceMiles(profile.defaultMaxDistanceMiles);
        }

        if (
          dietary === "any" &&
          Array.isArray(profile.dietaryPreferences) &&
          profile.dietaryPreferences.length > 0
        ) {
          setDietary(profile.dietaryPreferences[0]);
        }
      } catch {
        // Best-effort defaults only.
      } finally {
        didApplyAccountDefaults.current = true;
      }
    }

    void applyAccountDefaults();
    return () => {
      mounted = false;
    };
  }, [dietary, maxDistanceMiles]);

  useEffect(() => {
    try {
      setSavedIds(readSavedListingIdsFromStorage(window.localStorage));
      didRestoreSaved.current = true;
    } catch {
      // Ignore local parsing issues and start clean.
      didRestoreSaved.current = true;
    }
  }, []);

  useEffect(() => {
    if (!didRestoreSaved.current) return;
    if (!didEmitSavedChangeAfterHydration.current) {
      didEmitSavedChangeAfterHydration.current = true;
      return;
    }

    writeSavedListingIdsToStorage(window.localStorage, savedIds);
    notifySavedListingsChanged();
  }, [savedIds]);

  const savedSet = useMemo(() => new Set(savedIds), [savedIds]);

  const filtered = useMemo(() => {
    let next = filterListings(sourceListings, {
      keyword: keyword || undefined,
      maxDistanceMiles: maxDistanceMiles === "" ? undefined : maxDistanceMiles,
      pickupPart,
      dietary,
      maxPriceCents: maxPriceCents === "" ? undefined : maxPriceCents,
    });

    if (onlyAvailable) {
      next = next.filter((listing) => listing.quantityRemaining > 0);
    }

    if (savedOnly) {
      next = next.filter((listing) => savedSet.has(listing.id));
    }

    const sorted = [...next];
    sorted.sort((a, b) => {
      if (sortBy === "price_low") return a.priceCents - b.priceCents;
      if (sortBy === "price_high") return b.priceCents - a.priceCents;
      if (sortBy === "distance") return a.distanceMiles - b.distanceMiles;
      if (sortBy === "pickup_soon") {
        return new Date(a.pickupWindowStart).getTime() - new Date(b.pickupWindowStart).getTime();
      }

      const aSaved = savedSet.has(a.id) ? 1 : 0;
      const bSaved = savedSet.has(b.id) ? 1 : 0;
      if (aSaved !== bSaved) return bSaved - aSaved;
      return a.distanceMiles - b.distanceMiles;
    });

    return sorted;
  }, [
    dietary,
    keyword,
    maxDistanceMiles,
    maxPriceCents,
    onlyAvailable,
    pickupPart,
    savedOnly,
    savedSet,
    sortBy,
    sourceListings,
  ]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (keyword.trim().length > 0) count += 1;
    if (maxDistanceMiles !== "") count += 1;
    if (pickupPart !== "any") count += 1;
    if (dietary !== "any") count += 1;
    if (maxPriceCents !== "") count += 1;
    if (!onlyAvailable) count += 1;
    if (savedOnly) count += 1;
    if (sortBy !== "recommended") count += 1;
    return count;
  }, [dietary, keyword, maxDistanceMiles, maxPriceCents, onlyAvailable, pickupPart, savedOnly, sortBy]);

  const advancedFilterCount = useMemo(() => {
    let count = 0;
    if (maxDistanceMiles !== "") count += 1;
    if (pickupPart !== "any") count += 1;
    if (dietary !== "any") count += 1;
    if (maxPriceCents !== "") count += 1;
    if (!onlyAvailable) count += 1;
    if (savedOnly) count += 1;
    return count;
  }, [dietary, maxDistanceMiles, maxPriceCents, onlyAvailable, pickupPart, savedOnly]);

  const stats = useMemo(() => {
    if (filtered.length === 0) {
      return { count: 0, avgPriceCents: 0, nearestMiles: null as number | null };
    }

    const totalPrice = filtered.reduce((sum, listing) => sum + listing.priceCents, 0);
    const nearest = filtered.reduce((min, listing) => Math.min(min, listing.distanceMiles), Number.POSITIVE_INFINITY);
    return {
      count: filtered.length,
      avgPriceCents: Math.round(totalPrice / filtered.length),
      nearestMiles: Number.isFinite(nearest) ? nearest : null,
    };
  }, [filtered]);

  function toggleSaved(listingId: string) {
    setSavedIds((previous) => {
      if (previous.includes(listingId)) {
        return previous.filter((id) => id !== listingId);
      }
      return [...previous, listingId];
    });
  }

  function resetFilters() {
    setKeyword("");
    setMaxDistanceMiles("");
    setPickupPart("any");
    setDietary("any");
    setMaxPriceCents("");
    setSortBy("recommended");
    setOnlyAvailable(true);
    setSavedOnly(false);
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-4 border-neutral-200/80 bg-gradient-to-br from-white to-brand-100/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-title-md">Find nearby surplus</h2>
            <p className="text-sm text-neutral-600">Search and sort; open more filters when you need them.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">{activeFilterCount} active</Badge>
            <Badge variant="brand">{savedIds.length} saved</Badge>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            label="Search by keyword"
            placeholder="Meals, bakery, neighborhood..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-neutral-800">Sort</span>
            <select
              className="h-11 rounded-xl border border-neutral-300 bg-white px-3 text-sm"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortBy)}
            >
              <option value="recommended">Recommended</option>
              <option value="pickup_soon">Pickup soonest</option>
              <option value="distance">Nearest first</option>
              <option value="price_low">Price low to high</option>
              <option value="price_high">Price high to low</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setAdvancedFiltersOpen((o) => !o)}
            aria-expanded={advancedFiltersOpen}
          >
            {advancedFiltersOpen ? "Hide" : "More"} filters
            {advancedFilterCount > 0 && !advancedFiltersOpen ? ` (${advancedFilterCount})` : null}
          </Button>
        </div>

        {advancedFiltersOpen ? (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-neutral-800">Nearby (miles)</span>
                <input
                  type="number"
                  min={0}
                  className="h-11 rounded-xl border border-neutral-300 bg-white px-3 text-sm"
                  placeholder="Any"
                  value={maxDistanceMiles}
                  onChange={(event) => {
                    const value = event.target.value;
                    setMaxDistanceMiles(value === "" ? "" : Math.max(0, Number(value)));
                  }}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-neutral-800">Pickup time</span>
                <select
                  className="h-11 rounded-xl border border-neutral-300 bg-white px-3 text-sm"
                  value={pickupPart}
                  onChange={(event) =>
                    setPickupPart(event.target.value as "any" | "afternoon" | "evening" | "night")
                  }
                >
                  <option value="any">Any</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                  <option value="night">Night</option>
                </select>
              </label>

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
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-neutral-800">Max price (USD)</span>
                <input
                  type="number"
                  min={0}
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
                    setMaxPriceCents(Number.isFinite(numeric) ? Math.round(Math.max(0, numeric) * 100) : "");
                  }}
                />
              </label>

              <label className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-800">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(event) => setOnlyAvailable(event.target.checked)}
                />
                Only available now
              </label>

              <label className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-800">
                <input
                  type="checkbox"
                  checked={savedOnly}
                  onChange={(event) => setSavedOnly(event.target.checked)}
                />
                Saved picks only
              </label>
            </div>
          </>
        ) : null}
      </Card>

      <div className="rounded-xl border border-neutral-200/80 bg-white/90 px-4 py-2.5 text-sm text-neutral-700">
        <span className="font-semibold text-neutral-900">{stats.count}</span>
        <span className="text-neutral-500"> results</span>
        <span className="mx-2 text-neutral-300" aria-hidden>
          ·
        </span>
        {stats.count > 0 ? (
          <>
            <span className="text-neutral-500">Avg </span>
            <span className="font-medium text-neutral-900">${(stats.avgPriceCents / 100).toFixed(2)}</span>
          </>
        ) : (
          <span className="text-neutral-500">Avg —</span>
        )}
        <span className="mx-2 text-neutral-300" aria-hidden>
          ·
        </span>
        <span className="text-neutral-500">Closest </span>
        <span className="font-medium text-neutral-900">
          {stats.nearestMiles === null ? "—" : `${stats.nearestMiles.toFixed(1)} mi`}
        </span>
      </div>

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
          {filtered.map((listing) => {
            const isSaved = savedSet.has(listing.id);
            const soldOut = listing.quantityRemaining <= 0;

            return (
              <Card
                key={listing.id}
                className="space-y-3 border-neutral-200/80 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
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
                        {tag.replaceAll("_", " ")}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="neutral">chef selection</Badge>
                  )}
                  <Badge variant={soldOut ? "danger" : "brand"}>
                    {soldOut ? "Sold out" : `${listing.quantityRemaining} left`}
                  </Badge>
                  {isSaved ? <Badge variant="success">Saved</Badge> : null}
                </div>

                <p className="text-xs text-neutral-500">
                  {listing.restaurantName} · {listing.distanceMiles.toFixed(1)} mi · Pickup{" "}
                  {new Date(listing.pickupWindowStart).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    aria-label={isSaved ? `Unsave listing ${listing.title}` : `Save listing ${listing.title}`}
                    onClick={() => toggleSaved(listing.id)}
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-neutral-100 px-3 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
                  >
                    {isSaved ? "Unsave" : "Save"}
                  </button>
                  {soldOut ? (
                    <span className="inline-flex h-9 items-center justify-center rounded-xl bg-neutral-200 px-3 text-sm font-medium text-neutral-500">
                      Checkout unavailable
                    </span>
                  ) : (
                    <Link
                      href={`/checkout/${listing.id}`}
                      className="inline-flex h-9 items-center justify-center rounded-xl bg-brand-600 px-3 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                    >
                      Quick reserve
                    </Link>
                  )}
                  <Link
                    href={`/listings/${listing.id}`}
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-white px-3 text-sm font-medium text-neutral-900 ring-1 ring-neutral-300 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
                  >
                    View listing
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
