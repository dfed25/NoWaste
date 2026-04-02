import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getListingById } from "@/lib/marketplace";

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

  const listing = getListingById(body.listingId);
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (listing.quantityRemaining < quantity) {
    return NextResponse.json({ error: "Not enough listing quantity available" }, { status: 400 });
  }

  const appUrl = resolveAppOrigin(request);
  const confirmationUrl = `${appUrl}/orders/confirmation?listingId=${encodeURIComponent(
    listing.id,
  )}&quantity=${quantity}`;

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    // Dev fallback so frontend flow remains testable without keys.
    return NextResponse.json({ confirmationUrl });
  }

  const stripe = new Stripe(stripeSecretKey);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: body.customer.email,
    metadata: {
      listingId: listing.id,
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
    )}&quantity=${quantity}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/checkout/${encodeURIComponent(listing.id)}?cancelled=1`,
  });

  return NextResponse.json({ checkoutUrl: session.url });
}

