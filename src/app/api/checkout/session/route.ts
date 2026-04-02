import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  attachOrderStripeSession,
  createReservedOrder,
  updateOrderPaymentState,
} from "@/lib/order-store";
import { getListingByIdFromStore, reserveListingQuantityById } from "@/lib/marketplace-store";

type CheckoutBody = {
  listingId: string;
  listingTitle: string;
  quantity: number | string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
};

function resolveAppOrigin(request: Request) {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  try {
    return new URL(request.url).origin;
  } catch {
    throw new Error("Unable to resolve app origin for checkout redirects.");
  }
}

function isValidCheckoutBody(value: unknown): value is CheckoutBody {
  if (!value || typeof value !== "object") return false;
  const body = value as Partial<CheckoutBody>;
  if (typeof body.listingId !== "string" || body.listingId.trim().length === 0) return false;
  if (typeof body.listingTitle !== "string" || body.listingTitle.trim().length === 0) return false;
  if (typeof body.quantity !== "number" && typeof body.quantity !== "string") return false;
  if (!body.customer || typeof body.customer !== "object") return false;

  const customer = body.customer as Partial<CheckoutBody["customer"]>;
  return (
    typeof customer.name === "string" &&
    customer.name.trim().length > 0 &&
    typeof customer.email === "string" &&
    customer.email.trim().length > 0 &&
    typeof customer.phone === "string" &&
    customer.phone.trim().length > 0
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON payload" }, { status: 400 });
  }

  if (!isValidCheckoutBody(body)) {
    return NextResponse.json({ error: "Invalid checkout request" }, { status: 400 });
  }

  const quantity = Number(body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1) {
    return NextResponse.json({ error: "Quantity must be an integer >= 1" }, { status: 400 });
  }

  const listing = await getListingByIdFromStore(body.listingId);
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const appUrl = resolveAppOrigin(request);
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey && process.env.NODE_ENV === "test") {
    return NextResponse.json({
      confirmationUrl: `${appUrl}/orders/confirmation?orderId=test_${encodeURIComponent(
        listing.id,
      )}`,
    });
  }

  const reservedListing = await reserveListingQuantityById(listing.id, quantity);
  if (!reservedListing) {
    return NextResponse.json({ error: "Not enough listing quantity available" }, { status: 400 });
  }

  const order = await createReservedOrder({
    listing: reservedListing,
    quantity,
    customer: body.customer,
  });

  const confirmationUrl = `${appUrl}/orders/confirmation?orderId=${encodeURIComponent(
    order.id,
  )}`;

  if (!stripeSecretKey) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Checkout is temporarily unavailable." },
        { status: 503 },
      );
    }

    await updateOrderPaymentState(order.id, "paid");
    return NextResponse.json({ confirmationUrl });
  }

  const stripe = new Stripe(stripeSecretKey);
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: body.customer.email,
      metadata: {
        orderId: order.id,
        listingId: reservedListing.id,
        customerName: body.customer.name,
        customerPhone: body.customer.phone,
        quantity: String(quantity),
      },
      line_items: [
        {
          quantity,
          price_data: {
            currency: "usd",
            unit_amount: reservedListing.priceCents,
            product_data: {
              name: reservedListing.title,
            },
          },
        },
      ],
      success_url: `${appUrl}/orders/confirmation?orderId=${encodeURIComponent(
        order.id,
      )}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/${encodeURIComponent(reservedListing.id)}?cancelled=1`,
    });

    if (session.id) {
      await attachOrderStripeSession(order.id, session.id);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Stripe API failure";
    console.error("Stripe checkout session create failed:", message);
    return NextResponse.json(
      { error: "Unable to initialize payment session" },
      { status: 502 },
    );
  }

  return NextResponse.json({ checkoutUrl: session.url });
}
