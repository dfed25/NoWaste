"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { RestaurantOnboardingForm } from "@/components/onboarding/restaurant-onboarding-form";
import { RestaurantVerificationPanel } from "@/components/onboarding/restaurant-verification-panel";
import {
  canStaffOperateMarketplace,
  type RestaurantApplicationStatus,
} from "@/lib/restaurant-application-status";

type StaffProps = {
  variant: "staff";
  hasRestaurantScope: boolean;
  scopedRestaurantId?: string;
  applicationStatus: RestaurantApplicationStatus;
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
  const staffStatus = props.variant === "staff" ? props.applicationStatus : null;
  const staffCanGoLive = staffStatus ? canStaffOperateMarketplace(staffStatus) : true;

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-emerald-50/40 p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">Restaurant onboarding</p>
        <h1 className="mt-2 text-title-lg text-neutral-900">Partner setup</h1>
        <p className="mt-2 max-w-2xl text-body-sm text-neutral-600">
          New partners start in <strong className="font-semibold">pending verification</strong>, prove
          contact ownership, then wait for a quick admin review before listings and orders go live.
        </p>
        <ol className="mt-5 grid gap-3 text-sm text-neutral-700 sm:grid-cols-2 lg:grid-cols-4">
          <li className="flex gap-2 rounded-xl border border-white/60 bg-white/70 px-3 py-2 shadow-sm">
            <span className="font-semibold text-brand-700">1</span>
            <span>Public signup (account + business basics)</span>
          </li>
          <li className="flex gap-2 rounded-xl border border-white/60 bg-white/70 px-3 py-2 shadow-sm">
            <span className="font-semibold text-brand-700">2</span>
            <span>Verify email or phone you control</span>
          </li>
          <li className="flex gap-2 rounded-xl border border-white/60 bg-white/70 px-3 py-2 shadow-sm">
            <span className="font-semibold text-brand-700">3</span>
            <span>Admin approves the venue (manual review)</span>
          </li>
          <li className="flex gap-2 rounded-xl border border-white/60 bg-white/70 px-3 py-2 shadow-sm">
            <span className="font-semibold text-brand-700">4</span>
            <span>Location profile draft + go live</span>
          </li>
        </ol>
      </div>

      {props.variant === "staff" && staffStatus === "pending_verification" ? (
        <RestaurantVerificationPanel />
      ) : null}

      {props.variant === "staff" && staffStatus === "pending_approval" ? (
        <Card className="space-y-2 border-amber-200 bg-amber-50/90 p-5">
          <h2 className="text-title-md text-amber-950">Awaiting admin approval</h2>
          <p className="text-sm text-amber-900/90">
            Contact verification is complete. You can still save your location profile below. Listings,
            reservations, and donation tools unlock once an administrator marks this account approved.
          </p>
        </Card>
      ) : null}

      {props.variant === "staff" && staffStatus === "rejected" ? (
        <Card className="space-y-2 border-rose-200 bg-rose-50/90 p-5">
          <h2 className="text-title-md text-rose-950">Application not approved</h2>
          <p className="text-sm text-rose-900/90">
            This workspace cannot publish on the marketplace. Reach out to support if you believe this
            is a mistake.
          </p>
        </Card>
      ) : null}

      {props.variant === "staff" && staffStatus === "suspended" ? (
        <Card className="space-y-2 border-neutral-300 bg-neutral-50 p-5">
          <h2 className="text-title-md text-neutral-900">Account suspended</h2>
          <p className="text-sm text-neutral-700">
            Marketplace tools are disabled for this restaurant. Contact support for next steps.
          </p>
        </Card>
      ) : null}

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
              Signed-in staff use this location id for drafts and admin tools:{" "}
              <code className="rounded bg-emerald-100/80 px-1.5 py-0.5 text-xs font-medium text-emerald-950">
                {scopedId}
              </code>
            </p>
            {!staffCanGoLive && staffStatus !== "rejected" && staffStatus !== "suspended" ? (
              <p className="mt-2 text-sm font-medium text-emerald-900">
                Dashboard shortcuts stay read-only for marketplace actions until you are approved.
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard" className={linkClass}>
              Open dashboard
            </Link>
            <Link
              href={staffCanGoLive ? "/listings" : "/onboarding/restaurant"}
              className={linkGhost}
            >
              Listings hub
            </Link>
            <Link
              href={staffCanGoLive ? "/reservations" : "/onboarding/restaurant"}
              className={linkGhost}
            >
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
        <div className="space-y-3">
          <h2 className="text-title-md text-neutral-900">Location profile</h2>
          <p className="text-sm text-neutral-600">
            Operating hours, address detail, and donation preferences. You can save drafts anytime; only
            approved partners can publish surplus listings.
          </p>
          <RestaurantOnboardingForm adminRestaurantId={adminRestaurantId} />
        </div>
      )}
    </div>
  );
}
