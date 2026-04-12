"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const [isRefetching, setIsRefetching] = useState(false);
  const [profileFetchFailed, setProfileFetchFailed] = useState(false);
  const [existingProfile, setExistingProfile] = useState<AccountSettingsInput | null>(null);
  const mountedRef = useRef(true);

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
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadProfile = useCallback(
    async (isRetry: boolean) => {
      if (isRetry) {
        setIsRefetching(true);
        setProfileFetchFailed(false);
      }
      try {
        const res = await fetch("/api/account/me", { credentials: "include", cache: "no-store" });
        const data = (await res.json()) as { profile?: AccountSettingsInput };
        if (!mountedRef.current) return;
        if (!res.ok) {
          setProfileFetchFailed(true);
          return;
        }
        setProfileFetchFailed(false);
        setExistingProfile(data.profile ?? null);
        if (!data.profile) return;

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
        if (mountedRef.current) setProfileFetchFailed(true);
      } finally {
        if (!mountedRef.current) return;
        if (isRetry) setIsRefetching(false);
        else setIsLoading(false);
      }
    },
    [getValues, reset, user?.email, user?.user_metadata?.display_name],
  );

  useEffect(() => {
    void loadProfile(false);
  }, [loadProfile]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (profileFetchFailed) return;
      const prior = existingProfile;
      const displayName = values.displayName.trim();
      const phone = values.phone.trim();
      const body: AccountSettingsInput = {
        displayName: displayName,
        email: values.email.trim(),
        phone: phone,
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
        {profileFetchFailed ? (
          <div className="space-y-2 rounded-md border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-800">
            <p>We couldn&apos;t load your account settings. Retry or refresh the page.</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isRefetching}
              onClick={() => void loadProfile(true)}
            >
              {isRefetching ? "Retrying…" : "Retry"}
            </Button>
          </div>
        ) : null}
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
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting || profileFetchFailed || isRefetching}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? "Saving…" : "Continue to marketplace"}
        </Button>
      </Card>
    </form>
  );
}
