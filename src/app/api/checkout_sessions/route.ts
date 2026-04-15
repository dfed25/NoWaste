import { postHostedStripeCheckout } from "@/lib/stripe-hosted-checkout";

/** Stripe sample path: `POST /api/checkout_sessions` */
export async function POST(request: Request) {
  return postHostedStripeCheckout(request);
}
