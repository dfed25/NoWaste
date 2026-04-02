import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRunExclusive } from "@/lib/file-queue";

type ProcessedStripeEvent = {
  id: string;
  type: string;
  processedAt: string;
};

type StripeEventMap = Record<string, ProcessedStripeEvent>;

const DATA_DIR = path.join(process.cwd(), ".nowaste-data");
const STRIPE_EVENTS_FILE = path.join(DATA_DIR, "stripe-events.json");
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

export async function hasProcessedStripeEvent(eventId: string): Promise<boolean> {
  return runExclusive(async () => {
    const map = await readProcessedEvents();
    return Boolean(map[eventId]);
  });
}

export async function markStripeEventProcessed(eventId: string, type: string) {
  return runExclusive(async () => {
    const map = await readProcessedEvents();
    map[eventId] = {
      id: eventId,
      type,
      processedAt: new Date().toISOString(),
    };
    await writeProcessedEvents(map);
  });
}
