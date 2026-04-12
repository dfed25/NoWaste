import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LocalTime } from "@/components/common/local-time";
import { ListingCardPhotos } from "@/components/marketplace/listing-card-photos";
import { getListingByIdFromStore } from "@/lib/marketplace-store";

type ListingDetailPageProps = {
  params: Promise<{ listingId: string }>;
};

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { listingId } = await params;
  const listing = await getListingByIdFromStore(listingId);
  if (!listing) notFound();

  return (
    <section className="w-full min-w-0 space-y-5">
      <Card
        variant="elevated"
        className="min-w-0 space-y-4 border-neutral-200/80 bg-gradient-to-br from-white to-brand-100/25"
      >
        <ListingCardPhotos imageUrls={listing.imageUrls} title={listing.title} />

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="brand">{listing.quantityRemaining} left</Badge>
            <Badge variant="neutral">{listing.restaurantName}</Badge>
          </div>
          <h1 className="text-title-lg text-neutral-900">{listing.title}</h1>
          <p className="text-body-md text-neutral-600">{listing.description}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="border-neutral-200/80">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Price</p>
            <p className="mt-1 text-base font-semibold text-neutral-900">
              ${(listing.priceCents / 100).toFixed(2)}
            </p>
          </Card>
          <Card className="border-neutral-200/80">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Distance</p>
            <p className="mt-1 text-base font-semibold text-neutral-900">{listing.distanceMiles} miles</p>
          </Card>
          <Card className="border-neutral-200/80">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Pickup</p>
            <p className="mt-1 text-base font-semibold text-neutral-900">
              <LocalTime value={listing.pickupWindowStart} options={{ hour: "numeric", minute: "2-digit" }} />
            </p>
          </Card>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {listing.dietary.length > 0 ? (
            listing.dietary.map((tag) => (
              <Badge key={tag} variant="neutral">
                {tag.replace("_", " ")}
              </Badge>
            ))
          ) : (
            <Badge variant="neutral">chef selection</Badge>
          )}
        </div>

        {listing.allergyNotes ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Allergy notes: {listing.allergyNotes}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/checkout/${listing.id}`}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            Reserve and checkout
          </Link>
          <Link
            href={`/restaurants/${listing.restaurantId}`}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-neutral-100 px-4 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 focus-visible:ring-offset-2"
          >
            Restaurant details
          </Link>
        </div>
      </Card>
    </section>
  );
}
