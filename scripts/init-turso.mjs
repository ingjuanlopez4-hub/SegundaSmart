import { createClient } from "@libsql/client";
import { readFile } from "node:fs/promises";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) throw new Error("Faltan TURSO_DATABASE_URL o TURSO_AUTH_TOKEN en .env.local");

const client = createClient({ url, authToken });
const existing = await client.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'Business'");

if (existing.rows.length > 0) {
  console.log("El esquema de Turso ya está inicializado.");
} else {
  const migration = await readFile(new URL("../prisma/migrations/20260730000000_init/migration.sql", import.meta.url), "utf8");
  await client.executeMultiple(migration);
  console.log("Esquema inicial aplicado en Turso.");
}

client.close();
