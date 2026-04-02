import { NextResponse } from "next/server";
import { listings, type ListingItem } from "@/lib/marketplace";
import { listingSchema } from "@/lib/validation";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON payload" }, { status: 400 });
  }

  const parsed = listingSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid listing payload" },
      { status: 400 },
    );
  }

  const values = parsed.data;
  const created: ListingItem = {
    id: `l_${Date.now()}`,
    title: values.title,
    description: values.description,
    restaurantId: "r1",
    restaurantName: "Green Fork Kitchen",
    distanceMiles: 1.2,
    pickupWindowStart: new Date(values.pickupWindowStart).toISOString(),
    pickupWindowEnd: new Date(values.pickupWindowEnd).toISOString(),
    dietary: [],
    priceCents: values.discountedPriceCents,
    quantityRemaining: values.quantityTotal,
    allergyNotes: values.allergyNotes,
  };

  listings.unshift(created);
  return NextResponse.json({ ok: true, listingId: created.id }, { status: 201 });
}

