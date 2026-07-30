import { PrismaClient } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { ProductAlreadySoldError, registerSale } from "./sales";

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
  const first = await prisma.business.create({ data: { name: "Tienda Uno", slug: `uno-${crypto.randomUUID()}` } });
  const second = await prisma.business.create({ data: { name: "Tienda Dos", slug: `dos-${crypto.randomUUID()}` } });
  const product = await prisma.product.create({ data: { businessId: first.id, reference: "PZ-LAMPARA01", name: "Lámpara", category: "Hogar", condition: "Buen estado", description: "Lámpara de mesa usada", photoPath: "/test.jpg", costCents: 10000, priceCents: 18000 } });
  return { first, second, product };
}

describe("registro transaccional de ventas", () => {
  it("marca la pieza vendida y calcula datos persistidos", async () => {
    const { first, product } = await fixture();
    const sale = await registerSale(prisma, { businessId: first.id, productId: product.id, amountCents: 17500 });
    expect(sale.amountCents).toBe(17500);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).status).toBe("SOLD");
  });

  it("impide vender dos veces la misma pieza", async () => {
    const { first, product } = await fixture();
    await registerSale(prisma, { businessId: first.id, productId: product.id, amountCents: 18000 });
    await expect(registerSale(prisma, { businessId: first.id, productId: product.id, amountCents: 18000 })).rejects.toBeInstanceOf(ProductAlreadySoldError);
    expect(await prisma.sale.count({ where: { productId: product.id } })).toBe(1);
  });

  it("acepta una sola venta cuando dos operaciones reclaman la pieza a la vez", async () => {
    const { first, product } = await fixture();
    const results = await Promise.allSettled([
      registerSale(prisma, { businessId: first.id, productId: product.id, amountCents: 18000 }),
      registerSale(prisma, { businessId: first.id, productId: product.id, amountCents: 17500 }),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(await prisma.sale.count({ where: { productId: product.id } })).toBe(1);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).status).toBe("SOLD");
  });

  it("no permite vender una pieza perteneciente a otro negocio", async () => {
    const { second, product } = await fixture();
    await expect(registerSale(prisma, { businessId: second.id, productId: product.id, amountCents: 18000 })).rejects.toBeInstanceOf(ProductAlreadySoldError);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).status).toBe("AVAILABLE");
  });
});
