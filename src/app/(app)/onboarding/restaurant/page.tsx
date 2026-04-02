import { RestaurantOnboardingForm } from "@/components/onboarding/restaurant-onboarding-form";

export default function RestaurantOnboardingPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-title-lg">Restaurant onboarding</h1>
        <p className="text-body-sm text-neutral-600">
          Complete profile, geo fields, hours, contact, donation preferences,
          and payment onboarding placeholder.
        </p>
      </div>
      <RestaurantOnboardingForm />
    </section>
  );
}

