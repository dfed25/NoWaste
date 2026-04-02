import { CreateListingForm } from "@/components/listings/create-listing-form";

export default function NewListingPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-title-lg">Create surplus listing</h1>
        <p className="text-body-sm text-neutral-600">
          Publish tonight&apos;s surplus with validation, pricing, notes, and
          donation fallback controls.
        </p>
      </div>
      <CreateListingForm />
    </section>
  );
}

