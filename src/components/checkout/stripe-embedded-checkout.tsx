"use client";

import { useEffect, useRef, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";

type EmbeddedInstance = Awaited<ReturnType<Stripe["createEmbeddedCheckoutPage"]>>;

type Props = {
  clientSecret: string;
  onBack: () => void;
};

export function StripeEmbeddedCheckout({ clientSecret, onBack }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const checkoutRef = useRef<EmbeddedInstance | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  useEffect(() => {
    if (!publishableKey?.trim() || !mountRef.current) return;

    let cancelled = false;

    (async () => {
      const stripe = await loadStripe(publishableKey);
      if (!stripe || cancelled || !mountRef.current) return;

      const checkout = await stripe.createEmbeddedCheckoutPage({ clientSecret });
      if (cancelled) {
        checkout.destroy();
        return;
      }

      checkoutRef.current = checkout;
      checkout.mount(mountRef.current);
    })().catch((err: unknown) => {
      if (cancelled) return;
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load payment form. Please try again.";
      setInitError(message);
    });

    return () => {
      cancelled = true;
      checkoutRef.current?.destroy();
      checkoutRef.current = null;
    };
  }, [clientSecret, publishableKey, retryNonce]);

  if (!publishableKey?.trim()) {
    return (
      <p className="text-sm text-red-700">
        Payment UI is not configured. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to the environment.
      </p>
    );
  }

  if (initError) {
    return (
      <div className="space-y-3 rounded-xl border border-red-200 bg-red-50/80 px-3 py-3">
        <p className="text-sm text-red-800">{initError}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setInitError(null);
              setRetryNonce((n) => n + 1);
            }}
          >
            Try again
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onBack}>
            Back to reservation details
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        ref={mountRef}
        className="min-h-[24rem] w-full overflow-hidden rounded-xl border border-neutral-200 bg-white"
      />
      <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={onBack}>
        Back to reservation details
      </Button>
    </div>
  );
}
