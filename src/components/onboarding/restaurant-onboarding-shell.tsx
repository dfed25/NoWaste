"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { RestaurantOnboardingForm } from "@/components/onboarding/restaurant-onboarding-form";

type StaffProps = {
  variant: "staff";
  hasRestaurantScope: boolean;
  scopedRestaurantId?: string;
};

type AdminProps = {
  variant: "admin";
  adminRestaurantId?: string;
};

type Props = StaffProps | AdminProps;

const linkClass =
  "inline-flex rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-700";
const linkGhost =
  "inline-flex rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50";

export function RestaurantOnboardingShell(props: Props) {
  const adminRestaurantId = props.variant === "admin" ? props.adminRestaurantId : undefined;
  const hasScope = props.variant === "staff" ? props.hasRestaurantScope : Boolean(adminRestaurantId);
  const scopedId = props.variant === "staff" ? props.scopedRestaurantId : undefined;

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-emerald-50/40 p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">Restaurant setup</p>
        <h1 className="mt-2 text-title-lg text-neutral-900">Location profile</h1>
        <p className="mt-2 max-w-2xl text-body-sm text-neutral-600">
          Save operating details, contact, and donation preferences for your venue. Drafts are stored per
          restaurant location on this server.
        </p>
        <ol className="mt-5 grid gap-3 text-sm text-neutral-700 sm:grid-cols-3">
          <li className="flex gap-2 rounded-xl border border-white/60 bg-white/70 px-3 py-2 shadow-sm">
            <span className="font-semibold text-brand-700">1</span>
            <span>Sign in with a restaurant account</span>
          </li>
          <li className="flex gap-2 rounded-xl border border-white/60 bg-white/70 px-3 py-2 shadow-sm">
            <span className="font-semibold text-brand-700">2</span>
            <span>Confirm your business is linked to a location</span>
          </li>
          <li className="flex gap-2 rounded-xl border border-white/60 bg-white/70 px-3 py-2 shadow-sm">
            <span className="font-semibold text-brand-700">3</span>
            <span>Complete and save your profile draft</span>
          </li>
        </ol>
      </div>

      {props.variant === "admin" && !adminRestaurantId ? (
        <Card className="space-y-2 border-amber-200 bg-amber-50/90 p-5">
          <h2 className="text-title-md text-amber-950">Choose a restaurant location</h2>
          <p className="text-sm text-amber-900/90">
            Add <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs">?restaurantId=…</code> to this
            page&apos;s URL to load and save the draft for that location.
          </p>
        </Card>
      ) : null}

      {props.variant === "staff" && hasScope ? (
        <Card className="space-y-4 border-emerald-200 bg-gradient-to-r from-emerald-50/90 to-white p-5">
          <div>
            <h2 className="text-title-md text-emerald-950">Your venue is connected</h2>
            <p className="mt-1 text-sm text-emerald-900/90">
              Signed-in staff can manage listings and reservations for this location. Location id:{" "}
              <code className="rounded bg-emerald-100/80 px-1.5 py-0.5 text-xs font-medium text-emerald-950">
                {scopedId}
              </code>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard" className={linkClass}>
              Open dashboard
            </Link>
            <Link href="/listings" className={linkGhost}>
              Listings hub
            </Link>
            <Link href="/reservations" className={linkGhost}>
              Reservations
            </Link>
          </div>
        </Card>
      ) : null}

      {props.variant === "staff" && !hasScope ? (
        <Card className="space-y-3 border-amber-200 bg-amber-50/90 p-5">
          <h2 className="text-title-md text-amber-950">Finish linking your restaurant</h2>
          <p className="text-sm text-amber-900/90">
            Your account is marked as restaurant staff, but no location is attached yet. An administrator
            must set <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">restaurant_id</code> in your
            Supabase user metadata (or use{" "}
            <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">DEFAULT_STAFF_RESTAURANT_ID</code> in
            local development). Until then, profile drafts cannot be saved from this screen.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link href="/dashboard" className={linkClass}>
              Try dashboard
            </Link>
            <Link href="/get-started" className={linkGhost}>
              Wrong account type?
            </Link>
          </div>
        </Card>
      ) : null}

      {props.variant === "admin" && !adminRestaurantId ? null : props.variant === "staff" && !hasScope ? null : (
        <RestaurantOnboardingForm adminRestaurantId={adminRestaurantId} />
      )}
    </div>
  );
}
