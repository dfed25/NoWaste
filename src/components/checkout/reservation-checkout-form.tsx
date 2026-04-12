"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  const router = useRouter();
  const { pushToast } = useToast();
  const { user } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [embeddedClientSecret, setEmbeddedClientSecret] = useState<string | null>(null);
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

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      const response = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        checkoutUrl?: string;
        confirmationUrl?: string;
      };

      if (payload.clientSecret) {
        setEmbeddedClientSecret(payload.clientSecret);
        return;
      }

      if (payload.checkoutUrl) {
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
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to start checkout";
      setSubmitError(message);
    }
  });

  if (embeddedClientSecret) {
    return (
      <div className="space-y-4">
        <Card className="space-y-2 border-neutral-200/80">
          <h2 className="text-title-md">Payment</h2>
          <p className="text-body-sm text-neutral-600">
            Complete your card details below. You stay on NoWaste—no redirect to an external checkout
            page when embedded payments are enabled.
          </p>
        </Card>
        <Card className="border-neutral-200/80 p-4 sm:p-5">
          <StripeEmbeddedCheckout
            key={embeddedClientSecret}
            clientSecret={embeddedClientSecret}
            onBack={() => setEmbeddedClientSecret(null)}
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
