import { Prisma } from "@prisma/client";
import sharp from "sharp";
import { requireApiUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, handleApiError } from "@/lib/http";
import { storeProductPhoto } from "@/lib/photo-storage";
import { generateProductReference } from "@/lib/product-reference";
import { productSchema } from "@/lib/validation";

export const runtime = "nodejs";
const imageTypes = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;

// Bound decompression independently of the compressed 5 MiB upload limit.
const maxPhotoPixels = 16 * 1024 * 1024;
const maxPhotoDimension = 8192;

function hasStaticPngChunks(bytes: Uint8Array) {
  // Called only after sharp identifies PNG. Walk chunk boundaries after its
  // 8-byte signature; never search payloads for animation marker strings.
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8;
  while (offset < bytes.length) {
    // Every chunk needs length, type and CRC, even with an empty payload.
    if (bytes.length - offset < 12) return false;
    const length = view.getUint32(offset, false);
    if (length > 0x7fffffff || length > bytes.length - offset - 12) return false;
    const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
    if (type === "acTL" || type === "fcTL" || type === "fdAT") return false;
    offset += length + 12;
    if (type === "IEND") return length === 0 && offset === bytes.length;
  }
  return false; // Missing IEND, including an otherwise complete last chunk.
}

async function isValidPhoto(bytes: Uint8Array, mime: keyof typeof imageTypes) {
  const decoder = sharp(bytes, { failOn: "warning", limitInputPixels: maxPhotoPixels });
  try {
    const metadata = await decoder.metadata();
    if (`image/${metadata.format}` !== mime || !metadata.width || !metadata.height
      || metadata.width > maxPhotoDimension || metadata.height > maxPhotoDimension
      || metadata.width * metadata.height > maxPhotoPixels || (metadata.pages ?? 1) !== 1) return false;
    // libpng can decode pixels even when the final IEND chunk is missing.
    const pngEnd = [0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82];
    if (metadata.format === "png" && (!hasStaticPngChunks(bytes)
      || !pngEnd.every((byte, index) => bytes[bytes.length - 12 + index] === byte))) return false;
    // metadata() only reads headers. Consume every decoded pixel to detect corrupt/truncated data.
    await decoder.raw().toBuffer();
    return true;
  } catch {
    return false;
  } finally {
    decoder.destroy();
  }
}

export async function POST(request: Request) {
  const user = await requireApiUser();
  if (!user) return apiError("Inicia sesión para continuar", 401);
  let removeSavedPhoto: (() => Promise<void>) | null = null;
  try {
    const form = await request.formData();
    const photo = form.get("photo");
    if (!(photo instanceof File)) return apiError("Agrega una fotografía", 422);
    if (!Object.prototype.hasOwnProperty.call(imageTypes, photo.type)) return apiError("La foto debe ser JPG, PNG o WebP", 422);
    if (photo.size === 0 || photo.size > 5 * 1024 * 1024) return apiError("La foto debe pesar menos de 5 MB", 422);
    const bytes = new Uint8Array(await photo.arrayBuffer());
    const mime = photo.type as keyof typeof imageTypes;
    if (!await isValidPhoto(bytes, mime)) return apiError("El archivo no contiene una imagen válida", 422);
    const input = productSchema.parse({
      name: form.get("name"), category: form.get("category"), condition: form.get("condition"), defects: form.get("defects"),
      description: form.get("description"), cost: form.get("cost"), price: form.get("price"), suggestedPrice: form.get("suggestedPrice") ?? "",
    });
    const photoStorage = await storeProductPhoto(user.businessId, bytes, imageTypes[mime]);
    removeSavedPhoto = photoStorage.remove;
    let product: Awaited<ReturnType<typeof db.product.create>> | null = null;
    for (let attempt = 0; attempt < 5 && !product; attempt += 1) {
      try {
        product = await db.product.create({ data: {
          businessId: user.businessId, reference: generateProductReference(), name: input.name,
          category: input.category, condition: input.condition, defects: input.defects,
          description: input.description, costCents: input.cost, priceCents: input.price,
          suggestedCents: typeof input.suggestedPrice === "number" ? input.suggestedPrice : null,
          photoPath: photoStorage.url,
        } });
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002" || attempt === 4) throw error;
      }
    }
    if (!product) throw new Error("No se pudo generar una referencia única");
    return Response.json({ id: product.id }, { status: 201 });
  } catch (error) {
    if (removeSavedPhoto) await removeSavedPhoto().catch(() => undefined);
    return handleApiError(error);
  }
}
