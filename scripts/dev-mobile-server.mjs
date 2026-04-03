import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getMobileDevPort } from "./mobile-port.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

let port;
try {
  port = getMobileDevPort();
} catch (e) {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
}

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const child = spawn(
  npx,
  ["next", "dev", "--webpack", "--hostname", "0.0.0.0", "--port", String(port)],
  {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  },
);

child.on("exit", (code) => process.exit(code ?? 1));
