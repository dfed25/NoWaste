import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  attachOrderStripeSession,
  createReservedOrder,
  systemCancelOrder,
  updateOrderPaymentState,
} from "@/lib/order-store";
import {
  getListingByIdFromStore,
  reserveListingQuantityById,
  restoreListingQuantityById,
} from "@/lib/marketplace-store";

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

function deriveCustomerId(email: string, fallbackId?: string) {
  if (fallbackId && fallbackId.length > 0) return fallbackId;
  return `guest:${email.trim().toLowerCase()}`;
}

function parseCookies(cookieHeader: string) {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((value) => value.trim())
      .filter(Boolean)
      .map((pair) => {
        const index = pair.indexOf("=");
        if (index < 0) return [pair, ""];
        return [pair.slice(0, index), decodeURIComponent(pair.slice(index + 1))];
      }),
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
  if (!stripeSecretKey && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Checkout is temporarily unavailable." },
      { status: 503 },
    );
  }

  const cookieMap = parseCookies(request.headers.get("cookie") ?? "");
  const userIdFromCookie = typeof cookieMap["nw-user-id"] === "string" ? cookieMap["nw-user-id"] : undefined;
  const customerId = deriveCustomerId(body.customer.email, userIdFromCookie);

  const reservedListing = await reserveListingQuantityById(listing.id, quantity);
  if (!reservedListing) {
    return NextResponse.json({ error: "Not enough listing quantity available" }, { status: 400 });
  }

  const order = await createReservedOrder({
    listing: reservedListing,
    quantity,
    customer: body.customer,
    customerId,
  });

  const confirmationUrl = `${appUrl}/orders/confirmation?orderId=${encodeURIComponent(
    order.id,
  )}`;

  if (!stripeSecretKey) {
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

    try {
      const canceled = await systemCancelOrder(order.id, "failed");
      if (!canceled) {
        console.error("Rollback skipped: order already transitioned", { orderId: order.id });
      }
    } catch (rollbackError) {
      console.error("Rollback failed while canceling order:", rollbackError);
    }

    try {
      const restored = await restoreListingQuantityById(reservedListing.id, quantity);
      if (!restored) {
        console.error("Rollback failed while restoring listing inventory", {
          listingId: reservedListing.id,
          quantity,
        });
      }
    } catch (rollbackError) {
      console.error("Rollback threw while restoring listing inventory:", rollbackError);
    }

    return NextResponse.json(
      { error: "Unable to initialize payment session" },
      { status: 502 },
    );
  }

  return NextResponse.json({ checkoutUrl: session.url });
}
