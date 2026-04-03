import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRunExclusive } from "@/lib/file-queue";

type StripeEventStatus = "claimed" | "processed";

type ProcessedStripeEvent = {
  id: string;
  type: string;
  status: StripeEventStatus;
  claimedAt: string;
  processedAt?: string;
};

type StripeEventMap = Record<string, ProcessedStripeEvent>;

const DATA_DIR = path.join(process.cwd(), ".nowaste-data");
const STRIPE_EVENTS_FILE = path.join(DATA_DIR, "stripe-events.json");
const CLAIM_TTL_MS = 5 * 60 * 1000;
const runExclusive = createRunExclusive();

async function readProcessedEvents(): Promise<StripeEventMap> {
  try {
    const raw = await readFile(STRIPE_EVENTS_FILE, "utf8");
    const parsed = JSON.parse(raw) as StripeEventMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return {};
    console.error(`Failed reading Stripe event map at ${STRIPE_EVENTS_FILE}:`, err.message);
    throw err;
  }
}

async function writeProcessedEvents(next: StripeEventMap) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(STRIPE_EVENTS_FILE, JSON.stringify(next, null, 2), "utf8");
}

export async function claimStripeEvent(
  eventId: string,
  type: string,
): Promise<{ duplicate: boolean }> {
  return runExclusive(async () => {
    const map = await readProcessedEvents();
    const existing = map[eventId];
    const now = new Date();

    if (existing?.status === "processed") {
      return { duplicate: true };
    }

    if (existing?.status === "claimed") {
      const claimedAtTs = Number(new Date(existing.claimedAt));
      if (Number.isFinite(claimedAtTs) && now.getTime() - claimedAtTs < CLAIM_TTL_MS) {
        return { duplicate: true };
      }
    }

    map[eventId] = {
      id: eventId,
      type,
      status: "claimed",
      claimedAt: now.toISOString(),
    };
    await writeProcessedEvents(map);
    return { duplicate: false };
  });
}

export async function hasProcessedStripeEvent(eventId: string): Promise<boolean> {
  return runExclusive(async () => {
    const map = await readProcessedEvents();
    return map[eventId]?.status === "processed";
  });
}

export async function markStripeEventProcessed(eventId: string, type: string) {
  return runExclusive(async () => {
    const map = await readProcessedEvents();
    const existing = map[eventId];
    const now = new Date().toISOString();
    map[eventId] = {
      id: eventId,
      type,
      status: "processed",
      claimedAt: existing?.claimedAt ?? now,
      processedAt: now,
    };
    await writeProcessedEvents(map);
  });
}

export async function releaseStripeEventClaim(eventId: string) {
  return runExclusive(async () => {
    const map = await readProcessedEvents();
    const existing = map[eventId];
    if (!existing || existing.status !== "claimed") return;
    delete map[eventId];
    await writeProcessedEvents(map);
  });
}
