import { RestaurantOnboardingForm } from "@/components/onboarding/restaurant-onboarding-form";

type PageProps = {
  searchParams: Promise<{ restaurantId?: string }>;
};

export default async function RestaurantOnboardingPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const adminRestaurantId = sp.restaurantId?.trim() || undefined;

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-title-lg">Restaurant onboarding</h1>
        <p className="text-body-sm text-neutral-600">
          Complete profile, geo fields, hours, contact, and donation preferences. Drafts are saved per
          restaurant location and persist on this server.
        </p>
        {adminRestaurantId ? (
          <p className="mt-2 text-xs text-neutral-500">
            Admin: editing draft for restaurant <code className="rounded bg-neutral-100 px-1">{adminRestaurantId}</code>
            . Staff accounts use their scoped location automatically.
          </p>
        ) : (
          <p className="mt-2 text-xs text-neutral-500">
            Admins: add <code className="rounded bg-neutral-100 px-1">?restaurantId=…</code> to the URL to
            load and save a specific location.
          </p>
        )}
      </div>
      <RestaurantOnboardingForm adminRestaurantId={adminRestaurantId} />
    </section>
  );
}
