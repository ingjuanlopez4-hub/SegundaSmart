import { createClient } from "@libsql/client";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

function resolveDatabaseUrl(url) {
  if (!url.startsWith("file:") || url.startsWith("file:/")) return url;
  const prismaDirectory = fileURLToPath(new URL("../prisma/", import.meta.url));
  return `file:${resolve(prismaDirectory, url.slice("file:".length))}`;
}

export async function migrateDatabase({ url, authToken }) {
  if (!url) throw new Error("Falta la URL de la base de datos");
  const client = createClient({ url: resolveDatabaseUrl(url), authToken });
  try {
    const existing = await client.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'Business'");
    if (existing.rows.length === 0) {
      const initial = await readFile(new URL("../prisma/migrations/20260730000000_init/migration.sql", import.meta.url), "utf8");
      await client.executeMultiple(initial);
      console.log("Esquema inicial aplicado.");
    }

    const productColumns = await client.execute('PRAGMA table_info("Product")');
    const hasReference = productColumns.rows.some((row) => row.name === "reference");
    const hasDefects = productColumns.rows.some((row) => row.name === "defects");
    if (!hasReference && !hasDefects) {
      const productMigration = await readFile(new URL("../prisma/migrations/20260730010000_product_reference_defects/migration.sql", import.meta.url), "utf8");
      await client.executeMultiple(productMigration);
      console.log("Migración de referencias y defectos aplicada.");
    } else if (!hasReference || !hasDefects) {
      throw new Error("El esquema Product está parcialmente actualizado; restaura el respaldo y aplica la migración completa.");
    } else {
      console.log("La base de datos está actualizada.");
    }
  } finally {
    client.close();
  }
}

if (process.argv[1]?.endsWith("migrate-database.mjs")) {
  await migrateDatabase({ url: process.env.DATABASE_URL, authToken: undefined });
}
