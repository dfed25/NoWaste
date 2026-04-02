import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MarketplaceFeed } from "@/components/marketplace/marketplace-feed";

export default function Home() {
  return (
    <section className="space-y-6 pb-8">
      <Card variant="elevated" className="space-y-5 border-neutral-200/80 bg-gradient-to-br from-white via-white to-brand-100/30">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="brand">Live marketplace</Badge>
            <Badge variant="neutral">Mobile-first</Badge>
          </div>
          <h1 className="text-title-xl text-neutral-900">Rescue great food before it goes to waste.</h1>
          <p className="max-w-2xl text-body-md text-neutral-600">
            Browse discounted surplus meals nearby, reserve in seconds, and pick up during restaurant-defined windows.
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

        <div className="flex flex-wrap gap-2">
          <Link
            href="/listings"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            Explore listings
          </Link>
          <Link
            href="/listings/new"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-neutral-100 px-4 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-200"
          >
            Create listing
          </Link>
        </div>
      </Card>

      <Card className="space-y-3 border-neutral-200/80">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-title-md">Nearby surplus picks</h2>
          <Link href="/dashboard" className="text-sm font-medium text-brand-700 hover:underline">
            Restaurant dashboard
          </Link>
        </div>
        <MarketplaceFeed />
      </Card>
    </section>
  );
}
