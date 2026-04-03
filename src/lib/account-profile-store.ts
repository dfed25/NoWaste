import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRunExclusive } from "@/lib/file-queue";
import type { AccountSettingsInput } from "@/lib/validation";

const DATA_DIR = path.join(process.cwd(), ".nowaste-data");
const ACCOUNT_PROFILES_FILE = path.join(DATA_DIR, "account-profiles.json");
const runExclusive = createRunExclusive();

type AccountProfileMap = Record<string, AccountSettingsInput & { updatedAt: string }>;

function createDefaultProfile(): AccountSettingsInput {
  return {
    displayName: "",
    email: "",
    phone: "",
    dietaryPreferences: [],
    defaultMaxDistanceMiles: 10,
    marketingOptIn: false,
  };
}

async function readProfiles(): Promise<AccountProfileMap> {
  try {
    const raw = await readFile(ACCOUNT_PROFILES_FILE, "utf8");
    const parsed = JSON.parse(raw) as AccountProfileMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return {};
    console.error(`Failed reading account profiles at ${ACCOUNT_PROFILES_FILE}:`, err.message);
    throw err;
  }
}

async function writeProfiles(next: AccountProfileMap) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(ACCOUNT_PROFILES_FILE, JSON.stringify(next, null, 2), "utf8");
}

export async function getAccountProfile(userId: string): Promise<AccountSettingsInput> {
  return runExclusive(async () => {
    const profiles = await readProfiles();
    const current = profiles[userId];
    if (!current) return createDefaultProfile();

    return {
      displayName: current.displayName,
      email: current.email,
      phone: current.phone,
      dietaryPreferences: Array.isArray(current.dietaryPreferences)
        ? current.dietaryPreferences
        : [],
      defaultMaxDistanceMiles:
        typeof current.defaultMaxDistanceMiles === "number"
          ? current.defaultMaxDistanceMiles
          : 10,
      marketingOptIn: Boolean(current.marketingOptIn),
    };
  });
}

export async function saveAccountProfile(userId: string, input: AccountSettingsInput) {
  return runExclusive(async () => {
    const profiles = await readProfiles();
    profiles[userId] = {
      ...input,
      updatedAt: new Date().toISOString(),
    };
    await writeProfiles(profiles);
    return input;
  });
}
