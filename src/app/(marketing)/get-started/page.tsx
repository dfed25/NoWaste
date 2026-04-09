import Link from "next/link";
import { Card } from "@/components/ui/card";

const btnPrimary =
  "inline-flex h-11 w-full items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2";

const btnSecondary =
  "inline-flex h-11 w-full items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2";

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
            <Link href="/auth/sign-up?role=customer" className={btnPrimary}>
              Create customer account
            </Link>
            <Link href="/auth/login?role=customer" className={btnSecondary}>
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
            <Link href="/auth/sign-up?role=restaurant" className={btnPrimary}>
              Create restaurant account
            </Link>
            <Link href="/auth/login?role=restaurant" className={btnSecondary}>
              I already have an account
            </Link>
          </div>
        </Card>
      </div>

      <p className="text-center text-xs text-neutral-500">
        By continuing you agree to use a real email and password. Sessions stay signed in on this
        device.
      </p>
    </section>
  );
}
