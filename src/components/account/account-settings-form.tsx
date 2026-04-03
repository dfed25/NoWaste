"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/feedback/toast-provider";
import {
  accountSettingsSchema,
  type AccountSettingsInput,
} from "@/lib/validation";

const dietaryOptions = [
  { value: "vegan", label: "Vegan" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "gluten_free", label: "Gluten-free" },
  { value: "dairy_free", label: "Dairy-free" },
] as const;

export function AccountSettingsForm() {
  const { pushToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    reset,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AccountSettingsInput>({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      displayName: "",
      email: "",
      phone: "",
      dietaryPreferences: [],
      defaultMaxDistanceMiles: 10,
      marketingOptIn: false,
    },
  });

  const selectedDietary = watch("dietaryPreferences");

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const response = await fetch("/api/account/me", { cache: "no-store" });
        const payload = (await response.json()) as {
          profile?: AccountSettingsInput;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Could not load account settings");
        }

        if (mounted && payload.profile) {
          reset(payload.profile);
        }
      } catch (error) {
        if (!mounted) return;
        pushToast({
          tone: "error",
          title: "Unable to load settings",
          description:
            error instanceof Error
              ? error.message
              : "Please refresh and try again.",
        });
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void loadProfile();
    return () => {
      mounted = false;
    };
  }, [pushToast, reset]);

  function toggleDietaryPreference(preference: (typeof dietaryOptions)[number]["value"]) {
    const current = selectedDietary ?? [];
    if (current.includes(preference)) {
      setValue(
        "dietaryPreferences",
        current.filter((item) => item !== preference),
        { shouldDirty: true, shouldValidate: true },
      );
      return;
    }

    setValue("dietaryPreferences", [...current, preference], {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  if (isLoading) {
    return (
      <Card className="space-y-2">
        <p className="text-sm text-neutral-600">Loading account settings...</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <h2 className="text-title-md">Account settings</h2>
      <form
        className="grid gap-4"
        onSubmit={handleSubmit(async (values) => {
          try {
            const response = await fetch("/api/account/me", {
              method: "PATCH",
              headers: {
                "content-type": "application/json",
              },
              body: JSON.stringify(values),
            });

            const payload = (await response.json()) as { error?: string };
            if (!response.ok) {
              throw new Error(payload.error ?? "Could not save account settings");
            }

            pushToast({
              tone: "success",
              title: "Settings saved",
              description: "Your profile and preferences were updated.",
            });
          } catch (error) {
            pushToast({
              tone: "error",
              title: "Save failed",
              description:
                error instanceof Error
                  ? error.message
                  : "Unable to save your settings right now.",
            });
          }
        })}
      >
        <Input
          label="Display name"
          error={errors.displayName?.message}
          {...register("displayName")}
        />
        <Input
          label="Email"
          type="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Phone"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <Input
          label="Default search radius (miles)"
          type="number"
          min={1}
          max={50}
          error={errors.defaultMaxDistanceMiles?.message}
          {...register("defaultMaxDistanceMiles", { valueAsNumber: true })}
        />

        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-800">Dietary preferences</p>
          <div className="flex flex-wrap gap-3 text-sm">
            {dietaryOptions.map((option) => (
              <label key={option.value} className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(selectedDietary ?? []).includes(option.value)}
                  onChange={() => toggleDietaryPreference(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-sm font-medium text-neutral-800">
          <input type="checkbox" {...register("marketingOptIn")} />
          Send me occasional product updates and promotions
        </label>

        <div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
