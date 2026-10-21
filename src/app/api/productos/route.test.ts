import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import { deflateSync } from "node:zlib";

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

function productRequest(type: string, bytes: number[] | Uint8Array, overrides: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    name: "Silla", category: "Hogar", condition: "Buen estado", defects: "",
    description: "Silla usada de madera", cost: "100", price: "180", ...overrides,
  })) form.set(key, value);
  form.set("photo", new File([new Uint8Array(bytes)], "foto", { type }));
  return new Request("http://localhost/api/productos", { method: "POST", body: form });
}

const pngHeader = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const webpHeader = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50];
let png: Buffer;
let jpeg: Buffer;
let webp: Buffer;

function image(width: number, height: number) {
  return sharp({ create: { width, height, channels: 3, background: "#369" } });
}

// Real PNG/APNG chunks, including CRCs, so the fixtures do not depend on sharp's
// animation encoder (its PNG decoder only exposes the default image).
function pngChunk(type: string, data: Buffer) {
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  let crc = 0xffffffff;
  for (const byte of body) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([length, body, checksum]);
}

function apngFixture(corruptSecondFrame: boolean) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(1, 0);
  header.writeUInt32BE(1, 4);
  header[8] = 8;
  header[9] = 6; // RGBA, 8 bits per channel.
  const animation = Buffer.alloc(8);
  animation.writeUInt32BE(2, 0);
  function frameControl(sequence: number) {
    const data = Buffer.alloc(26);
    data.writeUInt32BE(sequence, 0);
    data.writeUInt32BE(1, 4);
    data.writeUInt32BE(1, 8);
    data.writeUInt16BE(1, 20);
    data.writeUInt16BE(10, 22);
    return pngChunk("fcTL", data);
  }
  const firstFrame = deflateSync(Buffer.from([0, 255, 0, 0, 255]));
  const secondFrame = corruptSecondFrame ? Buffer.from([0, 0, 0]) : deflateSync(Buffer.from([0, 0, 255, 0, 255]));
  const sequence = Buffer.alloc(4);
  sequence.writeUInt32BE(2);
  const signature = Buffer.from(pngHeader);
  const ihdr = pngChunk("IHDR", header);
  const end = pngChunk("IEND", Buffer.alloc(0));
  return {
    bytes: Buffer.concat([signature, ihdr, pngChunk("acTL", animation), frameControl(0),
      pngChunk("IDAT", firstFrame), frameControl(1), pngChunk("fdAT", Buffer.concat([sequence, secondFrame])), end]),
    secondFramePng: Buffer.concat([signature, ihdr, pngChunk("IDAT", secondFrame), end]),
  };
}

beforeAll(async () => {
  [png, jpeg, webp] = await Promise.all([
    image(3, 2).png().toBuffer(), image(3, 2).jpeg().toBuffer(), image(3, 2).webp().toBuffer(),
  ]);
});

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireApiUser.mockResolvedValue({ businessId: "business-owned" });
  mocks.createProduct.mockResolvedValue({ id: "product-created" });
  mocks.removePhoto.mockResolvedValue(undefined);
  mocks.storePhoto.mockResolvedValue({ url: "/photo.png", remove: mocks.removePhoto });
});

