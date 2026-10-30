// Pose lightbox probe: opens the first pose, verifies the angle strip, then
// presses → / ↓ to confirm angle and pose navigation.
// Usage: node cdp-pose.mjs <url> <outPrefix> [width] [height]
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [, , url, prefix, wArg, hArg] = process.argv;
const WIDTH = Number(wArg || 1440);
const HEIGHT = Number(hArg || 900);
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORT = 9341;

const browser = spawn(
  EDGE,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${mkdtempSync(join(tmpdir(), "edge-pose-"))}`,
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
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let seq = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
  }
});
const send = (method, params = {}) =>
  new Promise((res) => {
    const id = ++seq;
    pending.set(id, res);
    ws.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expression) =>
  (await send("Runtime.evaluate", { expression: `(() => { ${expression} })()`, returnByValue: true, awaitPromise: true }))
    .result?.value;

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url });
await sleep(2500);
for (let i = 0; i < 40; i++) {
  if (await evaluate("return document.querySelectorAll('.card').length > 0;")) break;
  await sleep(250);
}
for (let i = 0; i < 40; i++) {
  const ok = await evaluate(`
    const el = document.querySelector('.card');
    return !!el && Object.keys(el).some(k => k.startsWith('__reactFiber') || k.startsWith('__reactProps'));
  `);
  if (ok) break;
  await sleep(400);
}

const grid = await evaluate(`
  const cards = document.querySelectorAll('.card');
  const first = cards[0];
  const img = first.querySelector('img');
  return {
    cards: cards.length,
    firstBadge: first.querySelector('.badge span')?.textContent ?? null,
    firstName: first.querySelector('.gname')?.textContent ?? null,
    firstDesc: first.querySelector('.desc')?.textContent ?? null,
    imgW: img?.naturalWidth, imgH: img?.naturalHeight,
    boxW: Math.round(first.querySelector('.ph').getBoundingClientRect().width),
    boxH: Math.round(first.querySelector('.ph').getBoundingClientRect().height),
    objectFit: img ? getComputedStyle(img).objectFit : null,
  };
`);

await evaluate(`document.querySelector('.card').click(); return true;`);
await sleep(700);

const opened = await evaluate(`
  const m = document.querySelector('.modal');
  const strip = document.querySelectorAll('.mang button');
  const cs = getComputedStyle(m);
  return {
    open: cs.display,
    title: document.querySelector('.mside h2')?.textContent,
    pager: document.querySelector('.pager')?.textContent,
    angles: strip.length,
    angleLabels: [...strip].map(b => b.textContent.trim()),
    current: document.querySelector('.kv dd:last-of-type')?.textContent,
    img: document.querySelector('.mimg img')?.currentSrc?.split('/').pop(),
  };
`);

const shot = async (name) => {
  const { data } = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(`${prefix}-${name}.png`, Buffer.from(data, "base64"));
};
await shot("open");

// → should advance the angle inside the same pose
await send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
await send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
await sleep(500);
const afterAngle = await evaluate(`
  return {
    img: document.querySelector('.mimg img')?.currentSrc?.split('/').pop(),
    current: document.querySelector('.kv dd:last-of-type')?.textContent,
    pager: document.querySelector('.pager')?.textContent,
  };
`);

// ↓ should advance to the next pose, resetting the angle
await send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowDown", code: "ArrowDown", windowsVirtualKeyCode: 40 });
await send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowDown", code: "ArrowDown", windowsVirtualKeyCode: 40 });
await sleep(500);
const afterPose = await evaluate(`
  return {
    title: document.querySelector('.mside h2')?.textContent,
    pager: document.querySelector('.pager')?.textContent,
    img: document.querySelector('.mimg img')?.currentSrc?.split('/').pop(),
    current: document.querySelector('.kv dd:last-of-type')?.textContent,
  };
`);
await shot("next-pose");

console.log(JSON.stringify({ grid, opened, afterAngle, afterPose }, null, 2));
ws.close();
try {
  browser.kill();
} catch {}
