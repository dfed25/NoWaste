import { postHostedStripeCheckout } from "@/lib/stripe-hosted-checkout";

/** Legacy path; prefer `/api/checkout_sessions` to match Stripe’s sample layout. */
export async function POST(request: Request) {
  return postHostedStripeCheckout(request);
}
