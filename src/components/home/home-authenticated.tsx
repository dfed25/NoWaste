import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MarketplaceFeed } from "@/components/marketplace/marketplace-feed";
import { SavedListingsPanel } from "@/components/marketplace/saved-listings-panel";
import type { ListingItem } from "@/lib/marketplace";
import { SHARED_HOME_STEPS } from "@/components/home/home-steps";

type HomeAuthenticatedProps = {
  listings: ListingItem[];
};

export function HomeAuthenticated({ listings }: HomeAuthenticatedProps) {
  return (
    <section className="space-y-6 pb-8">
      <Card
        variant="elevated"
        className="space-y-5 border-neutral-200/80 bg-gradient-to-br from-white via-white to-brand-100/25"
      >
        <div className="space-y-2">
          <Badge variant="brand">Surplus marketplace</Badge>
          <h1 className="max-w-2xl text-title-xl text-neutral-900">
            Rescue great food before it goes to waste.
          </h1>
          <p className="max-w-xl text-body-md text-neutral-600">
            Browse nearby surplus meals, reserve in seconds, and pick up during each restaurant&apos;s
            window.
          </p>
        </div>

        <ol className="grid gap-3 sm:grid-cols-3">
          {SHARED_HOME_STEPS.map((row) => (
            <li
              key={row.step}
              className="rounded-xl border border-neutral-200/90 bg-white/80 px-4 py-3 text-sm"
            >
              <span className="text-xs font-semibold text-brand-700">{row.step}</span>
              <p className="mt-1 font-semibold text-neutral-900">{row.title}</p>
              <p className="mt-0.5 text-xs text-neutral-600">{row.desc}</p>
            </li>
          ))}
        </ol>

        <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600">
          <Link href="/saved" className="font-medium text-brand-700 underline-offset-4 hover:underline">
            Saved picks
          </Link>
          <Link href="/orders" className="font-medium text-brand-700 underline-offset-4 hover:underline">
            My orders
          </Link>
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card id="browse" className="scroll-mt-24 space-y-3 border-neutral-200/80 lg:col-span-2">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-title-md text-neutral-900">Nearby surplus</h2>
              <p className="text-sm text-neutral-600">Search and filter listings below.</p>
            </div>
            <Link
              href="/dashboard"
              className="shrink-0 text-sm font-medium text-brand-700 underline-offset-4 hover:underline"
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
