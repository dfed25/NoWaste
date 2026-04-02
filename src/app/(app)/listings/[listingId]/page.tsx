import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getListingById } from "@/lib/marketplace";

type ListingDetailPageProps = {
  params: Promise<{ listingId: string }>;
};

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { listingId } = await params;
  const listing = getListingById(listingId);
  if (!listing) notFound();

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-title-lg">{listing.title}</h1>
        <p className="text-body-sm text-neutral-600">{listing.restaurantName}</p>
      </div>

      <Card className="space-y-3">
        <p className="text-sm text-neutral-700">{listing.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {listing.dietary.map((tag) => (
            <Badge key={tag} variant="neutral">
              {tag.replace("_", " ")}
            </Badge>
          ))}
        </div>
        <p className="text-sm text-neutral-700">
          Price: <strong>${(listing.priceCents / 100).toFixed(2)}</strong>
        </p>
        <p className="text-sm text-neutral-700">
          Pickup window:{" "}
          <strong>
            {new Date(listing.pickupWindowStart).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}{" "}
            -{" "}
            {new Date(listing.pickupWindowEnd).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}
          </strong>
        </p>
        {listing.allergyNotes ? (
          <p className="text-sm text-neutral-700">Allergy notes: {listing.allergyNotes}</p>
        ) : null}
        <div className="flex gap-2">
          <Link href={`/checkout/${listing.id}`}>
            <Button>Reserve & checkout</Button>
          </Link>
          <Link href={`/restaurants/${listing.restaurantId}`}>
            <Button variant="secondary">Restaurant details</Button>
          </Link>
        </div>
      </Card>
    </section>
  );
}

