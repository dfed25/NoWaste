import Link from "next/link";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { canCancelOrder, qualifiesForRefund } from "@/lib/marketplace";
import { getOrdersForCustomer } from "@/lib/order-store";
import { CancelReservationButton } from "@/components/orders/cancel-reservation-button";

export default async function OrdersPage() {
  const cookieStore = await cookies();
  const currentUserId = cookieStore.get("nw-user-id")?.value;
  const orders = await getOrdersForCustomer(currentUserId);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-title-lg">Customer orders</h1>
        <p className="text-body-sm text-neutral-600">
          Reservation history, cancellation rules, and refund status.
        </p>
      </div>

      {orders.length === 0 ? (
        <Card className="space-y-2">
          <p className="text-sm font-medium text-neutral-800">No orders yet.</p>
          <p className="text-sm text-neutral-600">Place a reservation to see it here.</p>
        </Card>
      ) : null}

      <div className="space-y-3">
        {orders.map((order) => {
          const canCancel = canCancelOrder(order);
          const refundEligible = qualifiesForRefund(order);
          return (
            <Card key={order.id} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-neutral-900">{order.listingTitle}</h2>
                <Badge variant={refundEligible ? "warning" : "neutral"}>
                  {order.fulfillmentStatus.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-xs text-neutral-600">
                Order ID: {order.id} · Qty {order.quantity} · Total ${
                  (order.totalCents / 100).toFixed(2)
                }
              </p>
              <p className="text-xs text-neutral-600">Payment status: {order.paymentStatus}</p>
              <p className="text-xs text-neutral-600">
                Pickup:{" "}
                {new Date(order.pickupWindowStart).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}{" "}
                -{" "}
                {new Date(order.pickupWindowEnd).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href={`/orders/confirmation?orderId=${encodeURIComponent(order.id)}`}>
                  <Button size="sm">View pickup code</Button>
                </Link>
                <CancelReservationButton orderId={order.id} disabled={!canCancel} />
                <Badge variant={refundEligible ? "success" : "neutral"}>
                  Refund {refundEligible ? "eligible" : "not eligible"}
                </Badge>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
