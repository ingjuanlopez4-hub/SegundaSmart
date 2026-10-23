import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const cookie = vi.hoisted(() => ({ token: "" }));
vi.mock("next/headers", () => ({ cookies: async () => ({
  get: () => cookie.token ? { value: cookie.token } : undefined,
  set: (_name: string, value: string) => { cookie.token = value; },
}) }));
vi.mock("@/lib/db", async () => {
  const { PrismaClient } = await import("@prisma/client");
  return { db: new PrismaClient() };
});

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { POST as register } from "../auth/register/route";
import { POST as login } from "../auth/login/route";
import { POST as create } from "./route";
import { GET as read, POST as select } from "./[id]/route";
import { GET as qr } from "../productos/[id]/qr/route";
import { POST as sell } from "../ventas/route";

const request = (data: unknown) => new Request("http://localhost/api/negocios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
const context = (id: string) => ({ params: Promise.resolve({ id }) });
const account = { name: "Propietaria QA", businessName: "Negocio original", email: "owner@example.test", password: "Local-password-QA!" };
let originalId: string;
let ownerId: string;
let ownerToken: string;

beforeEach(async () => {
  cookie.token = "";
  await db.sale.deleteMany();
  await db.product.deleteMany();
  await db.session.deleteMany();
  await db.businessOwnership.deleteMany();
  await db.user.deleteMany();
  await db.business.deleteMany();
  expect((await register(request(account))).status).toBe(201);
  const user = (await getCurrentUser())!;
  originalId = user.businessId;
  ownerId = user.id;
  ownerToken = cookie.token;
});
afterAll(() => db.$disconnect());

describe("creación autenticada de negocio con SQLite y sesiones reales", () => {
  it("crea, asocia al propietario y persiste después de una nueva sesión; conserva acceso al negocio anterior", async () => {
    const response = await create(request({ name: "  Segundo negocio  ", requestKey: crypto.randomUUID(), userId: "intruso", businessId: originalId }));
    expect(response.status).toBe(201);
    const { id } = await response.json();
    expect(await db.business.findUniqueOrThrow({ where: { id } })).toMatchObject({ name: "Segundo negocio" });
    expect(await db.businessOwnership.findUniqueOrThrow({ where: { userId_businessId: { userId: ownerId, businessId: id } } })).toMatchObject({ userId: ownerId });
    cookie.token = "";
    expect((await login(request(account))).status).toBe(200);
    expect((await getCurrentUser())?.businessId).toBe(id);
    expect((await read(request({}), context(id))).status).toBe(200);
    expect((await select(request({}), context(originalId))).status).toBe(200);
    expect((await getCurrentUser())?.businessId).toBe(originalId);
    expect(await db.business.count()).toBe(2);
  });

  it("rechaza consulta y selección por un usuario ajeno que conoce el ID; mantiene aisladas las piezas", async () => {
    const { id } = await (await create(request({ name: "Privado", requestKey: crypto.randomUUID() }))).json();
    const piece = await db.product.create({ data: { businessId: id, reference: "PZ-PRIVATE", name: "Mesa", category: "Hogar", condition: "Buen estado", description: "Mesa de segunda mano", photoPath: "/test.jpg", costCents: 100, priceCents: 200 } });
    expect((await register(request({ ...account, email: "other@example.test", businessName: "Ajeno" }))).status).toBe(201);
    const other = (await getCurrentUser())!;
    expect((await read(request({}), context(id))).status).toBe(404);
    expect((await select(request({ userId: ownerId }), context(id))).status).toBe(404);
    expect((await qr(request({}), context(piece.id))).status).toBe(404);
    expect((await sell(request({ productId: piece.id, amount: "2", businessId: id, userId: ownerId }))).status).toBe(409);
    expect(await db.sale.count()).toBe(0);
    expect((await db.product.findUniqueOrThrow({ where: { id: piece.id } })).status).toBe("AVAILABLE");
    expect((await getCurrentUser())?.businessId).toBe(other.businessId);
    cookie.token = ownerToken;
    expect((await read(request({}), context(id))).status).toBe(200);
    expect((await getCurrentUser())?.businessId).toBe(id);
  });

  it.each(["", " ", "a", "x".repeat(101), 123, null])("rechaza nombre inválido %j sin dejar filas incompletas", async (name) => {
    expect((await create(request({ name, requestKey: crypto.randomUUID() }))).status).toBe(422);
    expect(await db.business.count()).toBe(1);
    expect(await db.businessOwnership.count()).toBe(1);
    expect((await getCurrentUser())?.businessId).toBe(originalId);
  });

  it("rechaza JSON inválido y solicitud sin clave de idempotencia", async () => {
    expect((await create(new Request("http://localhost", { method: "POST", body: "{" }))).status).toBe(422);
    expect((await create(request({ name: "Negocio" }))).status).toBe(422);
    expect(await db.business.count()).toBe(1);
  });

  it("exige sesión vigente antes de crear, consultar o seleccionar", async () => {
    await db.session.updateMany({ data: { expiresAt: new Date(0) } });
    for (const token of [ownerToken, "", "token-inventado"]) {
      cookie.token = token;
      expect((await create(request({ name: "Negocio", requestKey: crypto.randomUUID() }))).status).toBe(401);
      expect((await read(request({}), context(originalId))).status).toBe(401);
      expect((await select(request({}), context(originalId))).status).toBe(401);
    }
    expect(await db.business.count()).toBe(1);
  });

  it("un doble envío concurrente y su reintento crean exactamente un negocio", async () => {
    const data = { name: "Una sola vez", requestKey: crypto.randomUUID() };
    const responses = await Promise.all([create(request(data)), create(request(data))]);
    expect(responses.map((r) => r.status)).toEqual([201, 201]);
    const ids = await Promise.all(responses.map((r) => r.json()));
    expect(ids[0].id).toBe(ids[1].id);
    expect((await create(request(data))).status).toBe(201);
    expect(await db.business.count()).toBe(2);
    expect(await db.businessOwnership.count()).toBe(2);
  });

  it("revierte negocio y propiedad si falla la selección; permite reintento", async () => {
    await db.$executeRawUnsafe(`CREATE TRIGGER fail_business_selection BEFORE UPDATE OF businessId ON User BEGIN SELECT RAISE(ABORT, 'forced_selection_failure'); END`);
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const data = { name: "Atómico", requestKey: crypto.randomUUID() };
    try {
      expect((await create(request(data))).status).toBe(500);
      expect(await db.business.count()).toBe(1);
      expect(await db.businessOwnership.count()).toBe(1);
      expect((await getCurrentUser())?.businessId).toBe(originalId);
    } finally {
      await db.$executeRawUnsafe("DROP TRIGGER fail_business_selection");
      error.mockRestore();
    }
    expect((await create(request(data))).status).toBe(201);
  });
});
