import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ReservationCheckoutForm } from "@/components/checkout/reservation-checkout-form";
import { getListingById } from "@/lib/marketplace";

type CheckoutPageProps = {
  params: Promise<{ listingId: string }>;
};

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { listingId } = await params;
  const listing = getListingById(listingId);
  if (!listing) notFound();

  return (
    <section className="space-y-4">
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
      </Card>
      <ReservationCheckoutForm
        listingId={listing.id}
        listingTitle={listing.title}
        unitPriceCents={listing.priceCents}
      />
    </section>
  );
}

