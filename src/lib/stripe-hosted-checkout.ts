import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

type AllowedCountry =
  Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry;

function parseQuantity(value: unknown): number {
  const n = parseInt(String(value ?? "1"), 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(99, n);
}

function parseEmail(value: unknown): string | null {
  const s = String(value ?? "").trim();
  if (!s) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return null;
  return s;
}

function parseEmailFromForm(value: FormDataEntryValue | null): string | null {
  return parseEmail(value);
}

function wantsJsonResponse(request: Request, contentType: string): boolean {
  return (
    contentType.includes("application/json") ||
    (request.headers.get("accept") ?? "").includes("application/json")
  );
}

/**
 * Tutorial checkout:
 * - **Embedded** (payment UI stays in your WebView) when `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set — POST JSON only, returns `{ clientSecret }`.
 * - **Hosted** (redirect to stripe.com) when publishable key is omitted — form POST returns 303, JSON POST returns `{ checkoutUrl }` for `window.location.assign`.
 */
export async function postHostedStripeCheckout(request: Request): Promise<Response> {
  try {
    const secret = process.env.STRIPE_SECRET_KEY?.trim();
    const priceId = process.env.STRIPE_CHECKOUT_PRICE_ID?.trim();
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
    const useEmbedded = Boolean(publishableKey);

    if (!secret) {
      return NextResponse.json({ error: "STRIPE_SECRET_KEY is not configured" }, { status: 503 });
    }
    if (!priceId) {
      return NextResponse.json(
        { error: "STRIPE_CHECKOUT_PRICE_ID is not configured (create a Price in Stripe Dashboard)" },
        { status: 503 },
      );
    }

    const contentType = request.headers.get("content-type") ?? "";
    let customerEmail: string;
    let quantity: number;

    if (contentType.includes("application/json")) {
      const body = (await request.json().catch(() => ({}))) as {
        customer_email?: string;
        quantity?: unknown;
      };
      const parsed = parseEmail(body.customer_email ?? null);
      customerEmail =
        parsed ??
        process.env.STRIPE_CHECKOUT_DEMO_EMAIL?.trim() ??
        "customer@example.com";
      quantity = parseQuantity(body.quantity);
    } else {
      const formData = await request.formData().catch(() => null);
      const parsed = parseEmailFromForm(formData?.get("customer_email") ?? null);
      customerEmail =
        parsed ??
        process.env.STRIPE_CHECKOUT_DEMO_EMAIL?.trim() ??
        "customer@example.com";
      quantity = parseQuantity(formData?.get("quantity") ?? null);
    }

    if (useEmbedded && !contentType.includes("application/json")) {
      return NextResponse.json(
        {
          error:
            "In-app checkout expects JSON. Open /checkout/preview or /stripe-sample in the app, or add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.",
        },
        { status: 400 },
      );
    }

    const headersList = await headers();
    const originHeader = headersList.get("origin");
    const origin =
      originHeader?.trim() ||
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      "http://localhost:3000";

    const returningCustomerId = process.env.STRIPE_CHECKOUT_CUSTOMER_ID?.trim();
    const stripe = getStripe();

    const shared = {
      ...(returningCustomerId
        ? { customer: returningCustomerId }
        : { customer_email: customerEmail }),
      customer_creation: returningCustomerId ? undefined : ("always" as const),
      submit_type: "pay" as const,
      billing_address_collection: "auto" as const,
      shipping_address_collection: {
        allowed_countries: ["US", "CA"] as AllowedCountry[],
      },
      line_items: [
        {
          price: priceId,
          quantity,
        },
      ],
      mode: "payment" as const,
      automatic_tax: { enabled: true },
      metadata: {
        app: "nowaste",
        flow: "tutorial_checkout",
        quantity: String(quantity),
      },
    };

    if (useEmbedded) {
      const session = await stripe.checkout.sessions.create({
        ...shared,
        ui_mode: "embedded_page",
        return_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      });
      const clientSecret = session.client_secret;
      if (!clientSecret) {
        return NextResponse.json({ error: "Unable to initialize embedded checkout" }, { status: 502 });
      }
      return NextResponse.json({ clientSecret });
    }

    const session = await stripe.checkout.sessions.create({
      ...shared,
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancelled`,
    });

    const url = session.url;
    if (!url) {
      return NextResponse.json({ error: "Checkout session has no URL" }, { status: 502 });
    }

    if (wantsJsonResponse(request, contentType)) {
      return NextResponse.json({ checkoutUrl: url });
    }

    return NextResponse.redirect(url, 303);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    const statusCode =
      typeof err === "object" &&
      err !== null &&
      "statusCode" in err &&
      typeof (err as { statusCode?: number }).statusCode === "number"
        ? (err as { statusCode: number }).statusCode
        : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
