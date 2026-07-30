import { PrismaClient } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  getSalesMetrics,
  getSalesPage,
  parseSalesPage,
  SALES_PAGE_SIZE,
} from "./sale-history";

const prisma = new PrismaClient();

beforeEach(async () => {
  await prisma.sale.deleteMany();
  await prisma.product.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.business.deleteMany();
});
afterAll(() => prisma.$disconnect());

async function createSales(businessId: string, count: number) {
  const products = Array.from({ length: count }, (_, index) => ({
    id: `${businessId}-product-${index}`,
    businessId,
    reference: `PZ-${String(index).padStart(10, "0")}`,
    name: `Producto ${index}`,
    category: "Hogar",
    condition: "Buen estado",
    description: "Artículo usado",
    photoPath: "/test.jpg",
    costCents: 1_000 + index,
    priceCents: 2_000 + index,
    status: "SOLD" as const,
  }));
  await prisma.product.createMany({ data: products });
  await prisma.sale.createMany({
    data: products.map((product, index) => ({
      id: `${businessId}-sale-${String(index).padStart(3, "0")}`,
      businessId,
      productId: product.id,
      amountCents: 2_000 + index,
      soldAt: new Date("2026-07-29T12:00:00.000Z"),
    })),
  });
}

describe("historial y métricas de ventas", () => {
  it("valida el número de página", () => {
    expect(parseSalesPage("2")).toBe(2);
    expect(parseSalesPage(["3", "4"])).toBe(3);
    expect(parseSalesPage("0")).toBe(1);
    expect(parseSalesPage("1.5")).toBe(1);
    expect(parseSalesPage("texto")).toBe(1);
  });

  it("incluye las 51 ventas en los totales y pagina sin omisiones", async () => {
    const business = await prisma.business.create({
      data: { name: "Tienda", slug: `tienda-${crypto.randomUUID()}` },
    });
    await createSales(business.id, 51);

    const metrics = await getSalesMetrics(prisma, business.id);
    expect(metrics).toEqual({ count: 51, revenue: 103_275, profit: 51_000 });

    const pages = await Promise.all(
      [1, 2, 3].map((page) =>
        getSalesPage(prisma, business.id, page, metrics.count),
      ),
    );
    const ids = pages.flatMap((result) => result.sales.map((sale) => sale.id));
    expect(pages.map((result) => result.sales.length)).toEqual([
      SALES_PAGE_SIZE,
      SALES_PAGE_SIZE,
      11,
    ]);
    expect(pages[2]).toMatchObject({ page: 3, totalPages: 3 });
    expect(new Set(ids).size).toBe(51);
  });

  it("ajusta páginas fuera de rango y conserva el estado vacío", async () => {
    const business = await prisma.business.create({
      data: { name: "Vacía", slug: `vacia-${crypto.randomUUID()}` },
    });

    expect(await getSalesMetrics(prisma, business.id)).toEqual({
      count: 0,
      revenue: 0,
      profit: 0,
    });
    const page = await getSalesPage(prisma, business.id, 99, 0);
    expect(page).toMatchObject({ sales: [], page: 1, totalPages: 1 });
  });

  it("aísla métricas e historial entre negocios", async () => {
    const [first, second] = await Promise.all([
      prisma.business.create({
        data: { name: "Uno", slug: `uno-${crypto.randomUUID()}` },
      }),
      prisma.business.create({
        data: { name: "Dos", slug: `dos-${crypto.randomUUID()}` },
      }),
    ]);
    await createSales(first.id, 2);
    await createSales(second.id, 3);

    expect((await getSalesMetrics(prisma, first.id)).count).toBe(2);
    const page = await getSalesPage(prisma, first.id, 1, 2);
    expect(page.sales).toHaveLength(2);
    expect(page.sales.every((sale) => sale.businessId === first.id)).toBe(true);
  });
});
