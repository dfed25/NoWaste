import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import Stripe from "stripe";
import { getListingById } from "@/lib/marketplace";
import { createReservedOrder, deleteOrder, getOrderById } from "@/lib/order-store";
import { CUSTOMER_ID_COOKIE_NAME } from "@/lib/auth-cookies";

type CheckoutBody = {
  listingId: string;
  listingTitle: string;
  quantity: number | string;
  /** Reuse an existing reserved order when refreshing the Stripe session (e.g. enable Link). */
  orderId?: string;
  /** When true, Stripe may show Link in Checkout; default hides Link so card / Apple Pay show first. */
  showStripeLink?: boolean;
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
  if (body.orderId !== undefined) {
    if (typeof body.orderId !== "string" || body.orderId.trim().length === 0) return false;
  }
  if (body.showStripeLink !== undefined && typeof body.showStripeLink !== "boolean") return false;
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
  const noHostedCheckout = request.headers.get("x-no-hosted-checkout") === "1";
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
  const showStripeLink = Boolean(body.showStripeLink);
  const reuseOrderId = typeof body.orderId === "string" ? body.orderId.trim() : "";

  let orderId: string;
  if (reuseOrderId) {
    const existing = await getOrderById(reuseOrderId, customerId);
    if (
      !existing ||
      existing.listingId !== body.listingId ||
      existing.quantity !== quantity ||
      existing.fulfillmentStatus !== "reserved" ||
      existing.paymentStatus !== "pending" ||
      existing.totalCents !== listing.priceCents * quantity
    ) {
      return NextResponse.json(
        {
          error:
            "This reservation changed or expired. Go back and tap Continue to payment again.",
        },
        { status: 409 },
      );
    }
    orderId = existing.id;
  } else {
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
  }

  const confirmationUrl = `${appUrl}/orders/confirmation?listingId=${encodeURIComponent(
    listing.id,
  )}&quantity=${quantity}&orderId=${encodeURIComponent(orderId)}`;

  if (!stripeSecretKey) {
    // Dev fallback so frontend flow remains testable without keys.
    return NextResponse.json({ confirmationUrl });
  }

  const returnUrl = `${appUrl}/orders/confirmation?listingId=${encodeURIComponent(
    listing.id,
  )}&quantity=${quantity}&orderId=${encodeURIComponent(orderId)}&session_id={CHECKOUT_SESSION_ID}`;
  const publishableKey =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ||
    process.env.STRIPE_PUBLISHABLE_KEY?.trim() ||
    "";
  const useEmbeddedCheckout = Boolean(publishableKey);
  if (noHostedCheckout && !useEmbeddedCheckout) {
    return NextResponse.json(
      {
        error:
          "In-app checkout requires Stripe embedded mode. Configure STRIPE_PUBLISHABLE_KEY (or NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) on the server and restart.",
      },
      { status: 503 },
    );
  }

  const stripe = new Stripe(stripeSecretKey);
  let session: Stripe.Checkout.Session;
  try {
    const linkWalletOptions: Pick<
      Stripe.Checkout.SessionCreateParams,
      "wallet_options"
    > = showStripeLink
      ? {}
      : { wallet_options: { link: { display: "never" } } };

    const checkoutBranding: Stripe.Checkout.SessionCreateParams.BrandingSettings = {
      display_name: "NoWaste",
      background_color: "#fafaf9",
      button_color: "#16a34a",
      font_family: "inter",
      border_style: "rounded",
    };

    const sessionBase = {
      mode: "payment" as const,
      // Restrict to card rails only (Apple Pay appears under card when enabled in Stripe + device supports it).
      payment_method_types: ["card"] as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
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
    };

    if (useEmbeddedCheckout) {
      session = await stripe.checkout.sessions.create({
        ...sessionBase,
        ...linkWalletOptions,
        branding_settings: checkoutBranding,
        ui_mode: "embedded_page",
        return_url: returnUrl,
      });
    } else {
      session = await stripe.checkout.sessions.create({
        ...sessionBase,
        ...linkWalletOptions,
        branding_settings: checkoutBranding,
        success_url: returnUrl,
        cancel_url: `${appUrl}/checkout/${encodeURIComponent(listing.id)}?cancelled=1`,
      });
    }
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

  if (useEmbeddedCheckout) {
    const clientSecret = session.client_secret;
    if (!clientSecret) {
      try {
        await deleteOrder(orderId, customerId);
      } catch (rollbackError) {
        console.error("Failed to rollback pending order after missing client secret", rollbackError);
      }
      return NextResponse.json(
        { error: "Unable to initialize embedded checkout" },
        { status: 502 },
      );
    }
    return NextResponse.json({
      clientSecret,
      publishableKey,
      orderId,
    });
  }

  return NextResponse.json({ checkoutUrl: session.url, orderId });
}

