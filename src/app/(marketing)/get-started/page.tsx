import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const primaryLinkClasses =
  "inline-flex h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2";

const secondaryLinkClasses =
  "inline-flex h-10 items-center justify-center rounded-xl bg-neutral-100 px-4 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2";

export default function GetStartedPage() {
  return (
    <section className="space-y-4 pb-8">
      <Card
        variant="elevated"
        className="space-y-4 border-neutral-200/80 bg-gradient-to-br from-white to-brand-100/30"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="brand">Welcome to NoWaste</Badge>
            <Badge variant="neutral">Choose your role</Badge>
          </div>
          <h1 className="text-title-lg text-neutral-900">How do you want to use the app?</h1>
          <p className="text-body-sm text-neutral-600">
            Pick an account type to personalize your onboarding and dashboard.
          </p>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="space-y-3 border-neutral-200/80">
          <div className="space-y-1">
            <h2 className="text-title-md">I am a customer</h2>
            <p className="text-sm text-neutral-600">
              Discover nearby surplus meals, reserve quickly, and track pickups.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/auth/sign-up?role=customer" className={primaryLinkClasses}>
              Sign up as customer
            </Link>
            <Link href="/auth/login?role=customer" className={secondaryLinkClasses}>
              I already have an account
            </Link>
          </div>
        </Card>

        <Card className="space-y-3 border-neutral-200/80">
          <div className="space-y-1">
            <h2 className="text-title-md">I run a restaurant</h2>
            <p className="text-sm text-neutral-600">
              Publish surplus listings, monitor reservations, and manage pickup operations.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/auth/sign-up?role=restaurant" className={primaryLinkClasses}>
              Sign up as restaurant
            </Link>
            <Link href="/auth/login?role=restaurant" className={secondaryLinkClasses}>
              I already have an account
            </Link>
          </div>
        </Card>
      </div>
    </section>
  );
}