describe("validación de fotografías antes de efectos externos", () => {
  it.each([
    ["constructor", webpHeader],
    ["image/gif", webpHeader],
    ["image/png", pngHeader.slice(0, 4)],
    ["image/png", [...pngHeader.slice(0, 4), 0, 0, 0, 0]],
    ["image/png", pngHeader],
    ["image/webp", webpHeader],
    ["image/jpeg", [0xff, 0xd8, 0xff]],
    ["image/jpeg", []],
  ])("rechaza MIME/firma inválidos (%s, %j) sin almacenar", async (type, bytes) => {
    const response = await POST(productRequest(type, bytes));
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: expect.any(String) });
    expect(mocks.storePhoto).not.toHaveBeenCalled();
    expect(mocks.createProduct).not.toHaveBeenCalled();
  });

  it.each([
    ["image/png", () => png, "png"],
    ["image/webp", () => webp, "webp"],
    ["image/jpeg", () => jpeg, "jpg"],
  ] as const)("crea un producto con una imagen real %s", async (type, fixture, extension) => {
    const bytes = fixture();
    const response = await POST(productRequest(type, bytes));
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: "product-created" });
    expect(mocks.storePhoto).toHaveBeenCalledWith("business-owned", new Uint8Array(bytes), extension);
    expect(mocks.createProduct).toHaveBeenCalledWith({ data: expect.objectContaining({
      businessId: "business-owned", photoPath: "/photo.png", costCents: 10_000, priceCents: 18_000,
    }) });
  });

  it.each(["png", "jpeg", "webp"])("rechaza una imagen %s truncada aunque conserve cabecera y metadatos", async (format) => {
    const original = format === "png" ? png : format === "jpeg" ? jpeg : webp;
    const truncated = original.subarray(0, original.length - (format === "jpeg" ? 20 : 15));
    const response = await POST(productRequest(`image/${format}`, truncated));
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "El archivo no contiene una imagen válida" });
    expect(mocks.storePhoto).not.toHaveBeenCalled();
    expect(mocks.createProduct).not.toHaveBeenCalled();
  });

  it.each([
    ["image/jpeg", () => png], ["image/png", () => webp], ["image/webp", () => jpeg],
  ] as const)("rechaza una imagen real con MIME falso %s", async (mime, fixture) => {
    const response = await POST(productRequest(mime, fixture()));
    expect(response.status).toBe(422);
    expect(mocks.storePhoto).not.toHaveBeenCalled();
    expect(mocks.createProduct).not.toHaveBeenCalled();
  });

  it("rechaza un PNG con datos de píxeles incompletos aunque conserve IEND", async () => {
    const bytes = Buffer.concat([png.subarray(0, png.length - 25), png.subarray(-12)]);
    const response = await POST(productRequest("image/png", bytes));
    expect(response.status).toBe(422);
    expect(mocks.storePhoto).not.toHaveBeenCalled();
    expect(mocks.createProduct).not.toHaveBeenCalled();
  });

  it("rechaza WebP animado en lugar de validar solamente su primer fotograma", async () => {
    const pixels = Buffer.from([255, 0, 0, 0, 255, 0]);
    const bytes = await sharp(pixels, { raw: { width: 1, height: 2, channels: 3, pageHeight: 1 } })
      .webp({ loop: 0, delay: [100, 100] }).toBuffer();
    expect((await sharp(bytes).metadata()).pages).toBe(2);
    const response = await POST(productRequest("image/webp", bytes));
    expect(response.status).toBe(422);
    expect(mocks.storePhoto).not.toHaveBeenCalled();
    expect(mocks.createProduct).not.toHaveBeenCalled();
  });

  it.each([false, true])("rechaza APNG incluso con segundo fotograma corrupto=%s", async (corrupt) => {
    const fixture = apngFixture(corrupt);
    // Establish that the first frame decodes, but says nothing about later frames.
    expect(await sharp(fixture.bytes).raw().toBuffer()).toEqual(Buffer.from([255, 0, 0, 255]));
    if (corrupt) {
      await expect(sharp(fixture.secondFramePng, { failOn: "warning" }).raw().toBuffer()).rejects.toThrow();
    } else {
      expect(await sharp(fixture.secondFramePng).raw().toBuffer()).toEqual(Buffer.from([0, 255, 0, 255]));
    }
    const response = await POST(productRequest("image/png", fixture.bytes));
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "El archivo no contiene una imagen válida" });
    expect(mocks.storePhoto).not.toHaveBeenCalled();
    expect(mocks.createProduct).not.toHaveBeenCalled();
  });

  it("acepta PNG estático con nombres de chunks APNG dentro de texto, sin falsos positivos", async () => {
    const text = pngChunk("tEXt", Buffer.from("Comment\0acTL fcTL fdAT"));
    const bytes = Buffer.concat([png.subarray(0, -12), text, png.subarray(-12)]);
    const response = await POST(productRequest("image/png", bytes));
    expect(response.status).toBe(201);
    expect(mocks.storePhoto).toHaveBeenCalledWith("business-owned", new Uint8Array(bytes), "png");
    expect(mocks.createProduct).toHaveBeenCalledOnce();
  });

  it.each(["acTL", "fcTL", "fdAT"])("rechaza el chunk de animación %s aun sin otros marcadores", async (type) => {
    const bytes = Buffer.concat([png.subarray(0, -12), pngChunk(type, Buffer.alloc(0)), png.subarray(-12)]);
    const response = await POST(productRequest("image/png", bytes));
    expect(response.status).toBe(422);
    expect(mocks.storePhoto).not.toHaveBeenCalled();
    expect(mocks.createProduct).not.toHaveBeenCalled();
  });

  it.each([0x7fffffff, 0xffffffff])("rechaza un chunk PNG cuya longitud desborda el archivo (%i)", async (length) => {
    const text = pngChunk("tEXt", Buffer.from("Comment\0short"));
    text.writeUInt32BE(length, 0);
    const bytes = Buffer.concat([png.subarray(0, -12), text, png.subarray(-12)]);
    const response = await POST(productRequest("image/png", bytes));
    expect(response.status).toBe(422);
    expect(mocks.storePhoto).not.toHaveBeenCalled();
    expect(mocks.createProduct).not.toHaveBeenCalled();
  });

  it.each([[8193, 1], [1, 8193], [4097, 4096]])("rechaza dimensiones excesivas %i × %i en un PNG real comprimido", async (width, height) => {
    const bytes = await image(width, height).png().toBuffer();
    expect(bytes.length).toBeLessThan(5 * 1024 * 1024);
    const response = await POST(productRequest("image/png", bytes));
    expect(response.status).toBe(422);
    expect(mocks.storePhoto).not.toHaveBeenCalled();
    expect(mocks.createProduct).not.toHaveBeenCalled();
  });

  it.each([[8192, 1], [4096, 4096]])("acepta el límite de dimensiones/píxeles %i × %i", async (width, height) => {
    const bytes = await image(width, height).png().toBuffer();
    const response = await POST(productRequest("image/png", bytes));
    expect(response.status).toBe(201);
    expect(mocks.storePhoto).toHaveBeenCalledWith("business-owned", new Uint8Array(bytes), "png");
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
    const bytes = new Uint8Array(5 * 1024 * 1024 + 1);
    bytes.set(png);
    const response = await POST(productRequest("image/png", bytes));
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
