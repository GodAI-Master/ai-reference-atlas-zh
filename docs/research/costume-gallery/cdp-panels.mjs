// Opens each info panel and captures it, to compare with the reference site.
// Usage: node cdp-panels.mjs <url> <outPrefix> [width] [height]
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [, , url, prefix, wArg, hArg] = process.argv;
const WIDTH = Number(wArg || 1440);
const HEIGHT = Number(hArg || 1000);

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORT = 9335;
const profile = mkdtempSync(join(tmpdir(), "edge-panels-"));
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
  const hydrated = await evaluate(`
    const el = document.querySelector('.itab');
    return !!el && Object.keys(el).some(k => k.startsWith('__reactFiber') || k.startsWith('__reactProps'));
  `);
  if (hydrated) break;
  await sleep(400);
}

const shot = async (name) => {
  const { data } = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(`${prefix}-${name}.png`, Buffer.from(data, "base64"));
};

await shot("closed");

const report = [];
for (const i of [0, 1]) {
  const info = await evaluate(`
    document.querySelectorAll('.itab')[${i}].click();
    return new Promise(r => setTimeout(() => {
      const panel = document.getElementById('ipanel${i}');
      const heading = panel.querySelector('h2')?.textContent;
      const items = [...panel.querySelectorAll('li')].map(li => li.textContent);
      const note = panel.querySelector('.info-note')?.textContent ?? null;
      const rect = panel.getBoundingClientRect();
      r({ heading, items, note, width: Math.round(rect.width), height: Math.round(rect.height), display: getComputedStyle(panel).display });
    }, 500));
  `);
  report.push({ tab: i, ...info });
  await shot(`panel${i}`);
  await evaluate(`document.querySelectorAll('.itab')[${i}].click(); return true;`);
  await sleep(300);
}

console.log(JSON.stringify(report, null, 2));
ws.close();
try {
  browser.kill();
} catch {}
