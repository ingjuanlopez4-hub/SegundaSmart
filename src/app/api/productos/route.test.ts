import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireApiUser: vi.fn(),
  createProduct: vi.fn(),
  storePhoto: vi.fn(),
  removePhoto: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requireApiUser: mocks.requireApiUser }));
vi.mock("@/lib/db", () => ({ db: { product: { create: mocks.createProduct } } }));
vi.mock("@/lib/photo-storage", () => ({ storeProductPhoto: mocks.storePhoto }));

import { POST } from "./route";

function productRequest(type: string, bytes: number[], overrides: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    name: "Silla", category: "Hogar", condition: "Buen estado", defects: "",
    description: "Silla usada de madera", cost: "100", price: "180", ...overrides,
  })) form.set(key, value);
  form.set("photo", new File([new Uint8Array(bytes)], "foto", { type }));
  return new Request("http://localhost/api/productos", { method: "POST", body: form });
}

const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const webp = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50];

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireApiUser.mockResolvedValue({ businessId: "business-owned" });
  mocks.createProduct.mockResolvedValue({ id: "product-created" });
  mocks.removePhoto.mockResolvedValue(undefined);
  mocks.storePhoto.mockResolvedValue({ url: "/photo.png", remove: mocks.removePhoto });
});

describe("validación de fotografías antes de efectos externos", () => {
  it.each([
    ["constructor", webp],
    ["image/gif", webp],
    ["image/png", png.slice(0, 4)],
    ["image/png", [...png.slice(0, 4), 0, 0, 0, 0]],
    ["image/webp", webp.map((byte, index) => index === 3 ? 0 : byte)],
    ["image/webp", webp.slice(0, 11)],
    ["image/jpeg", png],
    ["image/jpeg", []],
  ])("rechaza MIME/firma inválidos (%s, %j) sin almacenar", async (type, bytes) => {
    const response = await POST(productRequest(type, bytes));
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: expect.any(String) });
    expect(mocks.storePhoto).not.toHaveBeenCalled();
    expect(mocks.createProduct).not.toHaveBeenCalled();
  });

  it.each([
    ["image/png", png, "png"],
    ["image/webp", webp, "webp"],
    ["image/jpeg", [0xff, 0xd8, 0xff], "jpg"],
  ])("mantiene el flujo de creación para una firma %s", async (type, bytes, extension) => {
    const response = await POST(productRequest(type, bytes));
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: "product-created" });
    expect(mocks.storePhoto).toHaveBeenCalledWith("business-owned", new Uint8Array(bytes), extension);
    expect(mocks.createProduct).toHaveBeenCalledWith({ data: expect.objectContaining({
      businessId: "business-owned", photoPath: "/photo.png", costCents: 10_000, priceCents: 18_000,
    }) });
  });

  it("no procesa ni almacena fotografías sin sesión", async () => {
    mocks.requireApiUser.mockResolvedValue(null);
    const response = await POST(productRequest("image/png", png));
    expect(response.status).toBe(401);
    expect(mocks.storePhoto).not.toHaveBeenCalled();
    expect(mocks.createProduct).not.toHaveBeenCalled();
  });

  it.each<Record<string, string>>([
    { name: "  " },
    { category: " " },
    { description: "          " },
    { condition: "Con detalles", defects: "  " },
    { cost: "1000000.01" },
    { price: "0" },
    { price: "1.001" },
  ])("valida los datos antes de guardar la foto (%j)", async (overrides) => {
    const response = await POST(productRequest("image/png", png, overrides));
    expect(response.status).toBe(422);
    expect(mocks.storePhoto).not.toHaveBeenCalled();
    expect(mocks.createProduct).not.toHaveBeenCalled();
  });

  it("rechaza fotos mayores a 5 MB antes de almacenarlas", async () => {
    const response = await POST(productRequest("image/png", [...png, ...new Array<number>(5 * 1024 * 1024).fill(0)]));
    expect(response.status).toBe(422);
    expect(mocks.storePhoto).not.toHaveBeenCalled();
    expect(mocks.createProduct).not.toHaveBeenCalled();
  });

  it("elimina la foto si falla la persistencia y permite reintentar", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      mocks.createProduct.mockRejectedValueOnce(new Error("database unavailable"));
      const response = await POST(productRequest("image/png", png));
      expect(response.status).toBe(500);
      expect(mocks.removePhoto).toHaveBeenCalledOnce();
      expect(await response.json()).toEqual({ error: "No pudimos completar la operación. Intenta de nuevo." });

      const retry = await POST(productRequest("image/png", png));
      expect(retry.status).toBe(201);
      expect(mocks.removePhoto).toHaveBeenCalledOnce();
    } finally {
      log.mockRestore();
    }
  });
});
