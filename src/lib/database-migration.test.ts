import { createClient, type Client } from "@libsql/client";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migrateWithClient } from "../../scripts/database-migration.mjs";

let directory: string;
let client: Client;
const initialUrl = new URL("../../prisma/migrations/20260730000000_init/migration.sql", import.meta.url);

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "segunda-migration-"));
  client = createClient({ url: `file:${join(directory, "test.db")}` });
});
afterEach(async () => {
  client.close();
  await rm(directory, { recursive: true, force: true });
});

async function legacyFixture() {
  await client.executeMultiple(await readFile(initialUrl, "utf8"));
  await client.execute("INSERT INTO Business (id, name, slug) VALUES ('b', 'Negocio', 'negocio')");
  await client.execute(`INSERT INTO Product (id, businessId, name, category, condition, description, photoPath,
    costCents, priceCents, suggestedCents, status, createdAt, updatedAt)
    VALUES ('pieza', 'b', 'Mesa', 'Hogar', 'Usado', 'Mesa usada', '/foto.jpg', 1234, 4567, 4000,
    'SOLD', '2026-07-01 12:00:00', '2026-07-02 12:00:00')`);
  await client.execute("INSERT INTO Sale (id, businessId, productId, amountCents) VALUES ('venta', 'b', 'pieza', 4321)");
}
const schema = async () => (await client.execute("SELECT type, name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY name")).rows;
const products = async () => (await client.execute("SELECT * FROM Product ORDER BY id")).rows;
const sales = async () => (await client.execute("SELECT * FROM Sale ORDER BY id")).rows;

