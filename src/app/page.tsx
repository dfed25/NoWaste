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
          {[
            { step: "1", title: "Browse", desc: "Listings near you with clear pickup times." },
            { step: "2", title: "Reserve", desc: "Checkout and receive a confirmation code." },
            { step: "3", title: "Pick up", desc: "Show your code during the pickup window." },
          ].map((row) => (
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

        <div className="flex flex-wrap gap-2 pt-1">
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
