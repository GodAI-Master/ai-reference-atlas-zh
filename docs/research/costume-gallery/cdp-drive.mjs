// Minimal CDP driver (no dependencies) used to run the same interaction sequence
// against the source page and the local clone, then diff the observable results.
//
// Usage: node cdp-drive.mjs <url> <outPrefix> [width] [height]

import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [, , url, prefix, wArg, hArg] = process.argv;
const WIDTH = Number(wArg || 1440);
const HEIGHT = Number(hArg || 1000);

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORT = 9333;

const profile = mkdtempSync(join(tmpdir(), "edge-cdp-"));
const browser = spawn(
  EDGE,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    "about:blank",
  ],
  { stdio: "ignore" }
);
const shutdown = () => {
  try {
    browser.kill();
  } catch {
    /* already gone */
  }
};
process.on("exit", shutdown);
process.on("SIGINT", () => {
  shutdown();
  process.exit(1);
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function target() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json());
      const page = list.find((t) => t.type === "page");
      if (page && page.webSocketDebuggerUrl) return page;
    } catch {
      /* not up yet */
    }
    await sleep(250);
  }
  throw new Error("no devtools target");
}

const page = await target();
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
        reject(new Error(`timeout ${method}`));
      }
    }, 120000);
  });

async function evaluate(expression) {
  const r = await send("Runtime.evaluate", {
    expression: `(() => { ${expression} })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + JSON.stringify(r.result?.description || ""));
  return r.result.value;
}

async function shot(name) {
  const { data } = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(`${prefix}-${name}.png`, Buffer.from(data, "base64"));
}

await send("Page.enable");
await send("Runtime.enable");
await send("Log.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: WIDTH,
  height: HEIGHT,
  deviceScaleFactor: 1,
  mobile: false,
});

const consoleErrors = [];
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.method === "Runtime.exceptionThrown") {
    consoleErrors.push(msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text);
  }
  if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error") {
    consoleErrors.push(msg.params.entry.text);
  }
});

await send("Page.navigate", { url });
await sleep(2000);
// Wait for the grid to be populated (client render), independent of image loading.
for (let i = 0; i < 40; i++) {
  const ready = await evaluate("return document.querySelectorAll('.card').length;");
  if (ready > 0) break;
  await sleep(250);
}

// React attaches its fiber to the DOM node once hydration completes.
// The source page is plain HTML, so give up after a few seconds for it.
for (let i = 0; i < 40; i++) {
  const hydrated = await evaluate(`
    const el = document.querySelector('.tab');
    if (!el) return false;
    return Object.keys(el).some(k => k.startsWith('__reactFiber') || k.startsWith('__reactProps'));
  `);
  if (hydrated) break;
  await sleep(500);
}

const results = {};

results.initial = await evaluate(`
  const cards = [...document.querySelectorAll('.card')];
  const more = document.querySelector('#more') || document.querySelector('.morebtn');
  return {
    cards: cards.length,
    firstId: cards[0]?.querySelector('.id')?.textContent,
    count: document.querySelector('#count')?.textContent || document.querySelector('.count')?.textContent,
    tabCount: document.querySelectorAll('.tab').length,
    tabLabels: [...document.querySelectorAll('.tab')].map(t => t.textContent),
    moreHidden: more ? more.hasAttribute('hidden') : null,
    moreDisplay: more ? getComputedStyle(more).display : null,
    moreText: more ? more.textContent : null,
    selectedTab: document.querySelector('.tab[aria-selected="true"]')?.textContent,
  };
`);

// 0. pagination: "もっと見る" appends the next batch
results.more = await evaluate(`
  const before = document.querySelectorAll('.card').length;
  const btn = document.querySelector('#more') || document.querySelector('.morebtn');
  const label = btn.textContent;
  btn.click();
  return new Promise(r => setTimeout(() => {
    const after = document.querySelectorAll('.card').length;
    const b = document.querySelector('#more') || document.querySelector('.morebtn');
    r({ before, after, label, newLabel: b.textContent, scrollHeight: document.body.scrollHeight });
  }, 700));
`);

// 1. category filter
results.catFilter = await evaluate(`
  const tabs = [...document.querySelectorAll('.tab')];
  const summer = tabs.find(t => t.textContent.startsWith('夏'));
  summer.click();
  return new Promise(r => setTimeout(() => {
    const cards = [...document.querySelectorAll('.card')];
    r({
      count: document.querySelector('#count')?.textContent || document.querySelector('.count')?.textContent,
      cards: cards.length,
      firstId: cards[0]?.querySelector('.id')?.textContent,
      selected: document.querySelector('.tab[aria-selected="true"]')?.textContent,
      scrollY: Math.round(window.scrollY),
    });
  }, 400));
`);

// 2. search within category (Japanese synonym path)
results.searchJa = await evaluate(`
  const q = document.querySelector('#q');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(q, '白');
  q.dispatchEvent(new Event('input', { bubbles: true }));
  return new Promise(r => setTimeout(() => {
    r({
      count: document.querySelector('#count')?.textContent || document.querySelector('.count')?.textContent,
      firstId: document.querySelector('.card .id')?.textContent,
    });
  }, 600));
`);

// 2b. Chinese query (localised build): single term, then two terms ANDed
results.searchCn = await evaluate(`
  const allTab = [...document.querySelectorAll('.tab')].find(t => /^(全部|すべて)/.test(t.textContent));
  allTab.click();
  const q = document.querySelector('#q');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(q, '蕾丝');
  q.dispatchEvent(new Event('input', { bubbles: true }));
  return new Promise(r => setTimeout(() => {
    r({
      count: document.querySelector('#count')?.textContent?.trim() || document.querySelector('.count')?.textContent,
      cards: document.querySelectorAll('.card').length,
      firstId: document.querySelector('.card .id')?.textContent,
      firstDesc: document.querySelector('.card .desc')?.textContent,
    });
  }, 700));
`);

results.searchCnTwoTerms = await evaluate(`
  const q = document.querySelector('#q');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(q, '蕾丝 黑色');
  q.dispatchEvent(new Event('input', { bubbles: true }));
  return new Promise(r => setTimeout(() => {
    r({
      count: document.querySelector('#count')?.textContent?.trim() || document.querySelector('.count')?.textContent,
      firstId: document.querySelector('.card .id')?.textContent,
      firstDesc: document.querySelector('.card .desc')?.textContent,
    });
  }, 700));
`);

// 3. no-match empty state
results.empty = await evaluate(`
  const q = document.querySelector('#q');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(q, 'zzzznope');
  q.dispatchEvent(new Event('input', { bubbles: true }));
  return new Promise(r => setTimeout(() => {
    r({
      count: document.querySelector('#count')?.textContent || document.querySelector('.count')?.textContent,
      empty: !!document.querySelector('.empty'),
      emptyText: document.querySelector('.empty')?.textContent?.trim(),
    });
  }, 600));
`);

// 4. reset, then open the lightbox
results.modal = await evaluate(`
  const q = document.querySelector('#q');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(q, '');
  q.dispatchEvent(new Event('input', { bubbles: true }));
  return new Promise(r => setTimeout(() => {
    const card = document.querySelector('.card');
    card.click();
    setTimeout(() => {
      const modal = document.querySelector('#modal') || document.querySelector('.modal');
      r({
        open: modal.classList.contains('open'),
        display: getComputedStyle(modal).display,
        title: document.querySelector('#mtitle')?.textContent || modal.querySelector('.mside h2')?.textContent,
        cat: document.querySelector('#mcat')?.textContent || modal.querySelector('.mside .id')?.textContent,
        dlHref: (document.querySelector('#mdl') || modal.querySelector('.dl'))?.getAttribute('href'),
        dlDownload: (document.querySelector('#mdl') || modal.querySelector('.dl'))?.getAttribute('download'),
        bodyOverflow: document.body.style.overflow,
        imgSrc: (document.querySelector('#mimg') || modal.querySelector('.mimg img'))?.getAttribute('src'),
      });
    }, 500);
  }, 600));
`);

// Measure how the lightbox image settles: intrinsic size vs rendered size.
results.modalUpgrade = await evaluate(`
  const img = document.querySelector('#mimg');
  return new Promise(r => {
    const t0 = Date.now();
    const tick = () => {
      const rect = img.getBoundingClientRect();
      if (img.naturalWidth >= 600 || Date.now() - t0 > 75000) {
        r({
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          renderedWidth: Math.round(rect.width),
          renderedHeight: Math.round(rect.height),
          src: img.getAttribute('src'),
          waitedMs: Date.now() - t0,
        });
      } else setTimeout(tick, 500);
    };
    tick();
  });
`);

await shot("modal");

// 5. next image
results.next = await evaluate(`
  const btn = document.querySelector('#mnext') || document.querySelector('.nav.r');
  btn.click();
  return new Promise(r => setTimeout(() => {
    r({ title: document.querySelector('#mtitle')?.textContent || document.querySelector('.mside h2')?.textContent });
  }, 400));
`);

// 6. escape closes
results.escape = await evaluate(`
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  return new Promise(r => setTimeout(() => {
    const modal = document.querySelector('#modal') || document.querySelector('.modal');
    r({
      open: modal.classList.contains('open'),
      bodyOverflow: document.body.style.overflow,
      focused: document.activeElement?.className,
    });
  }, 400));
`);

// 7. header info tab
results.infoTab = await evaluate(`
  const tab = document.querySelectorAll('.itab')[0];
  tab.click();
  return new Promise(r => setTimeout(() => {
    const panel = document.getElementById('ipanel0');
    r({
      expanded: tab.getAttribute('aria-expanded'),
      panelHidden: panel.hasAttribute('hidden'),
      panelDisplay: getComputedStyle(panel).display,
      heading: panel.querySelector('h2')?.textContent,
      items: panel.querySelectorAll('li').length,
    });
  }, 400));
`);

await shot("infotab");

results.consoleErrors = consoleErrors;

const fs = await import("node:fs");
fs.writeFileSync(`${prefix}-interactions.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
ws.close();
shutdown();
