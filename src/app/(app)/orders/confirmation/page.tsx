import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generatePickupCode } from "@/lib/marketplace";

type ConfirmationPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrderConfirmationPage({
  searchParams,
}: ConfirmationPageProps) {
  const params = await searchParams;
  const listingId = typeof params.listingId === "string" ? params.listingId : "unknown";
  const quantity = Number(typeof params.quantity === "string" ? params.quantity : "1");
  const sessionId = typeof params.session_id === "string" ? params.session_id : "";

  const reservationCode = generatePickupCode(
    sessionId ? sessionId.slice(0, 10) : `${listingId}-${quantity}`,
  );

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-title-lg">Order confirmation</h1>
        <p className="text-body-sm text-neutral-600">
          Your reservation is confirmed after successful payment.
        </p>
      </div>

      <Card className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="success">Confirmed</Badge>
          <p className="text-sm text-neutral-700">
            Listing: <span className="font-medium">{listingId}</span>
          </p>
        </div>
        <p className="text-sm text-neutral-700">
          Quantity reserved: <span className="font-medium">{quantity}</span>
        </p>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-title-md">Pickup QR / code</h2>
        <p className="text-sm text-neutral-600">
          Show this at pickup. Restaurant staff finalizes fulfillment status.
        </p>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center">
          <p className="text-xs text-neutral-500">Reservation code</p>
          <p className="mt-1 font-mono text-xl font-bold tracking-wider text-neutral-900">
            {reservationCode}
          </p>
          <div className="mx-auto mt-4 grid h-24 w-24 grid-cols-6 gap-1">
            {Array.from({ length: 36 }).map((_, index) => (
              <div
                // Non-cryptographic visual placeholder for QR-style display.
                key={index}
                className={(index + reservationCode.length) % 3 === 0 ? "bg-neutral-900" : "bg-neutral-100"}
              />
            ))}
          </div>
        </div>
      </Card>
    </section>
  );
}

