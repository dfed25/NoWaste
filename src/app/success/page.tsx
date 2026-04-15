import Link from "next/link";
import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe";
import { Card } from "@/components/ui/card";

type PageProps = {
  searchParams: Promise<{ session_id?: string | string[] }>;
};

export default async function SuccessPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const raw = sp.session_id;
  const session_id = Array.isArray(raw) ? raw[0] : raw;

  if (!session_id?.trim()) {
    throw new Error("Please provide a valid session_id (`cs_test_...`)");
  }

  const session = await stripe.checkout.sessions.retrieve(session_id.trim(), {
    expand: ["line_items", "payment_intent"],
  });

  if (session.status === "open") {
    redirect("/");
  }

  if (session.status === "complete") {
    const customerEmail = session.customer_details?.email ?? "you";

    return (
      <section
        id="success"
        className="mx-auto max-w-lg space-y-4 px-4 py-10 text-center sm:text-left"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">NoWaste</p>
        <h1 className="text-title-lg text-neutral-900">Thank you!</h1>
        <Card className="border-brand-100 bg-gradient-to-br from-brand-50/90 to-white p-5 text-body-sm text-neutral-700 shadow-sm">
          <p>
            We appreciate your support for less food waste. A confirmation will be sent to{" "}
            <strong className="text-neutral-900">{customerEmail}</strong>. Questions? Email{" "}
            <a
              href="mailto:orders@nowaste.app"
              className="font-medium text-brand-800 underline decoration-brand-300 underline-offset-2 hover:text-brand-900"
            >
              orders@nowaste.app
            </a>
            .
          </p>
          <p className="mt-3 text-xs text-neutral-500">
            We only fulfill reservations after payment succeeds — you&apos;re all set for this
            session.
          </p>
        </Card>
        <p className="pt-2">
          <Link
            href="/"
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            Return to marketplace
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-lg px-4 py-10 text-body-sm text-neutral-600">
      <p>
        We couldn&apos;t confirm this checkout (status: <code>{session.status}</code>).{" "}
        <Link href="/checkout/preview" className="font-medium text-brand-700 hover:underline">
          Try again from order preview
        </Link>
        .
      </p>
    </section>
  );
}
