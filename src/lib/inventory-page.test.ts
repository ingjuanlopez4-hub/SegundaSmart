import { PrismaClient } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getInventoryPage, parseInventoryPage } from "./inventory-page";
import { inventoryHref } from "./inventory-filters";

const prisma = new PrismaClient();
beforeEach(async () => {
  await prisma.sale.deleteMany();
  await prisma.product.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.business.deleteMany();
});
afterAll(() => prisma.$disconnect());

async function fixture() {
  const own = await prisma.business.create({ data: { name: "Propio", slug: "propio" } });
  const other = await prisma.business.create({ data: { name: "Ajeno", slug: "ajeno" } });
  await prisma.product.createMany({ data: Array.from({ length: 70 }, (_, i) => ({
    id: `c${String(i).padStart(24, "0")}`, businessId: i < 65 ? own.id : other.id,
    reference: `PZ-${i}`, name: i % 2 ? "Mesa" : "Silla", category: "Hogar", condition: "Buen estado",
    description: "Fixture", photoPath: "/fixture.jpg", costCents: 100, priceCents: 200,
    status: i < 30 ? "SOLD" : "AVAILABLE", createdAt: new Date("2026-01-01"),
  })) });
  return { businessId: own.id, businessSlug: own.slug, query: "", status: "todas" as const, page: 1 };
}

describe("inventario paginado", () => {
  it("recorre todas las piezas propias sin duplicarlas incluso con fechas idénticas", async () => {
    const input = await fixture();
    const pages = await Promise.all([1, 2, 3].map((page) => getInventoryPage(prisma, { ...input, page })));
    expect(pages.map((p) => p.products.length)).toEqual([24, 24, 17]);
    expect(new Set(pages.flatMap((p) => p.products.map((product) => product.id))).size).toBe(65);
    for (const page of pages) {
      expect(page).toMatchObject({ totalProducts: 65, total: 65, available: 35, sold: 30, totalPages: 3 });
      expect(page.products.every((p) => p.businessId === input.businessId)).toBe(true);
    }
  });

  it("mantiene conteos globales de búsqueda y filtra el estado antes del límite", async () => {
    const input = await fixture();
    const result = await getInventoryPage(prisma, { ...input, query: "Mesa", status: "vendidas" });
    expect(result).toMatchObject({ totalProducts: 65, total: 32, available: 17, sold: 15, matching: 15 });
    expect(result.products).toHaveLength(15);
    expect(result.products.every((p) => p.status === "SOLD" && p.name === "Mesa")).toBe(true);
    expect(inventoryHref("Mesa", "vendidas", 2)).toBe("/app/inventario?q=Mesa&estado=vendidas&pagina=2");
    expect(inventoryHref("Mesa", "vendidas")).not.toContain("pagina");
  });

  it("normaliza páginas inválidas, limita páginas obsoletas y conserva el estado vacío", async () => {
    for (const raw of [undefined, "0", "-1", "1.5", "Infinity", "9007199254740992", "abc"]) expect(parseInventoryPage(raw)).toBe(1);
    expect(parseInventoryPage(["2", "3"])).toBe(2);
    const input = await fixture();
    expect((await getInventoryPage(prisma, { ...input, page: Number.MAX_SAFE_INTEGER })).page).toBe(3);
    expect(await getInventoryPage(prisma, { ...input, query: "Inexistente", page: 99 })).toMatchObject({ products: [], matching: 0, totalProducts: 65, page: 1, totalPages: 1 });
  });

  it("refleja una venta en consultas posteriores sin caché de disponibilidad", async () => {
    const input = await fixture();
    const before = await getInventoryPage(prisma, { ...input, status: "disponibles" });
    await prisma.product.update({ where: { id: before.products[0].id }, data: { status: "SOLD" } });
    const after = await getInventoryPage(prisma, { ...input, status: "disponibles" });
    expect(after.available).toBe(before.available - 1);
    expect(after.sold).toBe(before.sold + 1);
    expect(after.products.some((p) => p.id === before.products[0].id)).toBe(false);
  });
});
