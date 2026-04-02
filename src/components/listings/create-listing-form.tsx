"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { listingSchema, type ListingInput } from "@/lib/validation";
import { useToast } from "@/components/feedback/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/states/error-state";

type FormValues = ListingInput;

export function CreateListingForm() {
  const router = useRouter();
  const { pushToast } = useToast();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: "",
      description: "",
      allergyNotes: "",
      quantityTotal: 1,
      discountedPriceCents: 0,
      pickupWindowStart: "",
      pickupWindowEnd: "",
      reservationCutoffAt: "",
      donationFallbackEnabled: true,
      photoFileName: "",
      listingType: "consumer",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      // Placeholder for API persistence (APP-142 publish action)
      await new Promise((resolve) => setTimeout(resolve, 450));

      pushToast({
        tone: "success",
        title: "Listing published",
        description: `${values.title} is now active for tonight.`,
      });
      router.push("/listings");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not publish listing";
      setSubmitError(message);
    }
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {submitError ? (
        <ErrorState message={submitError} />
      ) : null}

      <Card className="space-y-3">
        <h2 className="text-title-md">Listing details</h2>
        <Input
          label="Title"
          placeholder="Tonight's surplus meal bags"
          error={errors.title?.message}
          {...register("title")}
        />
        <Textarea
          label="Description"
          placeholder="Describe what is included in this listing."
          error={errors.description?.message}
          {...register("description")}
        />
      </Card>

      <Card className="space-y-3">
        <h2 className="text-title-md">Inventory and pickup</h2>
        <Input
          label="Quantity"
          type="number"
          min={1}
          error={errors.quantityTotal?.message}
          {...register("quantityTotal", { valueAsNumber: true })}
        />
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            label="Pickup window start"
            type="datetime-local"
            error={errors.pickupWindowStart?.message}
            {...register("pickupWindowStart")}
          />
          <Input
            label="Pickup window end"
            type="datetime-local"
            error={errors.pickupWindowEnd?.message}
            {...register("pickupWindowEnd")}
          />
        </div>
        <Input
          label="Reservation cutoff"
          type="datetime-local"
          error={errors.reservationCutoffAt?.message}
          {...register("reservationCutoffAt")}
        />
      </Card>

      <Card className="space-y-3">
        <h2 className="text-title-md">Pricing and dietary information</h2>
        <Input
          label="Discounted price (cents)"
          type="number"
          min={0}
          error={errors.discountedPriceCents?.message}
          {...register("discountedPriceCents", { valueAsNumber: true })}
        />
        <Textarea
          label="Allergy / dietary notes"
          placeholder="Contains nuts, dairy-free option available, etc."
          error={errors.allergyNotes?.message}
          {...register("allergyNotes")}
        />
      </Card>

      <Card className="space-y-3">
        <h2 className="text-title-md">Photo and fallback controls</h2>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-neutral-800">Listing photo</span>
          <input
            type="file"
            accept="image/*"
            className="block rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700"
            onChange={(event) => {
              const file = event.target.files?.[0];
              const next = file?.name ?? "";
              setPhotoFileName(next);
              setValue("photoFileName", next);
            }}
          />
          {photoFileName ? (
            <span className="text-xs text-neutral-500">Selected: {photoFileName}</span>
          ) : null}
        </label>

        <label className="flex items-center gap-2 text-sm text-neutral-800">
          <input type="checkbox" {...register("donationFallbackEnabled")} />
          Enable donation fallback
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-neutral-800">Listing type</span>
          <select
            className="h-11 rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900"
            {...register("listingType")}
          >
            <option value="consumer">Consumer</option>
            <option value="donation">Donation</option>
          </select>
        </label>
      </Card>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Publishing..." : "Publish listing"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/listings")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

