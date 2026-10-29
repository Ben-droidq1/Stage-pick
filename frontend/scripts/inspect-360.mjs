// Loads the home screen in headless Edge at 360px and reports overflow.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL_TO_LOAD = process.env.SP_URL || "http://localhost:5173/?view=home";
const PORT = 9334;
const profile = "C:\\Users\\USER\\AppData\\Local\\Temp\\opencode\\edge-profile-sp-" + Date.now();
mkdirSync(profile, { recursive: true });

const child = spawn(
  EDGE,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function version() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) return res.json();
    } catch {}
    await sleep(250);
  }
  throw new Error("Edge did not start");
}

const info = await version();
const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = list.find((item) => item.type === "page");
const target = page || (await (await fetch(`http://127.0.0.1:${PORT}/json/new`, { method: "PUT" })).json());
const ws = new WebSocket(target.webSocketDebuggerUrl);

await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve, { once: true });
  ws.addEventListener("error", reject, { once: true });
});

let id = 0;
const waiting = new Map();
ws.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  if (msg.method === "Runtime.exceptionThrown") {
    console.log("PAGE ERROR:", msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
  }
  if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error") {
    console.log("LOG ERROR:", msg.params.entry.text, msg.params.entry.url || "");
  }
  if (msg.method === "Network.loadingFailed") {
    console.log("LOAD FAILED:", msg.params.type, msg.params.errorText);
  }
  if (msg.id && waiting.has(msg.id)) {
    const { resolve, reject } = waiting.get(msg.id);
    waiting.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
  }
});

const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    id += 1;
    waiting.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

await send("Page.enable");
await send("Runtime.enable");
await send("Log.enable");
await send("Network.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 360,
  height: 780,
  deviceScaleFactor: 1,
  mobile: false,
});
await send("Page.navigate", { url: URL_TO_LOAD });
await sleep(6000);

const probe = await send("Runtime.evaluate", {
  returnByValue: true,
  expression: `(() => {
    const wide = [...document.querySelectorAll('*')]
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && r.right > window.innerWidth + 1)
      .slice(0, 15)
      .map(({ el, r }) => ({
        tag: el.tagName.toLowerCase(),
        cls: String(el.className).slice(0, 60),
        right: Math.round(r.right),
        width: Math.round(r.width),
      }));
    return {
      href: location.href,
      ready: document.readyState,
      resources: performance.getEntriesByType("resource").map((e) => ({
        name: e.name.split("/").pop(),
        duration: Math.round(e.duration),
        size: e.transferSize,
      })),
      scripts: [...document.scripts].map((s) => s.src || "inline"),
      root: (document.getElementById("root") || {}).innerHTML?.length || 0,
      htmlLength: document.body.innerHTML.length,
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      wide,
      height: document.documentElement.scrollHeight,
    };
  })()`,
});

console.log(JSON.stringify(probe.result.value, null, 2));

const metrics = await send("Page.getLayoutMetrics");
const height = Math.min(metrics.cssContentSize.height, 12000);
await send("Emulation.setDeviceMetricsOverride", {
  width: 360,
  height,
  deviceScaleFactor: 1,
  mobile: false,
});
await sleep(400);

const shot = await send("Page.captureScreenshot", {
  format: "png",
  captureBeyondViewport: true,
  clip: { x: 0, y: 0, width: 360, height, scale: 1 },
});
writeFileSync(
  "C:\\Users\\USER\\AppData\\Local\\Temp\\opencode\\stagepick-360.png",
  Buffer.from(shot.data, "base64"),
);

ws.close();
child.kill();
console.log("screenshot written, height", height);

