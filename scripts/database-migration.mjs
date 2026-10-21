import { readFile } from "node:fs/promises";

// Controlled versioned SQL: no triggers or semicolons inside literals.
const statements = (sql) => sql.split(";").map((s) => s.trim()).filter(Boolean);
// Keep token boundaries and literal values: "business Id" is not businessId,
// and CHECK(status IN ('available')) is not the versioned uppercase constraint.
const canonical = (sql) => JSON.stringify((sql.match(/'(?:''|[^'])*'|"(?:""|[^"])*"|`(?:``|[^`])*`|\[[^\]]*\]|[a-zA-Z_][\w$]*|\d+|[^\s]/g) ?? []).map((token) => {
  if (token.startsWith("'")) return token;
  if (['"', "`", "["].includes(token[0])) return token.slice(1, -1).replaceAll('""', '"').replaceAll("``", "`").toLowerCase();
  return token.toLowerCase();
}));
const literal = (value) => `'${value.replaceAll("'", "''")}'`;
const schemaQuery = "SELECT type, name, sql FROM sqlite_master WHERE type IN ('table', 'index') AND name NOT LIKE 'sqlite_%' ORDER BY type, name";

function definitions(sql, type) {
  return new Map(statements(sql).flatMap((statement) => {
    const match = statement.match(type === "table" ? /^CREATE TABLE "([^"]+)"/ : /^CREATE (?:UNIQUE )?INDEX "([^"]+)"/);
    return match ? [[match[1], statement]] : [];
  }));
}

/**
 * Requires a backup and an exclusive maintenance window. Check real table
 * constraints and index definitions, not a ledger or just column presence.
 * Unknown/partial tables are never guessed at or deleted.
 *
 * executeMultiple is NOT atomic by itself. One sequence pins PRAGMA OFF and
 * BEGIN/COMMIT to the same connection, including Hrana/HTTP. client.batch()
 * begins before its statements (too late for foreign_keys=OFF); execute() and
 * transaction() need not share a remote connection either.
 */
export async function migrateWithClient(client) {
  const initial = await readFile(new URL("../prisma/migrations/20260730000000_init/migration.sql", import.meta.url), "utf8");
  const upgrade = await readFile(new URL("../prisma/migrations/20260730010000_product_reference_defects/migration.sql", import.meta.url), "utf8");
  const oldTables = definitions(initial, "table");
  const tables = new Map(oldTables);
  tables.set("Product", definitions(upgrade, "table").get("new_Product").replace('"new_Product"', '"Product"'));
  const indexes = new Map([...definitions(initial, "index"), ...definitions(upgrade, "index")]);
  const snapshot = (await client.execute(schemaQuery)).rows;
  const actualTables = new Map(snapshot.filter((r) => r.type === "table").map((r) => [r.name, r.sql]));
  const empty = snapshot.length === 0;
  const legacy = !empty && canonical(actualTables.get("Product") ?? "") === canonical(oldTables.get("Product"));

  if (!empty) {
    if (actualTables.has("new_Product")) throw new Error("Esquema parcial: existe new_Product; requiere recuperación desde respaldo.");
    for (const [name, sql] of legacy ? oldTables : tables) {
      if (canonical(actualTables.get(name) ?? "") !== canonical(sql)) {
        throw new Error(`Esquema parcial o restricciones incompatibles en ${name}; requiere revisión y respaldo.`);
      }
    }
  }

  const changes = [];
  if (empty) changes.push(...statements(initial));
  if (empty || legacy) changes.push(...statements(upgrade).filter((s) => !/^PRAGMA /i.test(s)));
  // Missing indexes are recoverable. Existing names with different constraints
  // must not be silently accepted (nor dropped automatically).
  for (const [name, sql] of indexes) {
    const existing = snapshot.find((r) => r.type === "index" && r.name === name);
    if (existing && canonical(existing.sql) !== canonical(sql)) throw new Error(`Índice incompatible: ${name}; requiere revisión.`);
    const created = changes.some((s) => canonical(s) === canonical(sql));
    if (!existing && !created) changes.push(sql);
  }

  // Recheck the inspected snapshot under the write lock, avoiding a schema race.
  const schemaMatches = snapshot.map((r) => `(type=${literal(r.type)} AND name=${literal(r.name)} AND sql=${literal(r.sql)})`).join(" OR ") || "0";
  const guard = (condition) => `INSERT INTO temp.migration_guard VALUES (CASE WHEN ${condition} THEN 1 ELSE 0 END)`;
  const sql = [
    "PRAGMA foreign_keys=OFF",
    "BEGIN IMMEDIATE",
    "CREATE TEMP TABLE migration_guard (ok INTEGER CHECK (ok = 1))",
    guard(`(SELECT COUNT(*) FROM sqlite_master WHERE type IN ('table', 'index') AND name NOT LIKE 'sqlite_%') = ${snapshot.length} AND (SELECT COUNT(*) FROM sqlite_master WHERE ${schemaMatches}) = ${snapshot.length}`),
    // Fail closed if the server refuses FK OFF on this pinned connection.
    guard("(SELECT foreign_keys FROM pragma_foreign_keys) = 0"),
    ...changes,
    guard("NOT EXISTS (SELECT 1 FROM pragma_foreign_key_check)"),
    "DROP TABLE temp.migration_guard",
    "COMMIT",
    "PRAGMA foreign_keys=ON",
  ].join(";\n") + ";";

  try {
    await client.executeMultiple(sql);
  } finally {
    // Local executeMultiple rolls back on error. Remote stream closure rolls
    // back an uncommitted sequence. Restore the local connection as well.
    await client.execute("PRAGMA foreign_keys=ON");
  }
  return { changed: changes.length > 0 };
}
