import { LoginForm } from "@/components/auth/login-form";
import {
  isReturnToRestaurantOnboarding,
  pickFirstSearchParam,
  sanitizeAuthNextParam,
} from "@/lib/auth/safe-next-path";

type PageProps = {
  searchParams: Promise<{ next?: string | string[]; role?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const sanitizedNext = sanitizeAuthNextParam(pickFirstSearchParam(sp.next));
  const returnToOnboarding = isReturnToRestaurantOnboarding(sanitizedNext);

  return (
    <section className="min-w-0 space-y-2">
      <h1 className="text-title-md">Log in</h1>
      <p className="text-body-sm text-neutral-600">
        {returnToOnboarding
          ? "Sign in to continue restaurant setup. We’ll send you back to your location profile."
          : "Sign in to access protected marketplace routes."}
      </p>
      <LoginForm returnToRestaurantOnboarding={returnToOnboarding} />
    </section>
  );
}

