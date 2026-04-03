import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, rm } from "node:fs/promises";
import path from "node:path";
import type { CustomerOrder } from "@/lib/marketplace";
import {
  generatePickupCode,
  getOrdersForCustomer as getMockOrders,
  resolveRestaurantIdForOrder,
} from "@/lib/marketplace";

const DATA_DIR = path.join(process.cwd(), ".nowaste-data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const ORDER_INVENTORY_RESTORES_FILE = path.join(DATA_DIR, "order-inventory-restores.json");
const CANCEL_CUTOFF_MS = 30 * 60 * 1000;

let writeQueue: Promise<unknown> = Promise.resolve();

type InventoryRestoreMap = Record<string, string>;

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
    value === "expired" ||
    value === "canceled"
  );
}

function isPaymentStatus(value: unknown): value is CustomerOrder["paymentStatus"] {
  return value === "paid" || value === "refunded" || value === "pending" || value === "failed";
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
    (order.restaurantId === undefined || typeof order.restaurantId === "string") &&
    (order.restaurantName === undefined || typeof order.restaurantName === "string") &&
    (order.currency === undefined || typeof order.currency === "string") &&
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

async function readInventoryRestores(): Promise<InventoryRestoreMap> {
  try {
    const raw = await readFile(ORDER_INVENTORY_RESTORES_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as InventoryRestoreMap;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return {};
    console.error(`Failed reading inventory restores from ${ORDER_INVENTORY_RESTORES_FILE}:`, err.message);
    throw err;
  }
}

async function writeInventoryRestores(next: InventoryRestoreMap) {
  await mkdir(DATA_DIR, { recursive: true });
  const tempFile = `${ORDER_INVENTORY_RESTORES_FILE}.${randomUUID()}.tmp`;
  const payload = JSON.stringify(next, null, 2);
  let handle: Awaited<ReturnType<typeof open>> | null = null;
  try {
    handle = await open(tempFile, "w");
    await handle.writeFile(payload, "utf8");
    await handle.sync();
    await handle.close();
    handle = null;
    await rename(tempFile, ORDER_INVENTORY_RESTORES_FILE);
  } finally {
    if (handle) {
      await handle.close().catch(() => undefined);
    }
    await rm(tempFile, { force: true }).catch(() => undefined);
  }
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

/**
 * Reservations for a restaurant (persisted orders only).
 */
export async function listOrdersForRestaurant(restaurantId: string): Promise<CustomerOrder[]> {
  const persisted = await readPersistedOrders();
  const scoped = persisted.filter((order) => resolveRestaurantIdForOrder(order) === restaurantId);
  return sortOrdersByCreatedAtDesc(scoped);
}

export async function getOrderByIdUnscoped(orderId: string): Promise<CustomerOrder | null> {
  const orders = await readPersistedOrders();
  return orders.find((order) => order.id === orderId) ?? null;
}

export async function getOrderById(orderId: string, customerId?: string) {
  const orders = await readPersistedOrders();
  return orders.find((order) => order.id === orderId && (!customerId || order.customerId === customerId)) ?? null;
}

export async function createReservedOrder(input: {
  customerId: string;
  listingId: string;
  listingTitle: string;
  restaurantId: string;
  restaurantName: string;
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
      restaurantId: input.restaurantId,
      restaurantName: input.restaurantName,
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

export async function updateOrderFulfillment(
  orderId: string,
  next: "picked_up" | "missed_pickup",
): Promise<CustomerOrder | null> {
  return runExclusive(async () => {
    const orders = await readPersistedOrders();
    const index = orders.findIndex((order) => order.id === orderId);
    if (index < 0) return null;
    const current = orders[index];
    if (current.fulfillmentStatus !== "reserved") return null;
    const updated: CustomerOrder = {
      ...current,
      fulfillmentStatus: next,
    };
    orders[index] = updated;
    await writePersistedOrders(orders);
    return updated;
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
    return updated;
  });
}

export async function updateOrderPaymentState(
  orderId: string,
  paymentStatus: CustomerOrder["paymentStatus"],
): Promise<CustomerOrder | null> {
  return updateOrderPaymentStatus(orderId, paymentStatus);
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
  });
}


export async function systemCancelOrder(
  orderId: string,
  paymentStatus: CustomerOrder["paymentStatus"],
): Promise<CustomerOrder | null> {
  return runExclusive(async () => {
    const orders = await readPersistedOrders();
    const index = orders.findIndex((order) => order.id === orderId);
    if (index < 0) return null;

    const current = orders[index];
    if (current.fulfillmentStatus !== "reserved") return null;

    const updated: CustomerOrder = {
      ...current,
      fulfillmentStatus: "canceled",
      paymentStatus,
    };
    orders[index] = updated;
    await writePersistedOrders(orders);
    return updated;
  });
}
