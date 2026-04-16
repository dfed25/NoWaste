"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  restaurantName: string;
  unitPriceCents: number;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  quantityAvailable: number;
};

type ReservationFormValues = ReservationCheckoutInput;

function formatPickupWindow(startIso: string, endIso: string): string {
  try {
    const start = new Date(startIso);
    const end = new Date(endIso);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return `${startIso} – ${endIso}`;
    }
    const dayPart = start.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const tStart = start.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    const tEnd = end.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${dayPart} · ${tStart} – ${tEnd}`;
  } catch {
    return `${startIso} – ${endIso}`;
  }
}

export function ReservationCheckoutForm({
  listingId,
  listingTitle,
  restaurantName,
  unitPriceCents,
  pickupWindowStart,
  pickupWindowEnd,
  quantityAvailable,
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
  const [linkLearnMoreOpen, setLinkLearnMoreOpen] = useState(false);
  /** Tracks which Supabase user (or guest) we last prefilled for so account switches re-run prefill. */
  const prefilledForUserKey = useRef<string | null>(null);

  const pickupLabel = useMemo(
    () => formatPickupWindow(pickupWindowStart, pickupWindowEnd),
    [pickupWindowStart, pickupWindowEnd],
  );

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
      setLinkLearnMoreOpen(false);
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

  /** New Checkout session with Link hidden again — clears Link/bank sub-flow state inside Stripe’s UI. */
  async function handleCardAndApplePayOnly() {
    if (!checkoutOrderId) return;
    setSubmitError(null);
    setLinkToggleLoading(true);
    try {
      await startCheckoutSession(getValues(), {
        showStripeLink: false,
        reuseOrderId: checkoutOrderId,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to reset payment options";
      setSubmitError(message);
    } finally {
      setLinkToggleLoading(false);
    }
  }

  if (embeddedClientSecret) {
    return (
      <Card variant="elevated" className="overflow-hidden border-neutral-200/90 p-0">
        <div className="space-y-1 border-b border-neutral-100 bg-gradient-to-br from-brand-50/90 via-white to-white px-4 py-4 sm:px-5 sm:py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Payment</p>
          <h2 className="text-title-md text-neutral-900">Pay securely</h2>
          <p className="text-body-sm text-neutral-600">
            Use <strong className="font-medium text-neutral-800">Apple Pay</strong> or your{" "}
            <strong className="font-medium text-neutral-800">card</strong> in the form below when available. Apple Pay
            needs a supported device and a verified setup; on some dev URLs (non-HTTPS) wallets may not appear—production
            and device builds work best.
          </p>
        </div>

        <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
          {checkoutOrderId ? (
            <div className="rounded-xl bg-neutral-50/90 ring-1 ring-inset ring-neutral-200/70">
              <div className="border-b border-neutral-200/60 px-4 py-3 sm:px-4">
                <p className="text-sm font-semibold text-neutral-900">Faster checkout next time</p>
                <p className="mt-0.5 text-sm text-neutral-600">
                  <span className="font-medium text-neutral-800">Link</span> is built into Stripe—the same company
                  processing your card. It&apos;s optional and only appears if you add it here.
                </p>
              </div>
              <div className="space-y-3 px-4 py-3 sm:px-4">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 text-left text-sm font-medium text-brand-700 hover:text-brand-800"
                  onClick={() => setLinkLearnMoreOpen((o) => !o)}
                >
                  <span>{linkLearnMoreOpen ? "Hide details" : "How Link works"}</span>
                  <span className="text-neutral-400" aria-hidden>
                    {linkLearnMoreOpen ? "−" : "+"}
                  </span>
                </button>
                {linkLearnMoreOpen ? (
                  <p className="text-sm leading-relaxed text-neutral-600">
                    If you choose Link, you can save an email and payment method for quicker checkout on other sites that
                    use Stripe. You can always pay with just your card or Apple Pay without Link.
                  </p>
                ) : null}

                {!stripeLinkInForm ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    disabled={linkToggleLoading}
                    onClick={() => void handleShowStripeLinkOption()}
                  >
                    {linkToggleLoading ? "Updating…" : "Include Link in this payment"}
                  </Button>
                ) : (
                  <div className="space-y-2 rounded-lg border border-brand-200/80 bg-brand-50/50 px-3 py-3">
                    <p className="text-sm text-brand-950/90">
                      Link and any extra funding options Stripe shows are enabled below. If you explored Link or bank
                      transfer and went back, the form can keep old choices—reset to card-first anytime.
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full border border-brand-200/90 bg-white hover:bg-brand-50/90"
                      disabled={linkToggleLoading}
                      onClick={() => void handleCardAndApplePayOnly()}
                    >
                      {linkToggleLoading ? "Resetting…" : "Card & Apple Pay only"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <StripeEmbeddedCheckout
            key={embeddedClientSecret}
            clientSecret={embeddedClientSecret}
            publishableKey={embeddedPublishableKey ?? undefined}
            onBack={() => {
              setEmbeddedClientSecret(null);
              setEmbeddedPublishableKey(null);
              setCheckoutOrderId(null);
              setStripeLinkInForm(false);
              setLinkLearnMoreOpen(false);
            }}
          />
        </div>
      </Card>
    );
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {submitError ? <ErrorState message={submitError} /> : null}
      <Card variant="elevated" className="space-y-0 overflow-hidden border-neutral-200/90 p-0">
        <div className="space-y-3 border-b border-neutral-100 bg-gradient-to-br from-white to-brand-50/40 px-4 py-4 sm:px-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Your pickup</p>
            <h2 className="mt-1 text-title-md text-neutral-900">{listingTitle}</h2>
            <p className="text-body-sm text-neutral-600">{restaurantName}</p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-700">
            <span>
              <span className="text-neutral-500">Pickup · </span>
              {pickupLabel}
            </span>
            <span>
              <span className="text-neutral-500">Available · </span>
              <strong>{quantityAvailable}</strong>
            </span>
          </div>
        </div>

        <div className="space-y-4 px-4 py-4 sm:px-5">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Contact</h3>
            <p className="mt-0.5 text-body-sm text-neutral-600">We&apos;ll use this for your receipt and pickup.</p>
          </div>
          <Input label="Name" error={errors.name?.message} {...register("name")} />
          <Input label="Phone" type="tel" error={errors.phone?.message} {...register("phone")} />
          <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
          <Input
            label="Quantity"
            type="number"
            min={1}
            max={quantityAvailable}
            error={errors.quantity?.message}
            {...register("quantity", { valueAsNumber: true })}
          />

          <div className="flex items-end justify-between gap-3 rounded-xl bg-neutral-50 px-3 py-3 ring-1 ring-inset ring-neutral-200/60">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Total</p>
              <p className="text-lg font-semibold tabular-nums text-neutral-900">
                ${(totalCents / 100).toFixed(2)}
              </p>
              <p className="text-xs text-neutral-500">
                {quantity} × ${(unitPriceCents / 100).toFixed(2)} each
              </p>
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Starting checkout…" : "Continue to payment"}
          </Button>
        </div>
      </Card>
    </form>
  );
}
