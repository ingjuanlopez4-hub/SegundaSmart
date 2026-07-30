import { PrismaClient } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { generateProductReference, getProductIdFromPublicUrl, normalizeProductReference, publicProductPath } from "./product-reference";
import { normalizeProductQuery, productSearchWhere } from "./product-search";

const prisma = new PrismaClient();

beforeEach(async () => {
  await prisma.sale.deleteMany();
  await prisma.product.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.business.deleteMany();
});
afterAll(() => prisma.$disconnect());

describe("referencias y búsqueda de piezas", () => {
  it("genera y normaliza referencias estables", () => {
    expect(generateProductReference()).toMatch(/^PZ-[A-F0-9]{10}$/);
    expect(normalizeProductReference(" pz abc123 ")).toBe("PZ-ABC123");
    expect(normalizeProductQuery(["  cámara  ", "ignorado"])).toBe("cámara");
  });

  it("solo extrae IDs de una URL pública canónica del negocio esperado", () => {
    const id = "cm12345678901234567890123";
    const path = publicProductPath("mi-tienda", id);
    expect(getProductIdFromPublicUrl(`https://segunda.mx${path}?origen=qr`, "mi-tienda")).toBe(id);
    expect(getProductIdFromPublicUrl(`https://segunda.mx${path}`, "otra-tienda")).toBeNull();
    expect(getProductIdFromPublicUrl("https://segunda.mx/catalogo/mi-tienda", "mi-tienda")).toBeNull();
  });

  it("busca por nombre, referencia y URL sin cruzar negocios", async () => {
    const [first, second] = await Promise.all([
      prisma.business.create({ data: { name: "Uno", slug: `uno-${crypto.randomUUID()}` } }),
      prisma.business.create({ data: { name: "Dos", slug: `dos-${crypto.randomUUID()}` } }),
    ]);
    const own = await prisma.product.create({ data: { businessId: first.id, reference: "PZ-CAMARA001", name: "Cámara instantánea", category: "Foto", condition: "Buen estado", description: "Cámara usada y funcional", photoPath: "/test.jpg", costCents: 10000, priceCents: 18000 } });
    await prisma.product.create({ data: { businessId: second.id, reference: "PZ-CAMARA001", name: "Cámara ajena", category: "Foto", condition: "Buen estado", description: "Cámara de otro negocio", photoPath: "/test.jpg", costCents: 10000, priceCents: 18000 } });

    const search = async (query: string) => prisma.product.findMany({ where: productSearchWhere({ businessId: first.id, businessSlug: first.slug, query }) });
    expect((await search("instantánea")).map((product) => product.id)).toEqual([own.id]);
    expect((await search("pz camara001")).map((product) => product.id)).toEqual([own.id]);
    expect((await search(`https://segunda.mx${publicProductPath(first.slug, own.id)}`)).map((product) => product.id)).toEqual([own.id]);
    expect(await search(`https://segunda.mx${publicProductPath(second.slug, own.id)}`)).toEqual([]);
  });

  it("impide referencias repetidas dentro del negocio y permite la misma en otro", async () => {
    const [first, second] = await Promise.all([
      prisma.business.create({ data: { name: "Uno", slug: `uno-${crypto.randomUUID()}` } }),
      prisma.business.create({ data: { name: "Dos", slug: `dos-${crypto.randomUUID()}` } }),
    ]);
    const data = { reference: "PZ-UNICA0001", name: "Mesa", category: "Hogar", condition: "Buen estado", description: "Mesa usada de madera", photoPath: "/test.jpg", costCents: 10000, priceCents: 18000 };
    await prisma.product.create({ data: { ...data, businessId: first.id } });
    await expect(prisma.product.create({ data: { ...data, businessId: first.id } })).rejects.toMatchObject({ code: "P2002" });
    await expect(prisma.product.create({ data: { ...data, businessId: second.id } })).resolves.toBeDefined();
  });
});
