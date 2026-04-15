import "server-only";

import Stripe from "stripe";

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  cached ??= new Stripe(key, { typescript: true });
  return cached;
}

/**
 * Stripe’s Next.js samples use `import { stripe } from '@/lib/stripe'`.
 * Lazily delegates to the same client as {@link getStripe}.
 */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getStripe(), prop, receiver);
  },
});
