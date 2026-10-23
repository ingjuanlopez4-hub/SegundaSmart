// Loaded only by the isolated local benchmark via NODE_OPTIONS, never by the app.
import { createRequire } from "node:module";
const client = createRequire(import.meta.url)("@prisma/client");
const Original = client.PrismaClient;
client.PrismaClient = class extends Original {
  constructor(options) {
    super({ ...options, log: [{ emit: "event", level: "query" }] });
    this.$on("query", (event) => console.log("PERF_QUERY " + JSON.stringify({ sql: event.query, ms: event.duration })));
  }
};
