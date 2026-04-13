"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/feedback/toast-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { RESTAURANT_ONBOARDING_LOGIN_HREF } from "@/lib/auth/safe-next-path";
import {
  restaurantStaffSignUpSchema,
  signUpSchema,
  type RestaurantStaffSignUpInput,
  type SignUpInput,
} from "@/lib/validation";
import type { AppRole } from "@/lib/admin";

type Props = {
  role: AppRole;
};

function roleLabel(role: AppRole) {
  return role === "restaurant_staff" ? "Restaurant" : "Customer";
}

function CustomerSignUpForm({ role }: { role: Exclude<AppRole, "restaurant_staff"> }) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            display_name: values.name,
            app_role: role,
          },
        },
      });

      if (error) {
        pushToast({
          tone: "error",
          title: "Sign up failed",
          description: error.message,
        });
        return;
      }

      pushToast({
        tone: "success",
        title: "Account created",
        description: "Check your inbox if email confirmation is enabled.",
      });
      router.push(`/auth/login?role=${encodeURIComponent(role)}`);
    } catch (error) {
      pushToast({
        tone: "error",
        title: "Sign up error",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <p className="text-xs font-medium text-brand-700">Signing up as: {roleLabel(role)}</p>
      <Input
        label="Full name"
        autoComplete="name"
        error={errors.name?.message}
        {...register("name")}
      />
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>
      <p className="text-xs text-neutral-600">
        Already have an account?{" "}
        <Link href={`/auth/login?role=${encodeURIComponent(role)}`} className="underline">
          Log in
        </Link>
      </p>
    </form>
  );
}

function RestaurantStaffSignUpForm() {
  const router = useRouter();
  const { pushToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RestaurantStaffSignUpInput>({
    resolver: zodResolver(restaurantStaffSignUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      businessLegalName: "",
      businessPhone: "",
      foodServiceAttestation: false,
      enrollmentCode: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/sign-up/restaurant", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        pushToast({
          tone: "error",
          title: "Sign up failed",
          description: payload.error ?? "Could not create restaurant account.",
        });
        return;
      }

      pushToast({
        tone: "success",
        title: "Account created",
        description: "Check your inbox if email confirmation is enabled.",
      });
      router.push(RESTAURANT_ONBOARDING_LOGIN_HREF);
    } catch (error) {
      pushToast({
        tone: "error",
        title: "Sign up error",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <p className="text-xs font-medium text-brand-700">
        Signing up as: {roleLabel("restaurant_staff")}
      </p>

      <Input
        label="Full name"
        autoComplete="name"
        error={errors.name?.message}
        {...register("name")}
      />
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register("password")}
      />

      <Card className="space-y-3 border-brand-100 bg-brand-50/40 p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Restaurant verification</h2>
        <p className="text-xs text-neutral-600">
          These fields help ensure partner accounts represent real food businesses. Your team may also
          require a location id in your profile before you can publish listings.
        </p>
        <Input
          label="Legal business name"
          autoComplete="organization"
          error={errors.businessLegalName?.message}
          {...register("businessLegalName")}
        />
        <Input
          label="Business phone"
          type="tel"
          autoComplete="tel"
          error={errors.businessPhone?.message}
          {...register("businessPhone")}
        />
        <Input
          label="Partner enrollment code (if your organization provided one)"
          autoComplete="off"
          error={errors.enrollmentCode?.message}
          {...register("enrollmentCode")}
        />
        <label className="flex items-start gap-2 text-sm text-neutral-800">
          <input
            type="checkbox"
            className="mt-1 rounded border-neutral-300"
            {...register("foodServiceAttestation")}
          />
          <span>
            I confirm that I am authorized to register this account for a licensed food service or
            restaurant business.
          </span>
        </label>
        {errors.foodServiceAttestation?.message ? (
          <p className="text-xs text-rose-700">{errors.foodServiceAttestation.message}</p>
        ) : null}
      </Card>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>
      <p className="text-xs text-neutral-600">
        Already have an account?{" "}
        <Link href={RESTAURANT_ONBOARDING_LOGIN_HREF} className="underline">
          Log in
        </Link>
      </p>
    </form>
  );
}

export function SignUpForm({ role }: Props) {
  if (role === "restaurant_staff") {
    return <RestaurantStaffSignUpForm />;
  }
  return <CustomerSignUpForm role={role} />;
}
