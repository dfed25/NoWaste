import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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
import {
  createCustomerId,
  encodeSignedCustomerId,
  getCustomerIdCookieName,
  parseCustomerIdCookie,
  parseCustomerIdCookieFromCookieHeader,
} from "@/lib/customer-id-cookie";

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

type CustomerCookieResult = {
  customerId?: string;
  needsResign: boolean;
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

function deriveCustomerId(existingCustomerId?: string) {
  if (existingCustomerId && existingCustomerId.length > 0) return existingCustomerId;
  return createCustomerId();
}

async function readUserIdFromCookie(request: Request): Promise<CustomerCookieResult> {
  try {
    const cookieStore = await cookies();
    const value = cookieStore.get(getCustomerIdCookieName())?.value;
    const parsed = parseCustomerIdCookie(value);
    if (parsed.customerId) return parsed;
  } catch {
    // During direct route unit tests there may be no request scope for cookies().
  }

  return parseCustomerIdCookieFromCookieHeader(request);
}

function withCustomerCookie(response: NextResponse, customerId: string, shouldSetCookie: boolean) {
  if (!shouldSetCookie) return response;

  const encoded = encodeSignedCustomerId(customerId);
  if (!encoded) {
    console.error("Unable to set customer identity cookie because session secret is missing.");
    return response;
  }

  response.cookies.set(getCustomerIdCookieName(), encoded, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
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

  const customerCookie = await readUserIdFromCookie(request);
  const customerId = deriveCustomerId(customerCookie.customerId);
  const shouldSetCustomerCookie = !customerCookie.customerId || customerCookie.needsResign;

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
    const response = NextResponse.json({ confirmationUrl });
    return withCustomerCookie(response, customerId, shouldSetCustomerCookie);
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

  const response = NextResponse.json({ checkoutUrl: session.url });
  return withCustomerCookie(response, customerId, shouldSetCustomerCookie);
}
