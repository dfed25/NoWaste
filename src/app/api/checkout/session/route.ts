import { NextResponse } from "next/server";
import Stripe from "stripe";

type CheckoutBody = {
  listingId: string;
  listingTitle: string;
  quantity: number;
  unitPriceCents: number;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
};

export async function POST(request: Request) {
  const body = (await request.json()) as CheckoutBody;

  const quantity = Number(body.quantity || 1);
  if (!body.listingId || !body.listingTitle || quantity < 1) {
    return NextResponse.json({ error: "Invalid checkout request" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const confirmationUrl = `${appUrl}/orders/confirmation?listingId=${encodeURIComponent(
    body.listingId,
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
      listingId: body.listingId,
      customerName: body.customer.name,
      customerPhone: body.customer.phone,
      quantity: String(quantity),
    },
    line_items: [
      {
        quantity,
        price_data: {
          currency: "usd",
          unit_amount: body.unitPriceCents,
          product_data: {
            name: body.listingTitle,
          },
        },
      },
    ],
    success_url: `${appUrl}/orders/confirmation?listingId=${encodeURIComponent(
      body.listingId,
    )}&quantity=${quantity}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/checkout/${encodeURIComponent(body.listingId)}?cancelled=1`,
  });

  return NextResponse.json({ checkoutUrl: session.url });
}

