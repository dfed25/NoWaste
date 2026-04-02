import { DonationOpsConsole } from "@/components/donation/donation-ops-console";

export default function DonationWorkflowPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-title-lg">Donation fallback workflow</h1>
        <p className="text-body-sm text-neutral-600">
          Auto-flag, convert, notify, claim, pickup, and completion.
        </p>
      </div>
      <DonationOpsConsole />
    </section>
  );
}

