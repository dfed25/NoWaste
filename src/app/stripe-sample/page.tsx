import { StripeSampleClient } from "@/components/checkout/stripe-sample-client";

type PageProps = {
  searchParams: Promise<{ canceled?: string | string[] }>;
};

/**
 * Stripe sample-style entry (single Checkout control), with in-app embedded payment when
 * NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set.
 */
export default async function StripeSamplePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const canceledRaw = sp.canceled;
  const canceled = Array.isArray(canceledRaw) ? canceledRaw[0] : canceledRaw;

  if (canceled) {
    console.log("Order canceled — continue to shop and checkout when you’re ready.");
  }

  return (
    <section className="mx-auto max-w-md space-y-6 px-4 py-10">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">NoWaste</p>
        <h1 className="text-title-lg text-neutral-900">Stripe sample checkout</h1>
        <p className="text-body-sm text-neutral-600">
          Uses <code className="rounded bg-neutral-100 px-1 text-xs">POST /api/checkout_sessions</code>{" "}
          with in-app Checkout when <code className="rounded bg-neutral-100 px-1 text-xs">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>{" "}
          is set. Set <code className="rounded bg-neutral-100 px-1 text-xs">STRIPE_CHECKOUT_PRICE_ID</code>.
        </p>
      </div>

      <StripeSampleClient canceled={canceled} />
    </section>
  );
}
