"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/states/error-state";
import { StripeEmbeddedCheckout } from "@/components/checkout/stripe-embedded-checkout";

type Props = {
  label: string;
  unitLabel: string;
};

export function CheckoutPreviewClient({ label, unitLabel }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const customer_email = String(fd.get("customer_email") ?? "").trim();
    const quantity = Math.max(1, Math.min(99, Number(fd.get("quantity")) || 1));

    try {
      const response = await fetch("/api/checkout_sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ customer_email, quantity }),
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
        <Card className="space-y-2 border-neutral-200/80 p-4">
          <h2 className="text-title-md">Payment</h2>
          <p className="text-body-sm text-neutral-600">
            Pay below without leaving the NoWaste app. After payment you&apos;ll see the confirmation
            screen here.
          </p>
        </Card>
        <Card className="border-neutral-200/80 p-4 sm:p-5">
          <StripeEmbeddedCheckout
            key={clientSecret}
            clientSecret={clientSecret}
            onBack={() => setClientSecret(null)}
            backLabel="Back to order preview"
          />
        </Card>
      </div>
    );
  }

  return (
    <>
      <Card className="space-y-4 border-brand-100 bg-gradient-to-br from-brand-50/80 to-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-neutral-200/80 pb-3">
          <div>
            <p className="text-sm font-medium text-neutral-900">{label}</p>
            <p className="text-xs text-neutral-500">Surplus pickup — one-time payment</p>
          </div>
          <p className="text-sm font-semibold text-brand-800">{unitLabel}</p>
        </div>

        {error ? <ErrorState message={error} /> : null}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="quantity" className="text-sm font-medium text-neutral-800">
              Quantity
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min={1}
              max={99}
              defaultValue={1}
              required
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="customer_email" className="text-sm font-medium text-neutral-800">
              Email for receipt
            </label>
            <input
              id="customer_email"
              name="customer_email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Starting checkout…" : "Continue to secure checkout"}
          </Button>
        </form>
      </Card>

      <p className="text-center text-xs text-neutral-500">
        <Link href="/" className="font-medium text-brand-700 hover:underline">
          Back to marketplace
        </Link>
      </p>
    </>
  );
}
