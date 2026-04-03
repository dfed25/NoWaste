import { Card } from "@/components/ui/card";
import { getAdminTables } from "@/lib/admin-reporting";
import { requireAdminPageAccess } from "@/lib/admin-guard";

export default async function AdminOrdersPage() {
  await requireAdminPageAccess();

  const { orders } = getAdminTables();
  return (
    <section className="space-y-4">
      <h1 className="text-title-lg">Orders table</h1>
      <Card className="space-y-2">
        {orders.map((order) => (
          <p key={order.id} className="text-sm text-neutral-700">
            {order.id} - {order.listingTitle} - {order.fulfillmentStatus}
          </p>
        ))}
      </Card>
    </section>
  );
}
