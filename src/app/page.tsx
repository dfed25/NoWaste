import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MarketplaceFeed } from "@/components/marketplace/marketplace-feed";
import { SavedListingsPanel } from "@/components/marketplace/saved-listings-panel";
import { listAllListings } from "@/lib/marketplace-store";

export default async function Home() {
  const listings = await listAllListings();

  return (
    <section className="space-y-6 pb-8">
      <Card
        variant="elevated"
        className="space-y-6 border-neutral-200/80 bg-gradient-to-br from-white via-white to-brand-100/30"
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="brand">Live marketplace</Badge>
            <Badge variant="neutral">Mobile-first</Badge>
            <Badge variant="success">Fast checkout</Badge>
          </div>
          <h1 className="max-w-3xl text-title-xl text-neutral-900">
            Rescue great food before it goes to waste.
          </h1>
          <p className="max-w-2xl text-body-md text-neutral-600">
            Browse discounted surplus meals nearby, reserve in seconds, save your favorite picks, and pick up during restaurant-defined windows.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="border-neutral-200/80">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Goal</p>
            <p className="mt-1 text-lg font-semibold text-neutral-900">Waste reduction</p>
          </Card>
          <Card className="border-neutral-200/80">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Customer value</p>
            <p className="mt-1 text-lg font-semibold text-neutral-900">Affordable meals</p>
          </Card>
          <Card className="border-neutral-200/80">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Restaurant value</p>
            <p className="mt-1 text-lg font-semibold text-neutral-900">Recovered revenue</p>
          </Card>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Card className="border-neutral-200/80">
            <p className="text-xs uppercase tracking-wide text-neutral-500">1</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">Browse local listings</p>
            <p className="mt-1 text-xs text-neutral-600">Filter by distance, diet, pickup time, and price.</p>
          </Card>
          <Card className="border-neutral-200/80">
            <p className="text-xs uppercase tracking-wide text-neutral-500">2</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">Reserve instantly</p>
            <p className="mt-1 text-xs text-neutral-600">Complete checkout and get a pickup confirmation code.</p>
          </Card>
          <Card className="border-neutral-200/80">
            <p className="text-xs uppercase tracking-wide text-neutral-500">3</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">Pick up on time</p>
            <p className="mt-1 text-xs text-neutral-600">Show your code and collect your rescued meal.</p>
          </Card>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/listings"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            Explore listings
          </Link>
          <Link
            href="/saved"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-neutral-100 px-4 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
          >
            Saved picks
          </Link>
          <Link
            href="/orders"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-neutral-100 px-4 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
          >
            My orders
          </Link>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="space-y-3 border-neutral-200/80 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-title-md">Nearby surplus picks</h2>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-brand-700 underline-offset-4 hover:underline"
            >
              Restaurant dashboard
            </Link>
          </div>
          <MarketplaceFeed initialListings={listings} />
        </Card>

        <Card className="space-y-3 border-neutral-200/80">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-title-md">Saved for later</h2>
            <Link href="/saved" className="text-sm font-medium text-brand-700 hover:underline">
              Open saved
            </Link>
          </div>
          <SavedListingsPanel compact initialListings={listings} />
        </Card>
      </div>
    </section>
  );
}