describe("migraciones atómicas en SQLite temporal", () => {
  it.each([false, true])("añade propiedad conservando los datos existentes (referencias migradas=%s)", async (upgraded) => {
    await legacyFixture();
    await client.execute("INSERT INTO User (id,email,name,passwordHash,businessId) VALUES ('u','qa@example.test','QA','hash','b')");
    await client.execute("INSERT INTO Session (id,tokenHash,userId,expiresAt) VALUES ('s','token','u','2099-01-01')");
    if (upgraded) await client.executeMultiple(await readFile(new URL("../../prisma/migrations/20260730010000_product_reference_defects/migration.sql", import.meta.url), "utf8"));
    const users = (await client.execute("SELECT * FROM User")).rows;
    const businesses = (await client.execute("SELECT * FROM Business")).rows;
    const sessions = (await client.execute("SELECT * FROM Session")).rows;
    await migrateWithClient(client);
    expect((await client.execute("SELECT * FROM BusinessOwnership")).rows).toEqual([{ userId: "u", businessId: "b", requestKey: null }]);
    expect((await client.execute("SELECT * FROM User")).rows).toEqual(users);
    expect((await client.execute("SELECT * FROM Business")).rows).toEqual(businesses);
    expect((await client.execute("SELECT * FROM Session")).rows).toEqual(sessions);
    expect(await migrateWithClient(client)).toEqual({ changed: false });
  });

  it("revierte la migración de propiedad completa si falla el backfill y permite reintento", async () => {
    await legacyFixture();
    const before = await schema();
    await expect(migrateWithClient({
      execute: client.execute.bind(client),
      executeMultiple: (sql) => client.executeMultiple(sql.replace('SELECT "id", "businessId" FROM "User";', 'SELECT "id", "businessId" FROM "User"; SELECT * FROM forced_ownership_failure;')),
    })).rejects.toThrow(/forced_ownership_failure/);
    expect(await schema()).toEqual(before);
    expect(await sales()).toHaveLength(1);
    await migrateWithClient(client);
    expect(await migrateWithClient(client)).toEqual({ changed: false });
  });

  it("revierte también la creación inicial completa si falla antes de confirmar", async () => {
    await expect(migrateWithClient({
      execute: client.execute.bind(client),
      executeMultiple: (sql) => client.executeMultiple(sql.replace('DROP TABLE "Product";', 'DROP TABLE "Product"; SELECT * FROM forced_initial_failure;')),
    })).rejects.toThrow(/forced_initial_failure/);
    expect(await schema()).toEqual([]);
    await migrateWithClient(client);
    expect(await migrateWithClient(client)).toEqual({ changed: false });
  });

  it("falla sin tocar datos si el servidor no permite desactivar FK", async () => {
    await legacyFixture();
    await client.execute("PRAGMA foreign_keys=ON");
    const before = await schema();
    await expect(migrateWithClient({
      execute: client.execute.bind(client),
      executeMultiple: (sql) => client.executeMultiple(sql.replace("PRAGMA foreign_keys=OFF;", "")),
    })).rejects.toThrow(/CHECK constraint failed/);
    expect(await schema()).toEqual(before);
    expect(await sales()).toHaveLength(1);
  });

  it("rechaza cambios de esquema entre inspección y adquisición del bloqueo", async () => {
    await legacyFixture();
    await expect(migrateWithClient({
      execute: client.execute.bind(client),
      executeMultiple: async (sql) => {
        await client.execute("ALTER TABLE Business ADD COLUMN unexpected TEXT");
        await client.executeMultiple(sql);
      },
    })).rejects.toThrow(/CHECK constraint failed/);
    expect((await products())[0]).not.toHaveProperty("reference");
    expect(await sales()).toHaveLength(1);
  });

  it("crea el esquema completo desde vacío y es idempotente", async () => {
    expect(await migrateWithClient(client)).toEqual({ changed: true });
    const before = await schema();
    expect(await migrateWithClient(client)).toEqual({ changed: false });
    expect(await schema()).toEqual(before);
    expect((await client.execute("PRAGMA foreign_key_check")).rows).toEqual([]);
    expect((await client.execute("PRAGMA foreign_keys")).rows[0].foreign_keys).toBe(1);
  });

  it("conserva todos los campos de producto y venta previos, incluidos centavos y fechas", async () => {
    await legacyFixture();
    const beforeProduct = (await products())[0];
    const beforeSales = await sales();
    await migrateWithClient(client);
    expect((await products())[0]).toEqual({ ...beforeProduct, reference: "PZ-PIEZA", defects: null });
    expect(await sales()).toEqual(beforeSales);
    await client.execute("UPDATE Product SET defects='Rayón', reference='MESA-01' WHERE id='pieza'");
    const updated = await products();
    expect(await migrateWithClient(client)).toEqual({ changed: false });
    expect(await products()).toEqual(updated);
    await expect(client.execute("UPDATE Product SET status='INVALID' WHERE id='pieza'")).rejects.toThrow();
    await expect(client.execute("INSERT INTO Sale (id,businessId,productId,amountCents) VALUES ('otra','b','pieza',1)")).rejects.toThrow();
    await expect(client.execute("DELETE FROM Product WHERE id='pieza'")).rejects.toThrow();
  });

  it.each(['DROP TABLE "Product";', 'ALTER TABLE "new_Product" RENAME TO "Product";'])
    ("revierte un fallo tras %s y permite reintento íntegro", async (statement) => {
      await legacyFixture();
      const beforeSchema = await schema();
      const beforeProducts = await products();
      const beforeSales = await sales();
      // Fault injection changes only the sequence sent to real SQLite. No
      // persistence/transaction mock: failure occurs after destructive DDL.
      await expect(migrateWithClient({
        execute: client.execute.bind(client),
        executeMultiple: (sql) => client.executeMultiple(sql.replace(statement, `${statement}\nSELECT * FROM forced_migration_failure;`)),
      })).rejects.toThrow(/forced_migration_failure/);
      expect(await schema()).toEqual(beforeSchema);
      expect(await products()).toEqual(beforeProducts);
      expect(await sales()).toEqual(beforeSales);
      expect((await client.execute("PRAGMA foreign_keys")).rows[0].foreign_keys).toBe(1);
      await migrateWithClient(client);
      expect(await sales()).toEqual(beforeSales);
      expect((await products())[0].reference).toBe("PZ-PIEZA");
    });

  it("restaura índices faltantes, incluida unicidad de referencia y venta", async () => {
    await legacyFixture();
    await migrateWithClient(client);
    const expected = await schema();
    await client.executeMultiple('DROP INDEX Product_businessId_reference_key; DROP INDEX Product_businessId_status_idx; DROP INDEX Sale_productId_key;');
    expect(await migrateWithClient(client)).toEqual({ changed: true });
    expect(await schema()).toEqual(expected);
    expect(await migrateWithClient(client)).toEqual({ changed: false });
  });

  it("no confirma reparaciones si datos duplicados impiden recrear un índice único", async () => {
    await legacyFixture();
    await migrateWithClient(client);
    await client.executeMultiple("DROP INDEX Sale_productId_key; DROP INDEX Session_userId_idx; INSERT INTO Sale (id,businessId,productId,amountCents) VALUES ('duplicada','b','pieza',1);");
    const before = await schema();
    await expect(migrateWithClient(client)).rejects.toThrow(/UNIQUE/);
    expect(await schema()).toEqual(before);
    await client.execute("DELETE FROM Sale WHERE id='duplicada'");
    await migrateWithClient(client);
  });

  it("rechaza un índice con nombre correcto pero sin unicidad", async () => {
    await migrateWithClient(client);
    await client.executeMultiple('DROP INDEX Product_businessId_reference_key; CREATE INDEX Product_businessId_reference_key ON Product(businessId, reference);');
    await expect(migrateWithClient(client)).rejects.toThrow(/Índice incompatible/);
  });

  it("rechaza columnas parciales sin modificar ni perder filas", async () => {
    await legacyFixture();
    await client.execute("ALTER TABLE Product ADD COLUMN reference TEXT");
    const before = await schema();
    await expect(migrateWithClient(client)).rejects.toThrow(/Esquema parcial/);
    expect(await schema()).toEqual(before);
    expect(await sales()).toHaveLength(1);
  });

  it("rechaza un resto new_Product en vez de borrarlo o declararlo actualizado", async () => {
    await migrateWithClient(client);
    await client.execute("CREATE TABLE new_Product (id TEXT)");
    await expect(migrateWithClient(client)).rejects.toThrow(/new_Product/);
    expect((await client.execute("SELECT name FROM sqlite_master WHERE name='new_Product'")).rows).toHaveLength(1);
  });

  it("no confunde columnas completas con restricciones completas", async () => {
    const initial = await readFile(initialUrl, "utf8");
    const upgrade = await readFile(new URL("../../prisma/migrations/20260730010000_product_reference_defects/migration.sql", import.meta.url), "utf8");
    await client.executeMultiple(initial);
    await client.executeMultiple(upgrade.replace(' CHECK ("status" IN (\'AVAILABLE\', \'SOLD\'))', ""));
    await expect(migrateWithClient(client)).rejects.toThrow(/restricciones incompatibles en Product/);
  });

  it.each([false, true])("foreign_key_check impide confirmar con datos huérfanos (ya actualizado=%s)", async (current) => {
    await legacyFixture();
    if (current) await migrateWithClient(client);
    await client.executeMultiple("PRAGMA foreign_keys=OFF; UPDATE Sale SET productId='no-existe'; PRAGMA foreign_keys=ON;");
    const before = await schema();
    const beforeProducts = await products();
    await expect(migrateWithClient(client)).rejects.toThrow(/CHECK constraint failed/);
    expect(await schema()).toEqual(before);
    expect(await products()).toEqual(beforeProducts);
    await client.execute("UPDATE Sale SET productId='pieza'");
    await migrateWithClient(client);
  });
});
