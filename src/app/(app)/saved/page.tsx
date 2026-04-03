import { SavedListingsPanel } from "@/components/marketplace/saved-listings-panel";

export default function SavedListingsPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-title-lg">Saved listings</h1>
        <p className="text-body-sm text-neutral-600">
          Your personal shortlist for faster checkout.
        </p>
      </div>

      <SavedListingsPanel />
    </section>
  );
}
