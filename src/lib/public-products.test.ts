import { PrismaClient } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getPublicProduct } from "./public-products";
import { registerSale } from "./sales";

const prisma = new PrismaClient();

beforeEach(async () => {
  await prisma.sale.deleteMany();
  await prisma.product.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.business.deleteMany();
});
afterAll(() => prisma.$disconnect());

describe("disponibilidad pública", () => {
  it("deja de devolver la pieza en cuanto se registra la venta", async () => {
    const business = await prisma.business.create({ data: { name: "Tienda", slug: `tienda-${crypto.randomUUID()}` } });
    const product = await prisma.product.create({ data: { businessId: business.id, reference: "PZ-PUBLICA001", name: "Banco", category: "Hogar", condition: "Con detalles", defects: "Marca superficial", description: "Banco usado de madera", photoPath: "/test.jpg", costCents: 10000, priceCents: 18000 } });
    expect(await getPublicProduct(prisma, business.slug, product.id)).toMatchObject({ id: product.id, status: "AVAILABLE" });
    await registerSale(prisma, { businessId: business.id, productId: product.id, amountCents: 17500 });
    expect(await getPublicProduct(prisma, business.slug, product.id)).toBeNull();
  });

  it("no expone una pieza mediante el slug de otro negocio", async () => {
    const [first, second] = await Promise.all([
      prisma.business.create({ data: { name: "Uno", slug: `uno-${crypto.randomUUID()}` } }),
      prisma.business.create({ data: { name: "Dos", slug: `dos-${crypto.randomUUID()}` } }),
    ]);
    const product = await prisma.product.create({ data: { businessId: first.id, reference: "PZ-AISLADA001", name: "Banco", category: "Hogar", condition: "Buen estado", description: "Banco usado de madera", photoPath: "/test.jpg", costCents: 10000, priceCents: 18000 } });
    expect(await getPublicProduct(prisma, second.slug, product.id)).toBeNull();
  });
});
