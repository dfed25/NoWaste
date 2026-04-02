import { cookies } from "next/headers";
import { OrdersManager } from "@/components/orders/orders-manager";
import { getCustomerIdCookieName, parseSignedCustomerId } from "@/lib/customer-id-cookie";
import { getOrdersForCustomer } from "@/lib/order-store";

export default async function OrdersPage() {
  const cookieStore = await cookies();
  const rawCustomerCookie = cookieStore.get(getCustomerIdCookieName())?.value;
  const currentUserId = parseSignedCustomerId(rawCustomerCookie);
  const orders = await getOrdersForCustomer(currentUserId);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-title-lg">Customer orders</h1>
        <p className="text-body-sm text-neutral-600">
          Reservation history, cancellation rules, and refund status.
        </p>
      </div>

      <OrdersManager orders={orders} />
    </section>
  );
}
