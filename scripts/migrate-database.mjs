import { createClient } from "@libsql/client";
import { migrateWithClient } from "./database-migration.mjs";
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
    const { changed } = await migrateWithClient(client);
    console.log(changed ? "Migraciones aplicadas e integridad verificada." : "La base de datos está actualizada; integridad verificada.");
  } finally {
    client.close();
  }
}

if (process.argv[1]?.endsWith("migrate-database.mjs")) {
  await migrateDatabase({ url: process.env.DATABASE_URL, authToken: undefined });
}
