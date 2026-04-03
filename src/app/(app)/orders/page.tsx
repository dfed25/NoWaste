import { OrdersCenter } from "@/components/orders/orders-center";

export default function OrdersPage() {
  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-title-lg">Customer orders</h1>
        <p className="text-body-sm text-neutral-600">
          Reservation history, cancellations, and pickup readiness in one unified view.
        </p>
      </div>
      <OrdersCenter />
    </section>
  );
}

