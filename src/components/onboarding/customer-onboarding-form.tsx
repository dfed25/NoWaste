"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/feedback/toast-provider";
import {
  accountSettingsSchema,
  type AccountSettingsInput,
} from "@/lib/validation";

const onboardingSchema = accountSettingsSchema.pick({
  displayName: true,
  phone: true,
  email: true,
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

export function CustomerOnboardingForm() {
  const router = useRouter();
  const { pushToast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [profileFetchFailed, setProfileFetchFailed] = useState(false);
  const [existingProfile, setExistingProfile] = useState<AccountSettingsInput | null>(null);

  const {
    register,
    reset,
    getValues,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      displayName: "",
      phone: "",
      email: "",
    },
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await fetch("/api/account/me", { credentials: "include", cache: "no-store" });
        const data = (await res.json()) as { profile?: AccountSettingsInput };
        if (!mounted) return;
        if (!res.ok) {
          setProfileFetchFailed(true);
          return;
        }
        setProfileFetchFailed(false);
        if (!data.profile) return;

        setExistingProfile(data.profile);

        const c = getValues();
        const metaName =
          typeof user?.user_metadata?.display_name === "string"
            ? user.user_metadata.display_name
            : "";
        reset({
          displayName:
            c.displayName?.trim() || data.profile.displayName || metaName || "",
          phone: c.phone?.trim() || data.profile.phone || "",
          email: c.email?.trim() || data.profile.email || user?.email || "",
        });
      } catch {
        if (mounted) setProfileFetchFailed(true);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [getValues, reset, user?.email, user?.user_metadata?.display_name]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (profileFetchFailed) {
        throw new Error("Could not load your account settings. Please refresh the page and try again.");
      }
      const prior = existingProfile;
      const body: AccountSettingsInput = {
        displayName: values.displayName,
        email: values.email.trim(),
        phone: values.phone,
        dietaryPreferences: prior?.dietaryPreferences ?? [],
        defaultMaxDistanceMiles: prior?.defaultMaxDistanceMiles ?? 10,
        marketingOptIn: prior?.marketingOptIn ?? false,
      };

      const res = await fetch("/api/account/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error ?? "Could not save profile");
      }

      pushToast({
        tone: "success",
        title: "Profile saved",
        description: "You can reserve meals with these details pre-filled.",
      });
      router.push("/");
      router.refresh();
    } catch (e) {
      pushToast({
        tone: "error",
        title: "Could not save",
        description: e instanceof Error ? e.message : "Try again.",
      });
    }
  });

  if (isLoading) {
    return (
      <Card className="border-neutral-200/80 p-4">
        <p className="text-sm text-neutral-600">Loading…</p>
      </Card>
    );
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <Card className="space-y-3 border-neutral-200/80">
        <Input
          label="Full name"
          autoComplete="name"
          error={errors.displayName?.message}
          {...register("displayName")}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <p className="text-xs text-neutral-500">
          Used for order confirmations; you can edit this anytime in account settings.
        </p>
        <Input
          label="Phone"
          type="tel"
          autoComplete="tel"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <Button type="submit" variant="primary" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? "Saving…" : "Continue to marketplace"}
        </Button>
      </Card>
    </form>
  );
}
