import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import Stripe from "stripe";
import { getListingById } from "@/lib/marketplace";
import { createReservedOrder, deleteOrder } from "@/lib/order-store";
import { CUSTOMER_ID_COOKIE_NAME } from "@/lib/auth-cookies";

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

function readUserIdFromCookie(request: Request) {
  try {
    return cookies().then((cookieStore) => cookieStore.get(CUSTOMER_ID_COOKIE_NAME)?.value);
  } catch {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const match = cookieHeader.match(
      new RegExp(`(?:^|;\\s*)${CUSTOMER_ID_COOKIE_NAME}=([^;]+)`),
    );
    if (!match?.[1]) return Promise.resolve(undefined);
    try {
      return Promise.resolve(decodeURIComponent(match[1]));
    } catch {
      return Promise.resolve(match[1]);
    }
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

  const listing = getListingById(body.listingId);
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (listing.quantityRemaining < quantity) {
    return NextResponse.json({ error: "Not enough listing quantity available" }, { status: 400 });
  }

  const appUrl = resolveAppOrigin(request);
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Checkout is temporarily unavailable." },
      { status: 503 },
    );
  }
  const customerId = (await readUserIdFromCookie(request)) ?? "demo-customer";
  let orderId: string;
  try {
    const order = await createReservedOrder({
      customerId,
      listingId: listing.id,
      listingTitle: listing.title,
      restaurantId: listing.restaurantId,
      restaurantName: listing.restaurantName,
      quantity,
      totalCents: listing.priceCents * quantity,
      pickupWindowStart: listing.pickupWindowStart,
      pickupWindowEnd: listing.pickupWindowEnd,
      paymentStatus: stripeSecretKey ? "pending" : "paid",
    });
    orderId = order.id;
  } catch (error) {
    console.error("Failed to create reserved order before checkout", error);
    return NextResponse.json({ error: "Unable to create reservation" }, { status: 500 });
  }

  const confirmationUrl = `${appUrl}/orders/confirmation?listingId=${encodeURIComponent(
    listing.id,
  )}&quantity=${quantity}&orderId=${encodeURIComponent(orderId)}`;

  if (!stripeSecretKey) {
    // Dev fallback so frontend flow remains testable without keys.
    return NextResponse.json({ confirmationUrl });
  }

  const stripe = new Stripe(stripeSecretKey);
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: body.customer.email,
      metadata: {
        listingId: listing.id,
        orderId,
        customerName: body.customer.name,
        customerPhone: body.customer.phone,
        quantity: String(quantity),
      },
      line_items: [
        {
          quantity,
          price_data: {
            currency: "usd",
            unit_amount: listing.priceCents,
            product_data: {
              name: listing.title,
            },
          },
        },
      ],
      success_url: `${appUrl}/orders/confirmation?listingId=${encodeURIComponent(
        listing.id,
      )}&quantity=${quantity}&orderId=${encodeURIComponent(orderId)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/${encodeURIComponent(listing.id)}?cancelled=1`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Stripe API failure";
    console.error("Stripe checkout session create failed:", message);
    try {
      await deleteOrder(orderId, customerId);
    } catch (rollbackError) {
      console.error("Failed to rollback pending order after Stripe failure", rollbackError);
    }
    return NextResponse.json(
      { error: "Unable to initialize payment session" },
      { status: 502 },
    );
  }

  return NextResponse.json({ checkoutUrl: session.url });
}

