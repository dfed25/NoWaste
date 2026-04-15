"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/states/error-state";
import { StripeEmbeddedCheckout } from "@/components/checkout/stripe-embedded-checkout";

type Props = {
  canceled?: string;
};

export function StripeSampleClient({ canceled }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/checkout_sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({}),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        clientSecret?: string;
        checkoutUrl?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not start checkout");
      }

      if (payload.clientSecret) {
        setClientSecret(payload.clientSecret);
        return;
      }

      if (payload.checkoutUrl) {
        window.location.assign(payload.checkoutUrl);
        return;
      }

      throw new Error("Unexpected checkout response");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  if (clientSecret) {
    return (
      <div className="space-y-4">
        <Card className="border-neutral-200/80 p-4">
          <h2 className="text-title-md">Payment</h2>
          <p className="text-body-sm text-neutral-600">Complete payment in the app.</p>
        </Card>
        <Card className="border-neutral-200/80 p-4 sm:p-5">
          <StripeEmbeddedCheckout
            key={clientSecret}
            clientSecret={clientSecret}
            onBack={() => setClientSecret(null)}
            backLabel="Back"
          />
        </Card>
      </div>
    );
  }

  return (
    <>
      {canceled ? (
        <p className="text-sm text-amber-800">
          Checkout was canceled. You can try again whenever you&apos;re ready.
        </p>
      ) : null}

      {error ? <ErrorState message={error} /> : null}

      <Card className="border-brand-100 bg-gradient-to-br from-brand-50/60 to-white p-5 shadow-sm">
        <Button type="button" className="w-full" disabled={loading} onClick={() => void startCheckout()}>
          {loading ? "Starting…" : "Checkout"}
        </Button>
      </Card>

      <p className="text-center text-xs text-neutral-500">
        <Link href="/checkout/preview" className="font-medium text-brand-700 hover:underline">
          Order preview (email &amp; quantity)
        </Link>
        {" · "}
        <Link href="/" className="font-medium text-brand-700 hover:underline">
          Home
        </Link>
      </p>
    </>
  );
}
