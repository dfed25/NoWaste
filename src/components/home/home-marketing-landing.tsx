import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  MARKETING_LINK_BUTTON_PRIMARY,
  MARKETING_LINK_BUTTON_SECONDARY,
} from "@/lib/ui/marketing-link-classes";
import { SHARED_HOME_STEPS } from "@/components/home/home-steps";

/**
 * Public landing: no marketplace data until the user signs in (see middleware + home page).
 */
export function HomeMarketingLanding() {
  return (
    <section className="space-y-8 pb-10 pt-2">
      <Card
        variant="elevated"
        className="space-y-6 border-neutral-200/80 bg-gradient-to-br from-white via-white to-brand-100/30 p-6 sm:p-8"
      >
        <div className="space-y-3 text-center sm:text-left">
          <Badge variant="brand" className="mx-auto sm:mx-0">
            Surplus marketplace
          </Badge>
          <h1 className="text-balance text-title-xl text-neutral-900 sm:max-w-xl">
            Rescue great food before it goes to waste.
          </h1>
          <p className="mx-auto max-w-lg text-body-md text-neutral-600 sm:mx-0">
            Sign in to browse nearby listings, save favorites, and reserve pickups. New here? Create an
            account in under a minute.
          </p>
        </div>

        <ol className="grid gap-3 sm:grid-cols-3">
          {SHARED_HOME_STEPS.map((row) => (
            <li
              key={row.step}
              className="rounded-xl border border-neutral-200/80 bg-white/90 px-4 py-3 text-left text-sm shadow-sm"
            >
              <span className="text-xs font-semibold text-brand-700">{row.step}</span>
              <p className="mt-1 font-semibold text-neutral-900">{row.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-neutral-600">{row.desc}</p>
            </li>
          ))}
        </ol>

        <div className="mx-auto flex w-full max-w-md flex-col gap-2 sm:mx-0 sm:max-w-sm">
          <Link href="/auth/login?next=/" className={MARKETING_LINK_BUTTON_PRIMARY}>
            Sign in to continue
          </Link>
          <Link href="/auth/sign-up" className={MARKETING_LINK_BUTTON_SECONDARY}>
            Create an account
          </Link>
          <Link
            href="/get-started"
            className="inline-flex h-10 items-center justify-center rounded-xl text-sm font-medium text-brand-800 underline-offset-4 hover:underline"
          >
            Not sure where to start? Choose how you&apos;ll use NoWaste
          </Link>
        </div>
      </Card>

      <p className="text-center text-xs text-neutral-500">
        Restaurants manage inventory on a separate dashboard after sign-in.
      </p>
    </section>
  );
}
