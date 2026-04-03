import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_ROLE_COOKIE } from "@/lib/admin";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookies";
import { restaurants } from "@/lib/marketplace";
import { RestaurantReservationsPanel } from "@/components/reservations/restaurant-reservations-panel";

export default async function RestaurantReservationsPage() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get(AUTH_COOKIE_NAME)?.value === "1";
  const role = cookieStore.get(ADMIN_ROLE_COOKIE)?.value;
  if (!isAuthenticated) {
    redirect("/auth/login?next=/reservations");
  }
  if (role !== "restaurant_staff" && role !== "admin") {
    redirect("/dashboard");
  }

  const restaurantChoices = restaurants.map((r) => ({ id: r.id, name: r.name }));

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-emerald-50/40 p-6 shadow-sm md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-200/30 blur-3xl" />
        <div className="relative space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">Restaurant</p>
          <h1 className="text-title-lg text-neutral-900">Reservations and pickup</h1>
          <p className="max-w-2xl text-body-sm text-neutral-600">
            Live queue from customer checkouts: verify codes, mark pickups complete, or record no-shows. Staff
            see their scoped location; admins can switch restaurants.
          </p>
        </div>
      </div>

      <RestaurantReservationsPanel restaurantChoices={restaurantChoices} />
    </section>
  );
}
