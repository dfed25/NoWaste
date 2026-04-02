"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/states/empty-state";
import { filterListings, listings } from "@/lib/marketplace";

export function MarketplaceFeed() {
  const [keyword, setKeyword] = useState("");
  const [maxDistanceMiles, setMaxDistanceMiles] = useState<number | "">("");
  const [pickupPart, setPickupPart] = useState<"any" | "afternoon" | "evening" | "night">("any");
  const [dietary, setDietary] = useState<"any" | "vegan" | "vegetarian" | "gluten_free" | "dairy_free">("any");
  const [maxPriceCents, setMaxPriceCents] = useState<number | "">("");

  const filtered = useMemo(
    () =>
      filterListings(listings, {
        keyword: keyword || undefined,
        maxDistanceMiles: maxDistanceMiles === "" ? undefined : maxDistanceMiles,
        pickupPart,
        dietary,
        maxPriceCents: maxPriceCents === "" ? undefined : maxPriceCents,
      }),
    [dietary, keyword, maxDistanceMiles, maxPriceCents, pickupPart],
  );

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <h2 className="text-title-md">Find nearby surplus</h2>
        <Input
          label="Search by keyword"
          placeholder="Search meals, bakery, restaurant..."
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-neutral-800">Nearby restaurants filter (miles)</span>
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
            <span className="font-medium text-neutral-800">Pickup time filter</span>
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
            <span className="font-medium text-neutral-800">Dietary filter</span>
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
            <span className="font-medium text-neutral-800">Price filter (max cents)</span>
            <input
              type="number"
              className="h-11 rounded-xl border border-neutral-300 bg-white px-3 text-sm"
              placeholder="Any"
              value={maxPriceCents}
              onChange={(event) =>
                setMaxPriceCents(
                  event.target.value === "" ? "" : Number(event.target.value),
                )
              }
            />
          </label>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          title="No listings match these filters"
          description="Try broadening distance, time, or dietary options."
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((listing) => (
            <Card key={listing.id} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-neutral-900">{listing.title}</h3>
                <p className="text-sm font-semibold text-neutral-800">
                  ${(listing.priceCents / 100).toFixed(2)}
                </p>
              </div>
              <p className="text-sm text-neutral-600">{listing.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {listing.dietary.map((tag) => (
                  <Badge key={tag} variant="neutral">
                    {tag.replace("_", " ")}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-neutral-500">
                {listing.restaurantName} · {listing.distanceMiles} mi · Pickup{" "}
                {new Date(listing.pickupWindowStart).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
              <div className="flex gap-2">
                <Link href={`/listings/${listing.id}`}>
                  <Button size="sm">View listing</Button>
                </Link>
                <Link href={`/restaurants/${listing.restaurantId}`}>
                  <Button size="sm" variant="secondary">
                    Restaurant details
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

