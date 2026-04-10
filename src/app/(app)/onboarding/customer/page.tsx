import { CustomerOnboardingForm } from "@/components/onboarding/customer-onboarding-form";

export default function CustomerOnboardingPage() {
  return (
    <section className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="text-title-lg text-neutral-900">Complete your profile</h1>
        <p className="mt-1 text-body-sm text-neutral-600">
          Add your name and phone so reservations and checkout can use your account details automatically.
        </p>
      </div>
      <CustomerOnboardingForm />
    </section>
  );
}
