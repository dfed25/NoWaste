import { Card } from "@/components/ui/card";
import { getAdminTables } from "@/lib/admin-reporting";

export default function AdminRestaurantsPage() {
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

