import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  canCancelOrder,
  generatePickupCode,
  mockOrders,
  type CustomerOrder,
  type ListingItem,
} from "@/lib/marketplace";

const DATA_DIR = path.join(process.cwd(), ".nowaste-data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
let writeQueue: Promise<unknown> = Promise.resolve();

export type OrderRecord = CustomerOrder & {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  stripeSessionId?: string;
};

function runExclusive<T>(operation: () => Promise<T>) {
  const next = writeQueue.then(operation, operation);
  writeQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

async function readPersistedOrders(): Promise<OrderRecord[]> {
  try {
    const raw = await readFile(ORDERS_FILE, "utf8");
    const parsed = JSON.parse(raw) as OrderRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return [];
    console.error(`Failed reading orders at ${ORDERS_FILE}:`, err.message);
    throw err;
  }
}

async function writePersistedOrders(next: OrderRecord[]) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(ORDERS_FILE, JSON.stringify(next, null, 2), "utf8");
}

export async function listAllOrders(): Promise<OrderRecord[]> {
  return runExclusive(async () => {
    const persisted = await readPersistedOrders();
    const seen = new Set<string>();
    return [...persisted, ...mockOrders].filter((order) => {
      if (seen.has(order.id)) return false;
      seen.add(order.id);
      return true;
    });
  });
}

export async function getOrderById(orderId: string): Promise<OrderRecord | null> {
  const orders = await listAllOrders();
  return orders.find((order) => order.id === orderId) ?? null;
}

export async function createReservedOrder(input: {
  listing: ListingItem;
  quantity: number;
  customer: { name: string; email: string; phone: string };
}): Promise<OrderRecord> {
  return runExclusive(async () => {
    const persisted = await readPersistedOrders();
    const id = `ord_${randomUUID()}`;
    const order: OrderRecord = {
      id,
      listingId: input.listing.id,
      listingTitle: input.listing.title,
      totalCents: input.listing.priceCents * input.quantity,
      quantity: input.quantity,
      pickupWindowStart: input.listing.pickupWindowStart,
      pickupWindowEnd: input.listing.pickupWindowEnd,
      createdAt: new Date().toISOString(),
      fulfillmentStatus: "reserved",
      paymentStatus: "pending",
      reservationCode: generatePickupCode(id),
      customerName: input.customer.name,
      customerEmail: input.customer.email,
      customerPhone: input.customer.phone,
    };

    await writePersistedOrders([order, ...persisted]);
    return order;
  });
}

export async function attachOrderStripeSession(orderId: string, sessionId: string) {
  return runExclusive(async () => {
    const persisted = await readPersistedOrders();
    const index = persisted.findIndex((order) => order.id === orderId);
    if (index < 0) return null;
    const updated: OrderRecord = {
      ...persisted[index],
      stripeSessionId: sessionId,
    };
    const next = [...persisted];
    next[index] = updated;
    await writePersistedOrders(next);
    return updated;
  });
}

export async function findOrderByStripeSessionId(sessionId: string) {
  const orders = await listAllOrders();
  return orders.find((order) => order.stripeSessionId === sessionId) ?? null;
}

export async function updateOrderPaymentState(
  orderId: string,
  paymentStatus: OrderRecord["paymentStatus"],
): Promise<OrderRecord | null> {
  return runExclusive(async () => {
    const persisted = await readPersistedOrders();
    const index = persisted.findIndex((order) => order.id === orderId);
    if (index < 0) return null;

    const nextOrder: OrderRecord = { ...persisted[index], paymentStatus };
    const next = [...persisted];
    next[index] = nextOrder;
    await writePersistedOrders(next);
    return nextOrder;
  });
}

export async function cancelOrderIfAllowed(orderId: string): Promise<OrderRecord | null> {
  return runExclusive(async () => {
    const persisted = await readPersistedOrders();
    const index = persisted.findIndex((order) => order.id === orderId);
    if (index < 0) return null;

    const current = persisted[index];
    if (!canCancelOrder(current)) return null;

    const updated: OrderRecord = {
      ...current,
      fulfillmentStatus: "canceled",
      paymentStatus: "refunded",
    };
    const next = [...persisted];
    next[index] = updated;
    await writePersistedOrders(next);
    return updated;
  });
}


export async function systemCancelOrder(
  orderId: string,
  paymentStatus: OrderRecord["paymentStatus"],
): Promise<OrderRecord | null> {
  return runExclusive(async () => {
    const persisted = await readPersistedOrders();
    const index = persisted.findIndex((order) => order.id === orderId);
    if (index < 0) return null;

    const current = persisted[index];
    if (current.fulfillmentStatus !== "reserved") return current;

    const updated: OrderRecord = {
      ...current,
      fulfillmentStatus: "canceled",
      paymentStatus,
    };
    const next = [...persisted];
    next[index] = updated;
    await writePersistedOrders(next);
    return updated;
  });
}
