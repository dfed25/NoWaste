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

  return (
    <section className="space-y-4">
      {cancelled ? (
        <Card className="border-amber-200 bg-amber-50 text-amber-900">
          <p className="text-sm">
            Checkout was canceled. No charge was made. You can review your details and try again.
          </p>
        </Card>
      ) : null}
      <div>
        <h1 className="text-title-lg">Checkout</h1>
        <p className="text-body-sm text-neutral-600">
          Reserve your pickup and complete payment.
        </p>
      </div>
      <Card className="space-y-1">
        <h2 className="text-title-md">{listing.title}</h2>
        <p className="text-sm text-neutral-600">{listing.restaurantName}</p>
        <p className="text-sm text-neutral-700">
          Unit price: ${(listing.priceCents / 100).toFixed(2)}
        </p>
        <p className="text-xs text-neutral-500">{listing.quantityRemaining} available</p>
      </Card>
      <ReservationCheckoutForm
        listingId={listing.id}
        listingTitle={listing.title}
        unitPriceCents={listing.priceCents}
      />
    </section>
  );
}
