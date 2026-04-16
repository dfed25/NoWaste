import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ReservationCheckoutForm } from "@/components/checkout/reservation-checkout-form";
import { getListingByIdFromStore } from "@/lib/marketplace-store";

type CheckoutPageProps = {
  params: Promise<{ listingId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  const { listingId } = await params;
  const query = await searchParams;
  const cancelled =
    query.cancelled === "1" ||
    query.cancelled === "true" ||
    (Array.isArray(query.cancelled) &&
      (query.cancelled.includes("1") || query.cancelled.includes("true")));

  const listing = await getListingByIdFromStore(listingId);
  if (!listing) notFound();

  const isSoldOut = listing.quantityRemaining < 1;

  return (
    <section className="mx-auto max-w-lg space-y-6">
      {cancelled ? (
        <Card className="border-amber-200 bg-amber-50 text-amber-900">
          <p className="text-sm">
            Checkout was canceled. No charge was made. You can review your details and try again.
          </p>
        </Card>
      ) : null}

      <Card
        variant="elevated"
        className="space-y-1 border-neutral-200/80 bg-gradient-to-br from-white to-brand-100/35"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Checkout</p>
        <h1 className="text-title-lg">Reserve & pay</h1>
        <p className="text-body-sm text-neutral-600">
          Confirm your pickup details, then pay securely in the app.
        </p>
      </Card>

      {isSoldOut ? (
        <Card className="space-y-3 border-red-200 bg-red-50 text-red-900">
          <div>
            <p className="text-sm font-medium">This listing is sold out.</p>
            <p className="mt-1 text-sm text-red-800/90">
              <span className="font-medium">{listing.title}</span>
              <span className="text-red-800/80"> · {listing.restaurantName}</span>
            </p>
          </div>
          <p className="text-sm">Browse other listings and reserve another pickup.</p>
          <Link
            href="/"
            className="inline-flex h-9 w-fit items-center justify-center rounded-xl bg-neutral-900 px-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2"
          >
            Back to marketplace
          </Link>
        </Card>
      ) : (
        <ReservationCheckoutForm
          listingId={listing.id}
          listingTitle={listing.title}
          restaurantName={listing.restaurantName}
          unitPriceCents={listing.priceCents}
          pickupWindowStart={listing.pickupWindowStart}
          pickupWindowEnd={listing.pickupWindowEnd}
          quantityAvailable={listing.quantityRemaining}
        />
      )}
    </section>
  );
}
