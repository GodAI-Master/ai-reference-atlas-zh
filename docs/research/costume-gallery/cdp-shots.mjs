// Capture the same scroll positions on two pages for visual comparison.
// Usage: node cdp-shots.mjs <url> <outPrefix> <y1,y2,...> [width] [height]
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [, , url, prefix, ysArg, wArg, hArg] = process.argv;
const WIDTH = Number(wArg || 1440);
const HEIGHT = Number(hArg || 1000);
const OFFSETS = (ysArg || "0").split(",").map(Number);

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORT = 9334;
const profile = mkdtempSync(join(tmpdir(), "edge-shots-"));
const browser = spawn(
  EDGE,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    "about:blank",
  ],
  { stdio: "ignore" }
);
process.on("exit", () => {
  try {
    browser.kill();
  } catch {}
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let page;
for (let i = 0; i < 60; i++) {
  try {
    const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json());
    page = list.find((t) => t.type === "page");
    if (page?.webSocketDebuggerUrl) break;
  } catch {}
  await sleep(250);
}
if (!page) throw new Error("no target");

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.addEventListener("open", res, { once: true });
  ws.addEventListener("error", rej, { once: true });
});

let seq = 0;
const pending = new Map();
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
  }
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error("timeout " + method));
      }
    }, 60000);
  });

const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", {
    expression: `(() => { ${expression} })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  return r.result?.value;
};

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: WIDTH,
  height: HEIGHT,
  deviceScaleFactor: 1,
  mobile: false,
});
await send("Page.navigate", { url });
await sleep(3000);
for (let i = 0; i < 40; i++) {
  if (await evaluate("return document.querySelectorAll('.card').length > 0;")) break;
  await sleep(250);
}
// let images below the fold settle
for (let i = 0; i < 40; i++) {
  const done = await evaluate(`
    const imgs = [...document.querySelectorAll('.card img')].slice(0, 20);
    return imgs.length > 0 && imgs.every(i => i.complete && i.naturalWidth > 0);
  `);
  if (done) break;
  await sleep(500);
}

for (const y of OFFSETS) {
  await evaluate(`window.scrollTo(0, ${y}); return true;`);
  await sleep(2200);
  const { data } = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(`${prefix}-y${y}.png`, Buffer.from(data, "base64"));
  const at = await evaluate("return Math.round(window.scrollY);");
  console.log(`captured y=${y} actual=${at}`);
}

ws.close();
try {
  browser.kill();
} catch {}
