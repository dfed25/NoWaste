import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getMobileDevPort } from "./mobile-port.mjs";

const platform = process.argv[2];
if (platform !== "ios" && platform !== "android") {
  console.error("Usage: node scripts/cap-native-run.mjs ios|android");
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

let port;
try {
  port = getMobileDevPort();
} catch (e) {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
}

const serverUrl = `http://localhost:${port}`;
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const child = spawn(npx, ["cap", "run", platform, "-l", "--external"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, CAP_SERVER_URL: serverUrl },
  shell: process.platform === "win32",
});

child.on("exit", (code) => process.exit(code ?? 1));
