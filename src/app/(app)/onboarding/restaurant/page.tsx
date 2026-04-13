import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { RestaurantOnboardingShell } from "@/components/onboarding/restaurant-onboarding-shell";
import { verifyServerSession } from "@/lib/server-session";

type PageProps = {
  searchParams: Promise<{ restaurantId?: string }>;
};

export default async function RestaurantOnboardingPage({ searchParams }: PageProps) {
  const headerList = await headers();
  const cookie = headerList.get("cookie") ?? "";
  const session = verifyServerSession(new Request("http://localhost", { headers: { cookie } }));

  if (!session.isAuthenticated) {
    const next = encodeURIComponent("/onboarding/restaurant");
    redirect(`/auth/login?next=${next}&role=restaurant`);
  }

  const role = session.user?.role;
  const scopedId = session.user?.scopedRestaurantId;

  if (role === "customer") {
    redirect("/get-started?notice=restaurant-only");
  }

  const sp = await searchParams;
  const adminRestaurantId = sp.restaurantId?.trim() || undefined;

  if (role === "admin") {
    return (
      <section>
        <RestaurantOnboardingShell variant="admin" adminRestaurantId={adminRestaurantId} />
      </section>
    );
  }

  if (role !== "restaurant_staff") {
    redirect("/");
  }

  return (
    <section>
      <RestaurantOnboardingShell
        variant="staff"
        hasRestaurantScope={Boolean(scopedId)}
        scopedRestaurantId={scopedId}
      />
    </section>
  );
}
