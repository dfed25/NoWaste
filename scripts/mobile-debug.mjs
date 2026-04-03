/**
 * Prints what the iOS app was last synced with and whether the Next dev URL answers.
 * Run from the repo root: npm run mobile:debug
 */
import { readFileSync, existsSync } from "node:fs";
import http from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getMobileDevPort } from "./mobile-port.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const iosConfigCandidates = [
  join(root, "ios/App/App/capacitor.config.json"),
  join(root, "ios/App/capacitor.config.json"),
];

function findIosCapConfig() {
  for (const p of iosConfigCandidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

function probe(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve({ ok: true, status: res.statusCode });
    });
    req.on("error", (e) => resolve({ ok: false, error: e.message }));
    req.setTimeout(4000, () => {
      req.destroy();
      resolve({ ok: false, error: "timeout (nothing listening?)" });
    });
  });
}

let port;
try {
  port = getMobileDevPort();
} catch (e) {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
}

console.log("NoWaste — mobile / Xcode debug\n");
console.log("Effective dev port (MOBILE_DEV_PORT / MOBILE_PORT):", port);

const capPath = findIosCapConfig();
if (!capPath) {
  console.log("\nNo ios/ …/capacitor.config.json found.");
  console.log("→ Add iOS once: npm run mobile:ios:add && npm run mobile:sync");
} else {
  console.log("\nLast synced native config:", capPath);
  try {
    const json = JSON.parse(readFileSync(capPath, "utf8"));
    if (json.server?.url) {
      console.log("  server.url (WebView loads this):", json.server.url);
      console.log("  cleartext:", json.server.cleartext);
    } else {
      console.log("  (no server.url — app uses bundled www/ only, not Next dev server)");
    }
  } catch (e) {
    console.log("  Could not parse:", e instanceof Error ? e.message : e);
  }
}

const home = `http://127.0.0.1:${port}/`;
process.stdout.write(`\nProbing Next at ${home} … `);
const r = await probe(home);
if (r.ok) {
  console.log(`OK (HTTP ${r.status})`);
} else {
  console.log("FAIL —", r.error ?? r.status);
}

console.log(`
What usually causes a white screen in Xcode
--------------------------------------------
1. server.url points at http://localhost:${port} but Next is NOT running.
   Fix: run  npm run dev:mobile  in a terminal, then Run in Xcode (or use  npm run sim:ios ).

2. You only pressed Run in Xcode; the Simulator cannot "start" the Next server for you.

3. On a physical iPhone, localhost is the phone itself — use your Mac LAN IP in server.url
   (see CONTRIBUTING.md → Physical devices).

4. Inspect errors: Safari → menu Develop → your Simulator → WebView → Console.
`);
