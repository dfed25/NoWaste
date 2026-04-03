import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, rm } from "node:fs/promises";
import path from "node:path";
import type { CustomerOrder } from "@/lib/marketplace";
import { generatePickupCode, getOrdersForCustomer as getMockOrders } from "@/lib/marketplace";

const DATA_DIR = path.join(process.cwd(), ".nowaste-data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const CANCEL_CUTOFF_MS = 30 * 60 * 1000;

let writeQueue: Promise<unknown> = Promise.resolve();

/**
 * Serialize file writes by chaining each operation onto writeQueue.
 * Errors from an operation are returned to the caller, while the queue itself
 * always resolves so subsequent writes are not blocked.
 */
function runExclusive<T>(operation: () => Promise<T>) {
  const next = writeQueue.then(operation, operation);
  writeQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

function isOrderStatus(value: unknown): value is CustomerOrder["fulfillmentStatus"] {
  return (
    value === "reserved" ||
    value === "picked_up" ||
    value === "missed_pickup" ||
    value === "expired"
  );
}

function isPaymentStatus(value: unknown): value is CustomerOrder["paymentStatus"] {
  return value === "paid" || value === "refunded" || value === "pending";
}

function isValidOrderRecord(value: unknown): value is CustomerOrder {
  if (!value || typeof value !== "object") return false;
  const order = value as Record<string, unknown>;
  return (
    typeof order.id === "string" &&
    order.id.length > 0 &&
    (order.customerId === undefined || typeof order.customerId === "string") &&
    typeof order.listingId === "string" &&
    typeof order.listingTitle === "string" &&
    typeof order.totalCents === "number" &&
    Number.isFinite(order.totalCents) &&
    typeof order.quantity === "number" &&
    Number.isFinite(order.quantity) &&
    typeof order.pickupWindowStart === "string" &&
    typeof order.pickupWindowEnd === "string" &&
    typeof order.createdAt === "string" &&
    typeof order.reservationCode === "string" &&
    isOrderStatus(order.fulfillmentStatus) &&
    isPaymentStatus(order.paymentStatus)
  );
}

async function readPersistedOrders(): Promise<CustomerOrder[]> {
  try {
    const raw = await readFile(ORDERS_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((order): order is CustomerOrder => isValidOrderRecord(order));
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return [];
    console.error(`Failed reading orders from ${ORDERS_FILE}:`, err.message);
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  canCancelOrder,
  generatePickupCode,
  mockOrders,
  type CustomerOrder,
  type ListingItem,
} from "@/lib/marketplace";
import { createRunExclusive } from "@/lib/file-queue";

const DATA_DIR = path.join(process.cwd(), ".nowaste-data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const ORDER_INVENTORY_RESTORES_FILE = path.join(DATA_DIR, "order-inventory-restores.json");

const runExclusive = createRunExclusive();

export type OrderRecord = CustomerOrder;
type InventoryRestoreMap = Record<string, string>;

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

async function writePersistedOrders(next: CustomerOrder[]) {
  await mkdir(DATA_DIR, { recursive: true });
  const tempFile = `${ORDERS_FILE}.${randomUUID()}.tmp`;
  const payload = JSON.stringify(next, null, 2);
  let handle: Awaited<ReturnType<typeof open>> | null = null;
  try {
    handle = await open(tempFile, "w");
    await handle.writeFile(payload, "utf8");
    await handle.sync();
    await handle.close();
    handle = null;
    await rename(tempFile, ORDERS_FILE);
  } finally {
    if (handle) {
      await handle.close().catch(() => undefined);
    }
    await rm(tempFile, { force: true }).catch(() => undefined);
  }
}

function sortOrdersByCreatedAtDesc(orders: CustomerOrder[]) {
  return [...orders].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return bTime - aTime;
  });
}

/**
 * Returns orders sorted by newest first, using mock data only until the first
 * persisted order exists for the customer.
 */
export async function listOrdersForCustomer(customerId: string): Promise<CustomerOrder[]> {
  const persisted = await readPersistedOrders();
  const scoped = persisted.filter((order) => order.customerId === customerId);
  if (scoped.length > 0) {
    return sortOrdersByCreatedAtDesc(scoped);
  }
  return sortOrdersByCreatedAtDesc(getMockOrders(customerId));
}

export async function getOrderById(orderId: string, customerId: string) {
  const orders = await readPersistedOrders();
  return orders.find((order) => order.id === orderId && order.customerId === customerId) ?? null;
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
    const id = `ord_${randomUUID()}`;
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

export async function deleteOrder(orderId: string, customerId: string): Promise<boolean> {
  return runExclusive(async () => {
    const orders = await readPersistedOrders();
    const next = orders.filter(
      (order) => !(order.id === orderId && order.customerId === customerId),
    );
    if (next.length === orders.length) return false;
    await writePersistedOrders(next);
    return true;
  });
}

export async function updateOrderPaymentStatus(
  orderId: string,
  nextStatus: CustomerOrder["paymentStatus"],
): Promise<CustomerOrder | null> {
  return runExclusive(async () => {
    const orders = await readPersistedOrders();
    const index = orders.findIndex((order) => order.id === orderId);
    if (index < 0) return null;
    const current = orders[index];
    if (current.paymentStatus === nextStatus) return current;
    const updated: CustomerOrder = {
      ...current,
      paymentStatus: nextStatus,
    };
    orders[index] = updated;
    await writePersistedOrders(orders);
async function writePersistedOrders(next: OrderRecord[]) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(ORDERS_FILE, JSON.stringify(next, null, 2), "utf8");
}

async function readInventoryRestores(): Promise<InventoryRestoreMap> {
  try {
    const raw = await readFile(ORDER_INVENTORY_RESTORES_FILE, "utf8");
    const parsed = JSON.parse(raw) as InventoryRestoreMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return {};
    console.error(`Failed reading inventory restores at ${ORDER_INVENTORY_RESTORES_FILE}:`, err.message);
    throw err;
  }
}

async function writeInventoryRestores(next: InventoryRestoreMap) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(ORDER_INVENTORY_RESTORES_FILE, JSON.stringify(next, null, 2), "utf8");
}

export async function hasOrderInventoryRestore(orderId: string): Promise<boolean> {
  return runExclusive(async () => {
    const restores = await readInventoryRestores();
    return Boolean(restores[orderId]);
  });
}

export async function markOrderInventoryRestored(orderId: string) {
  return runExclusive(async () => {
    const restores = await readInventoryRestores();
    restores[orderId] = new Date().toISOString();
    await writeInventoryRestores(restores);
  });
}

export async function checkAndMarkOrderInventoryRestored(orderId: string): Promise<boolean> {
  return runExclusive(async () => {
    const restores = await readInventoryRestores();
    if (restores[orderId]) return false;
    restores[orderId] = new Date().toISOString();
    await writeInventoryRestores(restores);
    return true;
  });
}

export async function clearOrderInventoryRestore(orderId: string) {
  return runExclusive(async () => {
    const restores = await readInventoryRestores();
    if (!restores[orderId]) return;
    delete restores[orderId];
    await writeInventoryRestores(restores);
  });
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

export async function getOrdersForCustomer(customerId?: string): Promise<OrderRecord[]> {
  const orders = await listAllOrders();
  if (!customerId) return [];
  return orders.filter((order) => order.customerId === customerId);
}

export async function getOrderById(orderId: string): Promise<OrderRecord | null> {
  const orders = await listAllOrders();
  return orders.find((order) => order.id === orderId) ?? null;
}

export async function createReservedOrder(input: {
  listing: ListingItem;
  quantity: number;
  customer: { name: string; email: string; phone: string };
  customerId: string;
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
      customerId: input.customerId,
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
      paymentStatus: current.paymentStatus === "paid" ? "refunded" : "failed",
    };
    const next = [...persisted];
    next[index] = updated;
    await writePersistedOrders(next);
    return updated;
  });
}

export async function cancelOrder(orderId: string, customerId: string) {
  return runExclusive(async () => {
    const orders = await readPersistedOrders();
    const index = orders.findIndex((order) => order.id === orderId && order.customerId === customerId);
    if (index < 0) return null;
    const order = orders[index];
    if (order.fulfillmentStatus !== "reserved") return null;
    const pickupTs = new Date(order.pickupWindowStart).getTime();
    if (!Number.isFinite(pickupTs)) return null;
    if (pickupTs - Date.now() <= CANCEL_CUTOFF_MS) return null;

    const canceled: CustomerOrder = {
      ...order,
      // Use "expired" as the canceled terminal state in the current order model.
      fulfillmentStatus: "expired",
      paymentStatus: order.paymentStatus === "paid" ? "refunded" : order.paymentStatus,
    };
    orders[index] = canceled;
    await writePersistedOrders(orders);
    return canceled;
export async function systemCancelOrder(
  orderId: string,
  paymentStatus: OrderRecord["paymentStatus"],
): Promise<OrderRecord | null> {
  return runExclusive(async () => {
    const persisted = await readPersistedOrders();
    const index = persisted.findIndex((order) => order.id === orderId);
    if (index < 0) return null;

    const current = persisted[index];
    if (current.fulfillmentStatus !== "reserved") return null;

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
