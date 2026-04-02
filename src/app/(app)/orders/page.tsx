import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOrdersForCustomer, canCancelOrder, qualifiesForRefund } from "@/lib/marketplace";

export default function OrdersPage() {
  const orders = getOrdersForCustomer();

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-title-lg">Customer orders</h1>
        <p className="text-body-sm text-neutral-600">
          Reservation history, cancellation rules, and refund status.
        </p>
      </div>
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
                Order ID: {order.id} · Qty {order.quantity} · Total $
                {(order.totalCents / 100).toFixed(2)}
              </p>
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
                <Link href={`/orders/confirmation?listingId=${order.listingId}&quantity=${order.quantity}`}>
                  <Button size="sm">View pickup code</Button>
                </Link>
                <Button size="sm" variant="secondary" disabled={!canCancel}>
                  {canCancel ? "Cancel reservation" : "Cancellation closed"}
                </Button>
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

