"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Capacitor } from "@capacitor/core";
import {
  reservationCheckoutSchema,
  type ReservationCheckoutInput,
} from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/states/error-state";
import { useToast } from "@/components/feedback/toast-provider";
import { useAuth } from "@/components/auth/auth-provider";
import type { AccountSettingsInput } from "@/lib/validation";
import { StripeEmbeddedCheckout } from "@/components/checkout/stripe-embedded-checkout";

type Props = {
  listingId: string;
  listingTitle: string;
  unitPriceCents: number;
};

type ReservationFormValues = ReservationCheckoutInput;

export function ReservationCheckoutForm({
  listingId,
  listingTitle,
  unitPriceCents,
}: Props) {
  const isNativeApp = Capacitor.isNativePlatform();
  const router = useRouter();
  const { pushToast } = useToast();
  const { user } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [embeddedClientSecret, setEmbeddedClientSecret] = useState<string | null>(null);
  const [embeddedPublishableKey, setEmbeddedPublishableKey] = useState<string | null>(null);
  const [checkoutOrderId, setCheckoutOrderId] = useState<string | null>(null);
  const [stripeLinkInForm, setStripeLinkInForm] = useState(false);
  const [linkToggleLoading, setLinkToggleLoading] = useState(false);
  /** Tracks which Supabase user (or guest) we last prefilled for so account switches re-run prefill. */
  const prefilledForUserKey = useRef<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationCheckoutSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      quantity: 1,
    },
  });

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const response = await fetch("/api/account/me", {
          credentials: "include",
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          profile?: AccountSettingsInput;
        };
        if (!mounted || !response.ok || !payload.profile) return;

        const userKey = user?.id ?? "guest";
        if (prefilledForUserKey.current === userKey) return;

        const p = payload.profile;
        const v = getValues();
        const name =
          (v.name?.trim() && v.name) ||
          p.displayName?.trim() ||
          (typeof user?.user_metadata?.display_name === "string"
            ? user.user_metadata.display_name
            : "") ||
          "";
        const email =
          (v.email?.trim() && v.email) ||
          (p.email?.trim() || "").trim() ||
          (user?.email ?? "").trim();
        const phone = (v.phone?.trim() && v.phone) || p.phone?.trim() || "";
        const quantity = v.quantity && v.quantity > 0 ? v.quantity : 1;

        reset(
          {
            name,
            email,
            phone,
            quantity,
          },
          { keepDefaultValues: true },
        );
        prefilledForUserKey.current = userKey;
      } catch {
        /* keep empty defaults */
      }
    }

    void loadProfile();
    return () => {
      mounted = false;
    };
  }, [getValues, reset, user?.email, user?.id, user?.user_metadata?.display_name]);

  const quantity = Math.max(1, Number(watch("quantity")) || 1);
  const totalCents = unitPriceCents * quantity;

  async function startCheckoutSession(
    values: ReservationFormValues,
    options: { showStripeLink: boolean; reuseOrderId: string | null },
  ) {
    const response = await fetch("/api/checkout/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-no-hosted-checkout": isNativeApp ? "1" : "0",
      },
      body: JSON.stringify({
        listingId,
        listingTitle,
        quantity: values.quantity,
        unitPriceCents,
        customer: {
          name: values.name,
          email: values.email,
          phone: values.phone,
        },
        ...(options.reuseOrderId ? { orderId: options.reuseOrderId } : {}),
        showStripeLink: options.showStripeLink,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      throw new Error(payload.error || "Checkout failed");
    }

    const payload = (await response.json()) as {
      clientSecret?: string;
      publishableKey?: string;
      checkoutUrl?: string;
      confirmationUrl?: string;
      orderId?: string;
    };

    if (payload.clientSecret) {
      setEmbeddedClientSecret(payload.clientSecret);
      setEmbeddedPublishableKey(payload.publishableKey?.trim() || null);
      if (payload.orderId) {
        setCheckoutOrderId(payload.orderId);
      }
      setStripeLinkInForm(options.showStripeLink);
      return;
    }

    if (payload.checkoutUrl) {
      if (isNativeApp) {
        throw new Error(
          "In-app checkout is required, but server returned hosted Stripe Checkout. Set STRIPE_PUBLISHABLE_KEY or NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY on the Next server and restart.",
        );
      }
      window.location.assign(payload.checkoutUrl);
      return;
    }

    if (payload.confirmationUrl) {
      pushToast({
        tone: "success",
        title: "Reservation confirmed",
        description: "Stripe fallback mode used (local/dev).",
      });
      router.push(payload.confirmationUrl);
      router.refresh();
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      setSubmitError(null);
      setCheckoutOrderId(null);
      setStripeLinkInForm(false);
      await startCheckoutSession(values, { showStripeLink: false, reuseOrderId: null });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to start checkout";
      setSubmitError(message);
    }
  });

  async function handleShowStripeLinkOption() {
    if (!checkoutOrderId) return;
    setSubmitError(null);
    setLinkToggleLoading(true);
    try {
      await startCheckoutSession(getValues(), {
        showStripeLink: true,
        reuseOrderId: checkoutOrderId,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update payment options";
      setSubmitError(message);
    } finally {
      setLinkToggleLoading(false);
    }
  }

  if (embeddedClientSecret) {
    return (
      <div className="space-y-4">
        <Card className="space-y-2 border-neutral-200/80">
          <h2 className="text-title-md">Payment</h2>
          <p className="text-body-sm text-neutral-600">
            Pay with <strong>Apple Pay</strong> or your <strong>card</strong> in the secure form below (Apple Pay appears
            automatically when your device supports it). You stay in NoWaste—no Safari handoff when embedded checkout is
            enabled.
          </p>
        </Card>
        {checkoutOrderId && !stripeLinkInForm ? (
          <Card className="space-y-3 border-neutral-200/80 bg-neutral-50/60">
            <p className="text-body-sm text-neutral-700">
              Card and Apple Pay are shown first. If you want Stripe&apos;s saved-checkout option, expand the section
              below.
            </p>
            <details className="text-body-sm text-neutral-600">
              <summary className="cursor-pointer font-medium text-neutral-900">
                Save my details for faster checkout next time (Stripe Link)
              </summary>
              <p className="mt-2">
                <strong>Link</strong> is Stripe&apos;s optional wallet: it can remember your email and payment info
                across participating sites so you don&apos;t re-enter a card every time. You don&apos;t need it to
                complete this order.
              </p>
              <Button
                type="button"
                variant="secondary"
                className="mt-3"
                disabled={linkToggleLoading}
                onClick={() => void handleShowStripeLinkOption()}
              >
                {linkToggleLoading ? "Updating payment form…" : "Show Link in the payment form"}
              </Button>
            </details>
          </Card>
        ) : null}
        {stripeLinkInForm ? (
          <p className="text-body-sm text-neutral-600">
            Stripe Link is now included below as an optional payment method.
          </p>
        ) : null}
        <Card className="border-neutral-200/80 p-4 sm:p-5">
          <StripeEmbeddedCheckout
            key={embeddedClientSecret}
            clientSecret={embeddedClientSecret}
            publishableKey={embeddedPublishableKey ?? undefined}
            onBack={() => {
              setEmbeddedClientSecret(null);
              setEmbeddedPublishableKey(null);
              setCheckoutOrderId(null);
              setStripeLinkInForm(false);
            }}
          />
        </Card>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {submitError ? <ErrorState message={submitError} /> : null}
      <Card className="space-y-3">
        <h2 className="text-title-md">Reservation</h2>
        <Input label="Name" error={errors.name?.message} {...register("name")} />
        <Input label="Phone" type="tel" error={errors.phone?.message} {...register("phone")} />
        <Input
          label="Email"
          type="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Quantity"
          type="number"
          min={1}
          error={errors.quantity?.message}
          {...register("quantity", { valueAsNumber: true })}
        />
        <p className="text-sm text-neutral-700">
          Total: <strong>${(totalCents / 100).toFixed(2)}</strong>
        </p>
      </Card>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Starting checkout..." : "Continue to payment"}
      </Button>
    </form>
  );
}
