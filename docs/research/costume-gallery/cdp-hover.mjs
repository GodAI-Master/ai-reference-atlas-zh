// Capture the Douyin QR popover by dispatching a real mouse move over the card.
// Usage: node cdp-hover.mjs <url> <outPrefix> [width] [height]
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [, , url, prefix, wArg, hArg] = process.argv;
const WIDTH = Number(wArg || 1440);
const HEIGHT = Number(hArg || 800);

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORT = 9336;
const profile = mkdtempSync(join(tmpdir(), "edge-hover-"));
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
await sleep(2500);
for (let i = 0; i < 40; i++) {
  if (await evaluate("return document.querySelectorAll('.card').length > 0;")) break;
  await sleep(250);
}
for (let i = 0; i < 40; i++) {
  const ok = await evaluate(`
    const el = document.querySelector('.qr-wrap');
    return !!el && Object.keys(el).some(k => k.startsWith('__reactFiber') || k.startsWith('__reactProps'));
  `);
  if (ok) break;
  await sleep(400);
}

const box = await evaluate(`
  const el = document.querySelector('.qr-wrap');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
`);

if (box) {
  await send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: box.x,
    y: box.y,
    button: "none",
  });
  await sleep(600);
}

const state = await evaluate(`
  const pop = document.querySelector('.qr-pop');
  if (!pop) return null;
  const cs = getComputedStyle(pop);
  const r = pop.getBoundingClientRect();
  const img = pop.querySelector('img');
  return {
    opacity: cs.opacity,
    visibility: cs.visibility,
    width: Math.round(r.width),
    height: Math.round(r.height),
    top: Math.round(r.top),
    imgComplete: img ? img.complete && img.naturalWidth > 0 : null,
    imgNatural: img ? img.naturalWidth : null,
    href: document.querySelector('.qr-wrap a')?.href,
  };
`);
console.log(JSON.stringify({ box, state }, null, 2));

const { data } = await send("Page.captureScreenshot", { format: "png" });
writeFileSync(`${prefix}-hover.png`, Buffer.from(data, "base64"));

ws.close();
try {
  browser.kill();
} catch {}
