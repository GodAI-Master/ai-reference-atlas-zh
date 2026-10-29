// Asset downloader for the costume-gallery clone.
// Usage: node download-assets.js <listFile> <outRoot> [concurrency]
const fs = require("fs");
const path = require("path");
const https = require("https");

const ORIGIN = "https://ai-costume-gallery.pages.dev/";
const [, , listFile, outRoot, concArg] = process.argv;
const CONCURRENCY = Number(concArg || 8);

const agent = new https.Agent({ keepAlive: true, maxSockets: CONCURRENCY, maxFreeSockets: CONCURRENCY });

const targets = fs
  .readFileSync(listFile, "utf8")
  .split("\n")
  .map((s) => s.trim())
  .filter(Boolean)
  .filter((rel) => {
    const abs = path.join(outRoot, rel);
    try {
      return !(fs.statSync(abs).size > 0);
    } catch {
      return true;
    }
  });

let done = 0;
let failed = [];
const total = targets.length;
console.log(`[start] ${total} to fetch, concurrency ${CONCURRENCY}`);

function fetchOne(rel) {
  return new Promise((resolve) => {
    const attempt = (n) => {
      const req = https.get(
        ORIGIN + rel,
        { agent, timeout: 45000, headers: { "User-Agent": "Mozilla/5.0 (clone-setup)" } },
        (res) => {
          if (res.statusCode !== 200) {
            res.resume();
            if (n < 3) return setTimeout(() => attempt(n + 1), 400 * (n + 1));
            failed.push(rel + " HTTP" + res.statusCode);
            return resolve();
          }
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => {
            const buf = Buffer.concat(chunks);
            const abs = path.join(outRoot, rel);
            fs.mkdirSync(path.dirname(abs), { recursive: true });
            fs.writeFileSync(abs, buf);
            done++;
            if (done % 50 === 0 || done === total) {
              console.log(`[progress] ${done}/${total} failed=${failed.length}`);
            }
            resolve();
          });
          res.on("error", () => (n < 3 ? setTimeout(() => attempt(n + 1), 400 * (n + 1)) : (failed.push(rel), resolve())));
        }
      );
      req.on("timeout", () => req.destroy(new Error("timeout")));
      req.on("error", () => {
        if (n < 3) setTimeout(() => attempt(n + 1), 400 * (n + 1));
        else {
          failed.push(rel);
          resolve();
        }
      });
    };
    attempt(0);
  });
}

(async () => {
  let i = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, total) }, async () => {
    while (i < targets.length) {
      const rel = targets[i++];
      await fetchOne(rel);
    }
  });
  await Promise.all(workers);
  console.log(`[done] downloaded=${done} failed=${failed.length}`);
  if (failed.length) {
    fs.writeFileSync(listFile + ".failed", failed.join("\n") + "\n");
    console.log(`[failed sample] ${failed.slice(0, 5).join(", ")}`);
  }
})();
