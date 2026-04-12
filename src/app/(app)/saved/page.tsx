import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SavedListingsPanel } from "@/components/marketplace/saved-listings-panel";
import type { ListingItem } from "@/lib/marketplace";
import { listAllListings } from "@/lib/marketplace-store";

export default async function SavedListingsPage() {
  let listings: ListingItem[] | undefined;
  try {
    listings = await listAllListings();
  } catch (error) {
    console.error("Saved page: failed to preload listings", error);
    listings = undefined;
  }

  return (
    <section className="space-y-5">
      <Card className="space-y-3 border-neutral-200/80 bg-gradient-to-br from-white via-white to-brand-100/25">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand">Saved picks</Badge>
              <Badge variant="neutral">Quick reserve</Badge>
            </div>
            <h1 className="mt-2 text-title-lg">Your saved listings</h1>
            <p className="text-body-sm text-neutral-600">
              Keep your shortlist organized so you can reserve faster when pickup windows open.
            </p>
          </div>
          <Link
            href="/listings"
            className="inline-flex h-9 items-center justify-center rounded-xl bg-neutral-100 px-3 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-200"
          >
            Browse more listings
          </Link>
        </div>
      </Card>

      <SavedListingsPanel initialListings={listings} />
    </section>
  );
}
