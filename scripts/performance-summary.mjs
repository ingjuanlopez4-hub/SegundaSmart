import { readFile } from "node:fs/promises";
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
for (const label of process.argv.slice(2)) {
  const report = JSON.parse(await readFile(`artifacts/performance-${label}.json`, "utf8"));
  console.log(label);
  for (const flow of ["initial", "login", "inventory", "search", "business", "sale"]) {
    const rows = report.measurements.filter((r) => r.flow === flow);
    console.log(JSON.stringify({ flow, ms: median(rows.map((r) => r.ms)), range: [Math.min(...rows.map((r) => r.ms)), Math.max(...rows.map((r) => r.ms))], bytes: median(rows.map((r) => r.bytes)), queries: median(rows.map((r) => r.queries.length)), sqlMs: median(rows.map((r) => r.queries.reduce((s, q) => s + q.ms, 0))) }));
  }
  for (const flow of ["initial", "inventory", "search"]) {
    const rows = report.browser.filter((r) => r.flow === flow);
    console.log(JSON.stringify({ browser: flow, ...Object.fromEntries(["ttfb", "dom", "load", "fcp", "requests", "bytes", "cards"].map((key) => [key, median(rows.map((r) => r[key]))])), domRange: [Math.min(...rows.map((r) => r.dom)), Math.max(...rows.map((r) => r.dom))] }));
  }
  console.log("Inventory SQL", report.measurements.find((r) => r.flow === "inventory").queries);
  console.log("Plan", report.plans);
}
