import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getOrderById,
  hasOrderInventoryRestore,
  markOrderInventoryRestored,
  systemCancelOrder,
  updateOrderPaymentState,
} from "@/lib/order-store";
import { restoreListingQuantityById } from "@/lib/marketplace-store";
import {
  claimStripeEvent,
  markStripeEventProcessed,
  releaseStripeEventClaim,
} from "@/lib/stripe-event-store";

export async function POST(request: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured" },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = new Stripe(stripeSecretKey);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const claim = await claimStripeEvent(event.id, event.type);
  if (claim.duplicate) {
    return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        const updated = await updateOrderPaymentState(orderId, "paid");
        if (!updated) {
          console.warn("Webhook: order not found for checkout.session.completed", {
            orderId,
            eventId: event.id,
          });
        }
      }
    }

    if (
      event.type === "checkout.session.expired" ||
      event.type === "checkout.session.async_payment_failed"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        const canceled = await systemCancelOrder(orderId, "failed");
        const cancellation = canceled ?? (await getOrderById(orderId));

        if (cancellation?.fulfillmentStatus === "canceled") {
          const alreadyRestored = await hasOrderInventoryRestore(cancellation.id);
          if (!alreadyRestored) {
            const restored = await restoreListingQuantityById(
              cancellation.listingId,
              cancellation.quantity,
            );
            if (!restored) {
              throw new Error(
                `Inventory restore returned null for listing ${cancellation.listingId}, quantity ${cancellation.quantity}`,
              );
            }
            await markOrderInventoryRestored(cancellation.id);
          }
        }
      }
    }

    await markStripeEventProcessed(event.id, event.type);
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    await releaseStripeEventClaim(event.id);
    console.error("Stripe webhook side effect failed", {
      eventId: event.id,
      eventType: event.type,
      error,
    });
    return NextResponse.json(
      { error: "Failed to process Stripe webhook event" },
      { status: 500 },
    );
  }
}
