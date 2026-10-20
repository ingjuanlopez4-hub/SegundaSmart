import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requireApiUser: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireApiUser: mocks.requireApiUser }));
vi.mock("@/lib/db", async () => {
  const { PrismaClient } = await import("@prisma/client");
  return { db: new PrismaClient() };
});

import { db } from "@/lib/db";
import { POST } from "./route";

let businessId: string;
let otherBusinessId: string;
let productId: string;

function request(overrides: Record<string, unknown> = {}) {
  return new Request("http://localhost/api/ventas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, amount: "175.50", ...overrides }) });
}

beforeEach(async () => {
  vi.resetAllMocks();
  await db.sale.deleteMany();
  await db.product.deleteMany();
  await db.session.deleteMany();
  await db.user.deleteMany();
  await db.business.deleteMany();
  const business = await db.business.create({ data: { name: "Propietario", slug: `owned-${crypto.randomUUID()}` } });
  const other = await db.business.create({ data: { name: "Otro negocio", slug: `other-${crypto.randomUUID()}` } });
  businessId = business.id;
  otherBusinessId = other.id;
  const product = await db.product.create({ data: { businessId, reference: "PZ-VENTATEST", name: "Lámpara", category: "Hogar", condition: "Buen estado", description: "Lámpara usada de mesa", photoPath: "/test.jpg", costCents: 10000, priceCents: 18000 } });
  productId = product.id;
  mocks.requireApiUser.mockResolvedValue({ businessId });
});

afterAll(() => db.$disconnect());

describe("contrato HTTP de ventas", () => {
  it("requiere sesión y no modifica la pieza", async () => {
    mocks.requireApiUser.mockResolvedValue(null);
    expect((await POST(request())).status).toBe(401);
    expect(await db.sale.count()).toBe(0);
    expect((await db.product.findUniqueOrThrow({ where: { id: productId } })).status).toBe("AVAILABLE");
  });

  it.each<Record<string, unknown>>([
    { amount: "0" }, { amount: "-1" }, { amount: "1.001" },
    { amount: "1000000.01" }, { amount: " " }, { amount: 175 }, { productId: "not-an-id" },
  ])("rechaza entradas inválidas sin crear ventas (%j)", async (overrides) => {
    expect((await POST(request(overrides))).status).toBe(422);
    expect(await db.sale.count()).toBe(0);
    expect((await db.product.findUniqueOrThrow({ where: { id: productId } })).status).toBe("AVAILABLE");
  });

  it("toma el negocio de la sesión y convierte el importe a centavos", async () => {
    const response = await POST(request({ businessId: otherBusinessId }));
    expect(response.status).toBe(201);
    const { id } = await response.json();
    expect(await db.sale.findUniqueOrThrow({ where: { id } })).toMatchObject({ businessId, productId, amountCents: 17550 });
    expect((await db.product.findUniqueOrThrow({ where: { id: productId } })).status).toBe("SOLD");
  });

  it("devuelve conflicto sin exponer una pieza ajena", async () => {
    mocks.requireApiUser.mockResolvedValue({ businessId: otherBusinessId });
    const response = await POST(request({ businessId }));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "El producto ya fue vendido o no existe" });
    expect(await db.sale.count()).toBe(0);
    expect((await db.product.findUniqueOrThrow({ where: { id: productId } })).status).toBe("AVAILABLE");
  });

  it("responde 409 al reintentar una venta ya confirmada", async () => {
    expect((await POST(request())).status).toBe(201);
    expect((await POST(request())).status).toBe(409);
    expect(await db.sale.count({ where: { productId } })).toBe(1);
  });
});
