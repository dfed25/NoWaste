import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
  MARKETING_LINK_BUTTON_PRIMARY,
  MARKETING_LINK_BUTTON_SECONDARY,
} from "@/lib/ui/marketing-link-classes";

export default function GetStartedPage() {
  return (
    <section className="mx-auto max-w-lg space-y-8 pb-12 pt-2">
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">NoWaste</p>
        <h1 className="text-title-lg text-neutral-900">Welcome</h1>
        <p className="text-body-md text-neutral-600">
          Create an account and choose how you&apos;ll use the app. Your choice sets up the right home
          screen and permissions.
        </p>
      </div>

      <div className="space-y-4">
        <Card className="border-neutral-200/90 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-neutral-900">I&apos;m ordering food</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">
            Browse surplus meals, reserve pickups, and track orders.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Link href="/auth/sign-up?role=customer" className={MARKETING_LINK_BUTTON_PRIMARY}>
              Create customer account
            </Link>
            <Link href="/auth/login?role=customer" className={MARKETING_LINK_BUTTON_SECONDARY}>
              I already have an account
            </Link>
          </div>
        </Card>

        <Card className="border-neutral-200/90 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-neutral-900">I represent a restaurant</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">
            List surplus inventory, manage reservations, and run pickup operations.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Link href="/auth/sign-up?role=restaurant" className={MARKETING_LINK_BUTTON_PRIMARY}>
              Create restaurant account
            </Link>
            <Link href="/auth/login?role=restaurant" className={MARKETING_LINK_BUTTON_SECONDARY}>
              I already have an account
            </Link>
          </div>
        </Card>
      </div>

      <p className="text-center text-xs text-neutral-500">
        Please use a valid email address. Sessions remain active on this device.
      </p>
    </section>
  );
}
