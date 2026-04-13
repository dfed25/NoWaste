import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
  MARKETING_LINK_BUTTON_PRIMARY,
  MARKETING_LINK_BUTTON_SECONDARY,
} from "@/lib/ui/marketing-link-classes";

const ROLE_OPTIONS = [
  {
    key: "customer",
    title: "I'm ordering food",
    description: "Browse surplus meals, reserve pickups, and track orders.",
    signUpHref: "/auth/sign-up?role=customer",
    loginHref: "/auth/login?role=customer",
    createLabel: "Create customer account",
  },
  {
    key: "restaurant",
    title: "I represent a restaurant",
    description: "List surplus inventory, manage reservations, and run pickup operations.",
    signUpHref: "/auth/sign-up?role=restaurant",
    loginHref: "/auth/login?role=restaurant&next=%2Fonboarding%2Frestaurant",
    createLabel: "Create restaurant account",
  },
] as const;

type PageProps = {
  searchParams: Promise<{ notice?: string | string[] }>;
};

export default async function GetStartedPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const notice = Array.isArray(sp.notice) ? sp.notice[0] : sp.notice;

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

      {notice === "restaurant-only" ? (
        <Card className="border-amber-200 bg-amber-50/90 p-4 text-left text-sm text-amber-950">
          <p className="font-medium">Restaurant tools need a restaurant account.</p>
          <p className="mt-1 text-amber-900/90">
            You’re signed in as a customer. Switch to a restaurant profile below, or create a new
            restaurant account to manage listings and pickups.
          </p>
        </Card>
      ) : null}

      <div className="space-y-4">
        {ROLE_OPTIONS.map((option) => (
          <Card key={option.key} className="border-neutral-200/90 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-neutral-900">{option.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{option.description}</p>
            <div className="mt-5 flex flex-col gap-2">
              <Link href={option.signUpHref} className={MARKETING_LINK_BUTTON_PRIMARY}>
                {option.createLabel}
              </Link>
              <Link href={option.loginHref} className={MARKETING_LINK_BUTTON_SECONDARY}>
                I already have an account
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <p className="text-center text-xs text-neutral-500">
        Please use a valid email address. Sessions may stay active on this device until you sign out,
        the session expires, or site data is cleared.
      </p>
    </section>
  );
}
