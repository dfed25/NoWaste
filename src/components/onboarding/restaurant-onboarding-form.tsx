"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/feedback/toast-provider";
import {
  restaurantOnboardingSchema,
  type RestaurantOnboardingInput,
} from "@/lib/validation";

const defaultValues: RestaurantOnboardingInput = {
  restaurantName: "",
  addressLine1: "",
  city: "",
  state: "",
  postalCode: "",
  latitude: 0,
  longitude: 0,
  timezone: "America/New_York",
  hoursOfOperation: "Mon-Sun 8:00 AM - 10:00 PM",
  contactPersonName: "",
  contactPersonEmail: "",
  contactPersonPhone: "",
  donationFallbackEnabled: true,
  preferredDonationPartner: "",
  paymentOnboardingStatus: "not_started",
};

function onboardingApiUrl(adminRestaurantId?: string) {
  const base = "/api/onboarding/restaurant";
  if (adminRestaurantId) {
    return `${base}?restaurantId=${encodeURIComponent(adminRestaurantId)}`;
  }
  return base;
}

type Props = {
  adminRestaurantId?: string;
};

export function RestaurantOnboardingForm({ adminRestaurantId }: Props) {
  const { pushToast } = useToast();
  const apiUrl = useMemo(() => onboardingApiUrl(adminRestaurantId), [adminRestaurantId]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RestaurantOnboardingInput>({
    resolver: zodResolver(restaurantOnboardingSchema),
    defaultValues,
  });

  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { draft?: { data: RestaurantOnboardingInput } } | null) => {
        if (cancelled || !payload?.draft?.data) return;
        reset(payload.draft.data, { keepDirtyValues: true });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [apiUrl, reset]);

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(async (values) => {
        const response = await fetch(apiUrl, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        if (!response.ok) {
          pushToast({
            tone: "error",
            title: "Save failed",
            description: payload.error || "Could not save onboarding draft.",
          });
          return;
        }
        pushToast({
          tone: "success",
          title: "Onboarding saved",
          description: "Your restaurant profile draft is stored for this location.",
        });
      })}
    >
      <Card className="space-y-3">
        <h2 className="text-title-md">Restaurant profile</h2>
        <Input
          label="Restaurant name"
          error={errors.restaurantName?.message}
          {...register("restaurantName")}
        />
      </Card>

      <Card className="space-y-3">
        <h2 className="text-title-md">Address and geo fields</h2>
        <Input
          label="Address line 1"
          error={errors.addressLine1?.message}
          {...register("addressLine1")}
        />
        <div className="grid gap-3 md:grid-cols-3">
          <Input label="City" error={errors.city?.message} {...register("city")} />
          <Input label="State" error={errors.state?.message} {...register("state")} />
          <Input
            label="Postal code"
            error={errors.postalCode?.message}
            {...register("postalCode")}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            label="Latitude"
            type="number"
            step="0.000001"
            error={errors.latitude?.message}
            {...register("latitude", { valueAsNumber: true })}
          />
          <Input
            label="Longitude"
            type="number"
            step="0.000001"
            error={errors.longitude?.message}
            {...register("longitude", { valueAsNumber: true })}
          />
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-title-md">Hours of operation</h2>
        <Input
          label="Timezone"
          error={errors.timezone?.message}
          {...register("timezone")}
        />
        <Textarea
          label="Hours"
          error={errors.hoursOfOperation?.message}
          {...register("hoursOfOperation")}
        />
      </Card>

      <Card className="space-y-3">
        <h2 className="text-title-md">Contact person</h2>
        <Input
          label="Name"
          error={errors.contactPersonName?.message}
          {...register("contactPersonName")}
        />
        <Input
          label="Email"
          type="email"
          error={errors.contactPersonEmail?.message}
          {...register("contactPersonEmail")}
        />
        <Input
          label="Phone"
          error={errors.contactPersonPhone?.message}
          {...register("contactPersonPhone")}
        />
      </Card>

      <Card className="space-y-3">
        <h2 className="text-title-md">Donation and payment preferences</h2>
        <label className="flex items-center gap-2 text-sm text-neutral-800">
          <input type="checkbox" {...register("donationFallbackEnabled")} />
          Enable donation fallback
        </label>
        <Input
          label="Preferred donation partner (optional)"
          error={errors.preferredDonationPartner?.message}
          {...register("preferredDonationPartner")}
        />
        <Input
          label="Payment onboarding status"
          error={errors.paymentOnboardingStatus?.message}
          {...register("paymentOnboardingStatus")}
        />
      </Card>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save onboarding draft"}
      </Button>
    </form>
  );
}
