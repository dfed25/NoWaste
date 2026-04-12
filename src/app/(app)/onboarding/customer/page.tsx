import { CustomerOnboardingForm } from "@/components/onboarding/customer-onboarding-form";

export default function CustomerOnboardingPage() {
  return (
    <section className="mx-auto w-full max-w-xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-title-lg text-neutral-900">Complete your profile</h1>
        <p className="text-body-sm text-neutral-600">
          Add your name, mobile number, and email so pickup reminders, checkout, and reservations stay in
          sync with your account.
        </p>
      </div>
      <CustomerOnboardingForm />
    </section>
  );
}
