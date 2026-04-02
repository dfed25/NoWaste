import { PickupVerificationConsole } from "@/components/pickup/pickup-verification-console";

export default function PickupVerificationPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-title-lg">Restaurant pickup verification</h1>
        <p className="text-body-sm text-neutral-600">
          Verify reservation QR/code, then mark fulfillment outcomes.
        </p>
      </div>
      <PickupVerificationConsole />
    </section>
  );
}

