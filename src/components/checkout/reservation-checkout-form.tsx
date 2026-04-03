"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  reservationCheckoutSchema,
  type ReservationCheckoutInput,
} from "@/lib/validation";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/states/error-state";
import { useToast } from "@/components/feedback/toast-provider";
import {
  readCheckoutProfile,
  writeCheckoutProfile,
} from "@/lib/checkout-profile-storage";

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
  const { user, isLoading: authLoading } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const didInitialPrefill = useRef(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
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
    if (authLoading) return;

    const saved = readCheckoutProfile();
    const meta = user?.user_metadata as Record<string, unknown> | undefined;
    const displayName =
      typeof meta?.display_name === "string" ? meta.display_name : "";

    if (!didInitialPrefill.current) {
      reset({
        name: saved?.name?.trim() || displayName || "",
        email: saved?.email?.trim() || (user?.email ?? ""),
        phone: saved?.phone?.trim() || "",
        quantity: 1,
      });
      didInitialPrefill.current = true;
      return;
    }

    if (user?.email && !getValues("email")?.trim()) {
      setValue("email", user.email, { shouldDirty: false, shouldTouch: false });
    }
    if (displayName && !getValues("name")?.trim()) {
      setValue("name", displayName, { shouldDirty: false, shouldTouch: false });
    }
    // reset/setValue/getValues from react-hook-form are stable; we react to auth + user.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- form methods intentionally omitted
  }, [authLoading, user]);

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

      writeCheckoutProfile({
        name: values.name,
        email: values.email,
        phone: values.phone,
      });

      const payload = (await response.json()) as {
        checkoutUrl?: string;
        confirmationUrl?: string;
      };

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

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {submitError ? <ErrorState message={submitError} /> : null}
      <Card className="space-y-3">
        <h2 className="text-title-md">Reservation</h2>
        <p className="text-xs text-neutral-600">
          We keep name, email, and phone on this device after a successful checkout so your next order is faster. Sign in to also sync your email from your account.
        </p>
        <Input label="Name" error={errors.name?.message} {...register("name")} />
        <Input
          label="Email"
          type="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input label="Phone" error={errors.phone?.message} {...register("phone")} />
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
        {isSubmitting ? "Starting checkout..." : "Proceed to checkout"}
      </Button>
    </form>
  );
}

