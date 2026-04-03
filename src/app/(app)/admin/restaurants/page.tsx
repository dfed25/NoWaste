import { Card } from "@/components/ui/card";
import { getAdminTables } from "@/lib/admin-reporting";
import { requireAdminPageAccess } from "@/lib/admin-guard";

export default async function AdminRestaurantsPage() {
  await requireAdminPageAccess("/admin/restaurants");

  const { restaurants } = getAdminTables();
  return (
    <section className="space-y-4">
      <h1 className="text-title-lg">Restaurants table</h1>
      <Card className="space-y-2">
        {restaurants.map((restaurant) => (
          <p key={restaurant.id} className="text-sm text-neutral-700">
            {restaurant.id} - {restaurant.name} - {restaurant.address}
          </p>
        ))}
      </Card>
    </section>
  );
}
