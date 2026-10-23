// Synthetic data only. Requires a completed production build and local Chrome.
import { spawn, execFileSync } from "node:child_process";
import { mkdir, writeFile, mkdtemp } from "node:fs/promises";
import { randomUUID, scryptSync } from "node:crypto";
import assert from "node:assert/strict";
import path from "node:path";
import { cpus, totalmem } from "node:os";
import { createServer } from "node:net";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";

const label = process.argv[2];
assert.match(label ?? "", /^[a-z0-9-]+$/);
// Refuse occupied ports rather than sending fixture mutations to another process.
for (const port of [3197, 9397]) {
  const probe = createServer();
  await new Promise((resolve, reject) => { probe.once("error", reject); probe.listen(port, "127.0.0.1", resolve); });
  await new Promise((resolve) => probe.close(resolve));
}
const directory = await mkdtemp("/tmp/opencode/ss-perf-");
const origin = "http://127.0.0.1:3197";
const env = { ...process.env, DATABASE_URL: `file:${directory}/fixture.db`, TURSO_DATABASE_URL: "", TURSO_AUTH_TOKEN: "", BLOB_READ_WRITE_TOKEN: "", OPENAI_API_KEY: "", APP_URL: origin, NEXT_TELEMETRY_DISABLED: "1" };
execFileSync("node_modules/.bin/prisma", ["migrate", "deploy"], { env, stdio: "pipe" });
const prisma = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });
const businessId = "cperf000000000000000000001";
const secondId = "cperf000000000000000000002";
const imageDirectory = path.resolve("public/uploads", businessId);
await mkdir(imageDirectory, { recursive: true });
const pixels = Buffer.alloc(1200 * 900 * 3);
for (let i = 0; i < pixels.length; i++) pixels[i] = (i * 31 + (i >> 8)) % 256;
const image = await sharp(pixels, { raw: { width: 1200, height: 900, channels: 3 } }).jpeg({ quality: 85 }).toBuffer();
const photoPath = `/uploads/${businessId}/00000000-0000-4000-8000-000000000001.jpg`;
await writeFile(path.join(imageDirectory, path.basename(photoPath)), image);
await prisma.business.createMany({ data: [{ id: businessId, name: "Fixture principal", slug: "perf-principal" }, { id: secondId, name: "Fixture ajeno", slug: "perf-ajeno" }] });
const password = "Performance-Local!2026";
const salt = "synthetic-performance-salt";
await prisma.user.create({ data: { id: "perf-user", name: "Fixture", email: "perf@example.test", passwordHash: `${salt}:${scryptSync(password, salt, 64).toString("hex")}`, businessId, ownedBusinesses: { create: { businessId } } } });
const productId = (i) => `c${String(i).padStart(24, "0")}`;
const data = Array.from({ length: 680 }, (_, i) => ({ id: productId(i), businessId: i < 600 ? businessId : secondId, reference: `PZ-${String(i).padStart(10, "0")}`, name: `${i % 3 === 0 ? "Mesa" : i % 3 === 1 ? "Silla" : "Lámpara"} de segunda mano ${i}`, category: "Hogar", condition: "Buen estado", description: "Ficha sintética representativa. ".repeat(12), photoPath, costCents: 5000, priceCents: 12000, status: i < 60 ? "SOLD" : "AVAILABLE", createdAt: new Date(Date.UTC(2026, 0, 1) + i * 60000) }));
await prisma.product.createMany({ data });
await prisma.sale.createMany({ data: data.slice(0, 60).map((p) => ({ businessId, productId: p.id, amountCents: 12000 })) });
const queries = [];
const serverLog = [];
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", "3197"], { env: { ...env, NODE_ENV: "production", NODE_OPTIONS: `--import=${path.resolve("scripts/performance-prisma.mjs")}` }, stdio: ["ignore", "pipe", "pipe"] });
let carry = "";
server.stdout.on("data", (chunk) => { carry += chunk; const lines = carry.split("\n"); carry = lines.pop(); for (const line of lines) { if (line.startsWith("PERF_QUERY ")) queries.push(JSON.parse(line.slice(11))); else serverLog.push(line); } });
server.stderr.on("data", (chunk) => serverLog.push(String(chunk)));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(fn) { for (let i = 0; i < 200; i++) { if (await fn()) return; await wait(100); } throw new Error("Timeout"); }
const measurements = [];
let cookie;
let chrome;
let socket;
const checks = [];
async function request(flow, url, body, expected = 200, record = true) {
  const startQueries = queries.length;
  const start = performance.now();
  const response = await fetch(origin + url, { method: body ? "POST" : "GET", headers: { ...(cookie && flow !== "initial" ? { Cookie: cookie } : {}), ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined, redirect: "manual" });
  const bytes = Buffer.from(await response.arrayBuffer());
  const ms = performance.now() - start;
  assert.equal(response.status, expected, `${flow}: ${bytes.toString().slice(0, 200)}`);
  await wait(30); // allow query events to drain; excluded from response timing
  if (record) measurements.push({ flow, ms, bytes: bytes.length, requests: 1, queries: queries.slice(startQueries) });
  return { response, bytes };
}
try {
  await until(async () => { try { return (await fetch(origin + "/login")).ok; } catch { return false; } });
  for (let run = -1; run < 7; run++) {
    const record = run >= 0;
    await request("initial", "/login", undefined, 200, record);
    const login = await request("login", "/api/auth/login", { email: "perf@example.test", password }, 200, record);
    cookie = login.response.headers.get("set-cookie").split(";")[0];
    await request("inventory", "/app/inventario", undefined, 200, record);
    await request("search", "/app/inventario?q=Mesa", undefined, 200, record);
    const created = await request("business", "/api/negocios", { name: `Fixture nuevo ${run + 1}`, requestKey: randomUUID() }, 201, record);
    assert.ok(JSON.parse(created.bytes).id);
    await request("select", `/api/negocios/${businessId}`, {}, 200, false);
    await request("sale", "/api/ventas", { productId: productId(60 + run + 1), amount: "120" }, 201, record);
  }
  await request("double-sale", "/api/ventas", { productId: productId(61), amount: "120" }, 409, false);
  await request("foreign-sale", "/api/ventas", { productId: productId(600), amount: "120" }, 409, false);
  const publicPage = await request("catalog", "/catalogo/perf-principal", undefined, 200, false);
  assert.ok(!publicPage.bytes.toString().includes(`id="producto-${productId(61)}"`));
  assert.equal(await prisma.sale.count({ where: { productId: productId(61) } }), 1);
  checks.push("double sale rejected", "foreign sale rejected", "sold item absent from public catalog", "one sale row per item");
  const browser = [];
  chrome = spawn("/usr/bin/google-chrome", ["--headless=new", "--no-sandbox", "--disable-gpu", "--remote-debugging-port=9397", `--user-data-dir=${directory}/chrome`, "about:blank"], { stdio: "ignore" });
  await until(async () => { try { return (await fetch("http://127.0.0.1:9397/json/version")).ok; } catch { return false; } });
  const tabs = await (await fetch("http://127.0.0.1:9397/json/list")).json();
  socket = new WebSocket(tabs.find((tab) => tab.type === "page").webSocketDebuggerUrl);
  await new Promise((resolve) => socket.addEventListener("open", resolve, { once: true }));
  let id = 0;
  const pending = new Map();
  const errors = [];
  socket.addEventListener("message", ({ data }) => { const message = JSON.parse(data); if (message.method === "Runtime.exceptionThrown") errors.push(message.params); if (message.id) { const p = pending.get(message.id); pending.delete(message.id); if (message.error) p.reject(message.error); else p.resolve(message.result); } });
  const call = (method, params = {}) => new Promise((resolve, reject) => { const next = ++id; pending.set(next, { resolve, reject }); socket.send(JSON.stringify({ id: next, method, params })); });
  const evaluate = async (expression) => { const result = await call("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }); assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails)); return result.result.value; };
  await call("Runtime.enable"); await call("Page.enable"); await call("Network.enable");
  await call("Network.setCacheDisabled", { cacheDisabled: true });
  await call("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await call("Emulation.setCPUThrottlingRate", { rate: 4 });
  for (const [flow, url] of [["initial", "/login"], ["inventory", "/app/inventario"], ["search", "/app/inventario?q=Mesa"]]) {
    if (flow !== "initial") await call("Network.setCookie", { name: "segunda_session", value: cookie.split("=")[1], url: origin, httpOnly: true, secure: true, sameSite: "Lax" });
    for (let run = -1; run < 5; run++) {
      await call("Page.navigate", { url: origin + url });
      await until(() => evaluate(`location.href === ${JSON.stringify(origin + url)} && document.readyState === 'complete'`));
      await wait(1500);
      const metrics = await evaluate(`(() => { const n=performance.getEntriesByType('navigation')[0]; const r=performance.getEntriesByType('resource'); return {ttfb:n.responseStart,dom:n.domContentLoadedEventEnd,load:n.loadEventEnd,fcp:performance.getEntriesByName('first-contentful-paint')[0]?.startTime,requests:1+r.length,bytes:n.transferSize+r.reduce((s,x)=>s+x.transferSize,0),cards:document.querySelectorAll('.product-card').length,overflow:document.documentElement.scrollWidth>innerWidth}; })()`);
      assert.equal(metrics.overflow, false, flow + " mobile overflow");
      if (run >= 0) browser.push({ flow, ...metrics });
    }
  }
  assert.equal(errors.length, 0);
  checks.push("390px without horizontal overflow", "no JavaScript exceptions");
  // Pagination-specific checks run after timing and only when the new control exists.
  if (await evaluate(`!!document.querySelector('nav[aria-label="Páginas del inventario"]')`)) {
    await call("Emulation.setCPUThrottlingRate", { rate: 1 });
    const firstId = await evaluate(`document.querySelector('.product-card').id`);
    await evaluate(`Array.from(document.querySelectorAll('nav[aria-label="Páginas del inventario"] a')).find(a=>a.textContent==='Siguiente').click()`);
    await until(() => evaluate(`location.search.includes('pagina=2') && document.querySelectorAll('.product-card').length===24 && document.querySelector('.product-card').id !== ${JSON.stringify(firstId)} && document.readyState==='complete'`));
    assert.ok(await evaluate(`location.search.includes('q=Mesa') && document.querySelectorAll('.product-card').length===24 && document.querySelector('.inventory-result-count').textContent.includes('200 piezas')`));
    checks.push("next page retains search and global count");
    await wait(700); // let the navigation transition commit before the next click
    const target = await evaluate(`(() => {const a=Array.from(document.querySelectorAll('.inventory-filters a')).find(a=>a.textContent.startsWith('Vendidas')); a.scrollIntoView({block:'center'});const r=a.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
    await call("Input.dispatchMouseEvent", { type: "mousePressed", button: "left", clickCount: 1, ...target });
    await call("Input.dispatchMouseEvent", { type: "mouseReleased", button: "left", clickCount: 1, ...target });
    await until(() => evaluate(`location.search.includes('estado=vendidas') && !location.search.includes('pagina=')`));
    await until(() => evaluate(`document.querySelectorAll('.product-card').length === 23 && Array.from(document.querySelectorAll('.product-card .badge')).every(b=>b.textContent==='Vendida')`));
    checks.push("status resets page and shows all 23 matching sold items");
    for (const width of [360, 390, 768, 1440]) {
      await call("Emulation.setDeviceMetricsOverride", { width, height: 844, deviceScaleFactor: 1, mobile: width < 800 });
      assert.ok(await evaluate(`document.documentElement.scrollWidth <= innerWidth`));
    }
    checks.push("pagination and filters without overflow at 360, 390, 768, 1440px");
    await call("Page.navigate", { url: origin + "/app/inventario?q=Inexistente" });
    await until(() => evaluate(`document.body?.textContent.includes('Sin coincidencias')`));
    assert.equal(await evaluate(`document.querySelectorAll('.product-card').length`), 0);
    checks.push("empty search remains recoverable");
  }
  const plans = await prisma.$queryRawUnsafe('EXPLAIN QUERY PLAN SELECT * FROM Product WHERE businessId = ? ORDER BY createdAt DESC, id DESC LIMIT 24 OFFSET 0', businessId);
  assert.equal(errors.length, 0);
  assert.ok(measurements.find((row) => row.flow === "inventory").queries.length > 0, "SQL trace active");
  const report = { label, conditions: { node: process.version, chrome: await call("Browser.getVersion"), cpu: cpus()[0].model, logicalCpus: cpus().length, memoryGiB: totalmem() / 2 ** 30, database: "isolated SQLite", products: 680, ownProducts: 600, initialSold: 60, httpRuns: 7, browserRuns: 5, warmups: 1, width: 390, cpuSlowdown: 4, network: "loopback, no throttle", browserCache: "disabled", observationAfterLoadMs: 1500, imageBytes: image.length }, measurements, browser, checks, plans, directory, serverLog };
  await mkdir("artifacts", { recursive: true });
  await writeFile(`artifacts/performance-${label}.json`, JSON.stringify(report, (_, value) => typeof value === "bigint" ? Number(value) : value, 2));
  console.log(JSON.stringify({ label, checks, output: `artifacts/performance-${label}.json` }));
} finally {
  socket?.close(); chrome?.kill(); server.kill(); await prisma.$disconnect();
}
