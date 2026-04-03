import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CustomerOrder } from "@/lib/marketplace";
import { generatePickupCode, getOrdersForCustomer as getMockOrders } from "@/lib/marketplace";

const DATA_DIR = path.join(process.cwd(), ".nowaste-data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

let writeQueue: Promise<unknown> = Promise.resolve();

function runExclusive<T>(operation: () => Promise<T>) {
  const next = writeQueue.then(operation, operation);
  writeQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

async function readPersistedOrders(): Promise<CustomerOrder[]> {
  try {
    const raw = await readFile(ORDERS_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((order): order is CustomerOrder => Boolean(order && typeof order === "object"));
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return [];
    console.error(`Failed reading orders from ${ORDERS_FILE}:`, err.message);
    throw err;
  }
}

async function writePersistedOrders(next: CustomerOrder[]) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(ORDERS_FILE, JSON.stringify(next, null, 2), "utf8");
}

function sortOrdersByCreatedAtDesc(orders: CustomerOrder[]) {
  return [...orders].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return bTime - aTime;
  });
}

export async function listOrdersForCustomer(customerId: string): Promise<CustomerOrder[]> {
  const persisted = await readPersistedOrders();
  const scoped = persisted.filter((order) => order.customerId === customerId);
  if (scoped.length > 0) {
    return sortOrdersByCreatedAtDesc(scoped);
  }
  return sortOrdersByCreatedAtDesc(getMockOrders(customerId));
}

export async function createReservedOrder(input: {
  customerId: string;
  listingId: string;
  listingTitle: string;
  quantity: number;
  totalCents: number;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  paymentStatus: CustomerOrder["paymentStatus"];
}) {
  return runExclusive(async () => {
    const orders = await readPersistedOrders();
    const id = `ord_${randomUUID().slice(0, 12)}`;
    const reservationCode = generatePickupCode(id);
    const created: CustomerOrder = {
      id,
      customerId: input.customerId,
      listingId: input.listingId,
      listingTitle: input.listingTitle,
      quantity: input.quantity,
      totalCents: input.totalCents,
      pickupWindowStart: input.pickupWindowStart,
      pickupWindowEnd: input.pickupWindowEnd,
      createdAt: new Date().toISOString(),
      fulfillmentStatus: "reserved",
      paymentStatus: input.paymentStatus,
      reservationCode,
    };
    await writePersistedOrders([created, ...orders]);
    return created;
  });
}

export async function cancelOrder(orderId: string, customerId: string) {
  return runExclusive(async () => {
    const orders = await readPersistedOrders();
    const index = orders.findIndex((order) => order.id === orderId && order.customerId === customerId);
    if (index < 0) return null;
    const order = orders[index];
    if (order.fulfillmentStatus !== "reserved") return null;

    const canceled: CustomerOrder = {
      ...order,
      // Use "expired" as the canceled terminal state in the current order model.
      fulfillmentStatus: "expired",
      paymentStatus: "refunded",
    };
    orders[index] = canceled;
    await writePersistedOrders(orders);
    return canceled;
  });
}
