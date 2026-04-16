import Link from "next/link";

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-2xl space-y-6 py-10">
      <div>
        <h1 className="text-title-lg text-neutral-900">Terms of Service (summary)</h1>
        <p className="mt-2 text-body-sm text-neutral-600">
          This is a concise product summary, not legal advice. Replace with counsel-reviewed terms before
          production.
        </p>
      </div>
      <div className="space-y-4 text-sm text-neutral-700">
        <p>
          <strong className="text-neutral-900">Platform role.</strong> NoWaste provides software to connect
          guests with surplus food. We do not prepare, store, or transport food.
        </p>
        <p>
          <strong className="text-neutral-900">Restaurant responsibilities.</strong> Partner restaurants are
          solely responsible for food safety, licensing, allergen disclosure, accurate listings, pricing, and
          donation compliance. You represent that surplus items are fit for consumption and handled in good
          faith.
        </p>
        <p>
          <strong className="text-neutral-900">Donations.</strong> Where donations are offered, you confirm
          applicable Good Samaritan / food-recovery rules are followed and maintain any records your counsel
          requires.
        </p>
        <p>
          <strong className="text-neutral-900">Customer transparency.</strong> Listings should clearly describe
          surplus or prepared food, pickup windows, and final-sale policies where relevant.
        </p>
      </div>
      <p>
        <Link href="/auth/sign-up?role=restaurant_staff" className="text-sm font-medium text-brand-700 underline">
          Back to restaurant signup
        </Link>
      </p>
    </section>
  );
}
