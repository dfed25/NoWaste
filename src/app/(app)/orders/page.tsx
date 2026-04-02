import { LoadingState } from "@/components/states/loading-state";

export default function OrdersPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-title-lg">Orders</h1>
        <p className="text-body-sm text-neutral-600">
          Reservation and fulfillment timeline.
        </p>
      </div>
      <LoadingState label="Loading order stream..." />
    </section>
  );
}

