import { migrateDatabase } from "./migrate-database.mjs";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) throw new Error("Faltan TURSO_DATABASE_URL o TURSO_AUTH_TOKEN en .env.local");
await migrateDatabase({ url, authToken });
