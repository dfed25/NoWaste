import { RestaurantApplicationsAdmin } from "@/components/admin/restaurant-applications-admin";
import { getAdminTables } from "@/lib/admin-reporting";
import { requireAdminPageAccess } from "@/lib/admin-guard";
import { Card } from "@/components/ui/card";

export default async function AdminRestaurantsPage() {
  await requireAdminPageAccess("/admin/restaurants");

  const { restaurants } = getAdminTables();
  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-title-lg">Restaurant partners</h1>
        <p className="text-body-sm text-neutral-600">
          Review new applications, then cross-check the static seed table used for demos.
        </p>
      </div>

      <RestaurantApplicationsAdmin />

      <div className="space-y-3">
        <h2 className="text-title-md text-neutral-900">Seed marketplace restaurants</h2>
        <Card className="space-y-2 p-5">
          {restaurants.map((restaurant) => (
            <p key={restaurant.id} className="text-sm text-neutral-700">
              {restaurant.id} — {restaurant.name} — {restaurant.address}
            </p>
          ))}
        </Card>
      </div>
    </section>
  );
}
