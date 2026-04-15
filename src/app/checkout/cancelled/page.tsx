import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function CheckoutCancelledPage() {
  return (
    <section className="mx-auto max-w-lg space-y-4 px-4 py-10 text-center sm:text-left">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">NoWaste</p>
      <h1 className="text-title-lg text-neutral-900">Checkout cancelled</h1>
      <Card className="border-neutral-200/90 bg-white p-5 text-body-sm text-neutral-600 shadow-sm">
        <p>No charge was made. You can adjust your order and try again when you&apos;re ready.</p>
      </Card>
      <Link href="/checkout/preview" className="text-sm font-medium text-brand-700 hover:underline">
        Back to order preview
      </Link>
    </section>
  );
}
