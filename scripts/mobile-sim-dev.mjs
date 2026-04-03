import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import waitOn from "wait-on";
import { getMobileDevPort } from "./mobile-port.mjs";

const platform = process.argv[2];
if (platform !== "ios" && platform !== "android") {
  console.error("Usage: node scripts/mobile-sim-dev.mjs ios|android");
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
const waitResource = `http-get://localhost:${port}`;
const npx = process.platform === "win32" ? "npx.cmd" : "npx";

const nextChild = spawn(
  npx,
  ["next", "dev", "--webpack", "--hostname", "0.0.0.0", "--port", String(port)],
  {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  },
);

let capChild = null;
let shuttingDown = false;

function stopNext() {
  nextChild.kill("SIGTERM");
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  capChild?.kill("SIGTERM");
  stopNext();
  setTimeout(() => process.exit(code), 750).unref();
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

nextChild.on("exit", (code, signal) => {
  if (shuttingDown) return;
  capChild?.kill("SIGTERM");
  const exitCode = signal ? 1 : code ?? 0;
  process.exit(exitCode);
});

(async () => {
  try {
    await waitOn({
      resources: [waitResource],
      timeout: 180_000,
      interval: 250,
    });
  } catch {
    if (shuttingDown) return;
    console.error(`Timed out waiting for Next.js at ${waitResource} (MOBILE_DEV_PORT=${port}).`);
    stopNext();
    process.exit(1);
    return;
  }

  if (shuttingDown) return;

  capChild = spawn(
    npx,
    ["cap", "run", platform, "-l", "--host", "localhost", "--port", String(port)],
    {
      cwd: root,
      stdio: "inherit",
      env: { ...process.env, CAP_SERVER_URL: serverUrl },
      shell: process.platform === "win32",
    },
  );

  capChild.on("exit", (code) => {
    shutdown(code ?? 0);
  });
})();
