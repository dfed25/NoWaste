import { getStripe } from "@/lib/stripe";
import { CheckoutPreviewClient } from "@/components/checkout/checkout-preview-client";

async function getPreviewLine() {
  const priceId = process.env.STRIPE_CHECKOUT_PRICE_ID?.trim();
  if (!priceId || !process.env.STRIPE_SECRET_KEY?.trim()) {
    return {
      label: "NoWaste order",
      unitLabel: "Set STRIPE_CHECKOUT_PRICE_ID to show live pricing.",
    };
  }
  try {
    const stripe = getStripe();
    const price = await stripe.prices.retrieve(priceId);
    const product =
      typeof price.product === "string"
        ? await stripe.products.retrieve(price.product)
        : price.product;
    const name = "name" in product && typeof product.name === "string" ? product.name : "NoWaste order";
    const unitAmount = price.unit_amount;
    const currency = (price.currency ?? "usd").toUpperCase();
    const unitLabel =
      unitAmount != null
        ? new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toLowerCase() }).format(
            unitAmount / 100,
          )
        : "—";
    return { label: name, unitLabel };
  } catch {
    return {
      label: "NoWaste order",
      unitLabel: "Unable to load price — you can still continue to checkout.",
    };
  }
}

export default async function CheckoutPreviewPage() {
  const { label, unitLabel } = await getPreviewLine();

  return (
    <section className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">NoWaste</p>
        <h1 className="text-title-lg text-neutral-900">Review your order</h1>
        <p className="text-body-sm text-neutral-600">
          Double-check quantity and email before paying. With in-app checkout, you stay inside NoWaste
          until you&apos;re done.
        </p>
      </div>

      <CheckoutPreviewClient label={label} unitLabel={unitLabel} />
    </section>
  );
}
