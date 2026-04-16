import "server-only";
import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, rm } from "node:fs/promises";
import path from "node:path";
import { createRunExclusive } from "@/lib/file-queue";

const DATA_DIR = path.join(process.cwd(), ".nowaste-data");
const FILE = path.join(DATA_DIR, "restaurant-verification-codes.json");

const runExclusive = createRunExclusive();

const CODE_TTL_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

type Channel = "email" | "sms";

type CodeRow = {
  userId: string;
  channel: Channel;
  codeHash: string;
  expiresAt: string;
  attempts: number;
};

type FileShape = Record<string, CodeRow>;

function hashCode(code: string): string {
  return createHash("sha256").update(code, "utf8").digest("hex");
}

function generateSixDigitCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

async function readAll(): Promise<FileShape> {
  try {
    const raw = await readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as FileShape;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return {};
    throw err;
  }
}

async function writeAll(data: FileShape) {
  await mkdir(DATA_DIR, { recursive: true });
  const tempFile = `${FILE}.${randomUUID()}.tmp`;
  let handle: Awaited<ReturnType<typeof open>> | null = null;
  try {
    handle = await open(tempFile, "w");
    await handle.writeFile(JSON.stringify(data, null, 2), "utf8");
    await handle.sync();
    await handle.close();
    handle = null;
    await rename(tempFile, FILE);
  } finally {
    if (handle) await handle.close().catch(() => undefined);
    await rm(tempFile, { force: true }).catch(() => undefined);
  }
}

export async function issueRestaurantVerificationCode(
  userId: string,
  channel: Channel,
): Promise<{ plainCode: string }> {
  return runExclusive(async () => {
    const all = await readAll();
    const plainCode = generateSixDigitCode();
    const row: CodeRow = {
      userId,
      channel,
      codeHash: hashCode(plainCode),
      expiresAt: new Date(Date.now() + CODE_TTL_MS).toISOString(),
      attempts: 0,
    };
    all[userId] = row;
    await writeAll(all);
    return { plainCode };
  });
}

export type VerifyCodeFailure = "invalid" | "expired" | "locked";

export type VerifyCodeSuccess = { ok: true; channel: Channel };

export async function verifyRestaurantVerificationCode(
  userId: string,
  plainCode: string,
): Promise<VerifyCodeFailure | VerifyCodeSuccess> {
  return runExclusive(async () => {
    const all = await readAll();
    const row = all[userId];
    if (!row) return "invalid";

    if (row.attempts >= MAX_ATTEMPTS) {
      delete all[userId];
      await writeAll(all);
      return "locked";
    }

    if (new Date(row.expiresAt).getTime() < Date.now()) {
      delete all[userId];
      await writeAll(all);
      return "expired";
    }

    const expected = Buffer.from(row.codeHash, "hex");
    const actual = Buffer.from(hashCode(plainCode.trim()), "hex");
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      row.attempts += 1;
      all[userId] = row;
      await writeAll(all);
      return "invalid";
    }

    const channel = row.channel;
    delete all[userId];
    await writeAll(all);
    return { ok: true, channel };
  });
}
