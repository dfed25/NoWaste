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
import type { PublicSignUpRole } from "@/lib/admin";

type Props = {
  role: PublicSignUpRole;
};

function roleLabel(role: PublicSignUpRole) {
  return role === "restaurant_staff" ? "Restaurant" : "Customer";
}

function CustomerSignUpForm() {
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
            app_role: "customer",
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
      router.push(`/auth/login?role=${encodeURIComponent("customer")}`);
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
      <p className="text-xs font-medium text-brand-700">Signing up as: {roleLabel("customer")}</p>
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
        <Link href={`/auth/login?role=${encodeURIComponent("customer")}`} className="underline">
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
      businessAddress: "",
      businessEmail: "",
      businessPhone: "",
      foodServiceType: "restaurant",
      foodServiceAttestation: false,
      termsAccepted: false,
      businessRegistrationId: "",
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
        title: "Application started",
        description:
          "You are not live on the marketplace yet. Sign in to verify your contact info and finish onboarding.",
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
    <form className="space-y-6" onSubmit={onSubmit}>
      <p className="text-xs font-medium text-brand-700">
        Signing up as: {roleLabel("restaurant_staff")}
      </p>
      <p className="text-sm text-neutral-600">
        Anyone can start an application. You stay in <strong className="font-semibold">pending verification</strong>{" "}
        until you prove contact ownership and an administrator approves the venue.
      </p>

      <Card className="space-y-4 border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-900">Account access</h2>
        <p className="text-xs text-neutral-600">
          Used to sign in. Your login email can differ from the public-facing business email below.
        </p>
        <Input
          label="Contact name"
          autoComplete="name"
          error={errors.name?.message}
          {...register("name")}
        />
        <Input
          label="Login email"
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
      </Card>

      <Card className="space-y-4 border-brand-100 bg-brand-50/30 p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-900">Business profile</h2>
        <Input
          label="Business / legal name"
          autoComplete="organization"
          error={errors.businessLegalName?.message}
          {...register("businessLegalName")}
        />
        <Input
          label="Business street address"
          autoComplete="street-address"
          error={errors.businessAddress?.message}
          {...register("businessAddress")}
        />
        <Input
          label="Business email (prefer your domain, e.g. hello@yourrestaurant.com)"
          type="email"
          autoComplete="email"
          error={errors.businessEmail?.message}
          {...register("businessEmail")}
        />
        <Input
          label="Business phone"
          type="tel"
          autoComplete="tel"
          error={errors.businessPhone?.message}
          {...register("businessPhone")}
        />
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-neutral-800">Type of food service</span>
          <select
            className="h-11 rounded-xl border border-neutral-300 bg-white px-3 text-base text-neutral-900 outline-none focus-visible:border-brand-500"
            {...register("foodServiceType")}
          >
            <option value="restaurant">Restaurant</option>
            <option value="cafe">Café / coffee</option>
            <option value="bakery">Bakery</option>
            <option value="catering">Catering</option>
            <option value="grocery">Grocery / market</option>
            <option value="food_truck">Food truck</option>
            <option value="other">Other</option>
          </select>
          {errors.foodServiceType?.message ? (
            <span className="text-xs text-red-600">{errors.foodServiceType.message}</span>
          ) : null}
        </label>
        <Input
          label="EIN or registration ID (optional)"
          autoComplete="off"
          error={errors.businessRegistrationId?.message}
          {...register("businessRegistrationId")}
        />
        <Input
          label="Partner enrollment code (only if your organization gave you one)"
          autoComplete="off"
          error={errors.enrollmentCode?.message}
          {...register("enrollmentCode")}
        />
      </Card>

      <Card className="space-y-3 border-neutral-200 bg-white p-4 shadow-sm">
        <label className="flex items-start gap-2 text-sm text-neutral-800">
          <input
            type="checkbox"
            className="mt-1 rounded border-neutral-300"
            {...register("foodServiceAttestation")}
          />
          <span>
            I confirm that I am authorized to register this account for a licensed food service
            business and that listings will follow applicable food-safety rules.
          </span>
        </label>
        {errors.foodServiceAttestation?.message ? (
          <p className="text-xs text-rose-700">{errors.foodServiceAttestation.message}</p>
        ) : null}
        <label className="flex items-start gap-2 text-sm text-neutral-800">
          <input
            type="checkbox"
            className="mt-1 rounded border-neutral-300"
            {...register("termsAccepted")}
          />
          <span>
            I agree to the{" "}
            <Link href="/legal/terms" className="font-medium text-brand-700 underline">
              Terms of Service
            </Link>{" "}
            and understand NoWaste is a marketplace; my business remains responsible for food safety,
            accurate listings, and donations prepared in good faith.
          </span>
        </label>
        {errors.termsAccepted?.message ? (
          <p className="text-xs text-rose-700">{errors.termsAccepted.message}</p>
        ) : null}
      </Card>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Submitting application..." : "Create account & continue"}
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
  return <CustomerSignUpForm />;
}
