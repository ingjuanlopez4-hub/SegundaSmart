import { Prisma } from "@prisma/client";
import { requireApiUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, handleApiError } from "@/lib/http";
import { storeProductPhoto } from "@/lib/photo-storage";
import { generateProductReference } from "@/lib/product-reference";
import { productSchema } from "@/lib/validation";

export const runtime = "nodejs";
const imageTypes = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;

function hasValidSignature(bytes: Uint8Array, type: keyof typeof imageTypes) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  return bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
}

export async function POST(request: Request) {
  const user = await requireApiUser();
  if (!user) return apiError("Inicia sesión para continuar", 401);
  let removeSavedPhoto: (() => Promise<void>) | null = null;
  try {
    const form = await request.formData();
    const photo = form.get("photo");
    if (!(photo instanceof File)) return apiError("Agrega una fotografía", 422);
    if (!(photo.type in imageTypes)) return apiError("La foto debe ser JPG, PNG o WebP", 422);
    if (photo.size === 0 || photo.size > 5 * 1024 * 1024) return apiError("La foto debe pesar menos de 5 MB", 422);
    const bytes = new Uint8Array(await photo.arrayBuffer());
    const mime = photo.type as keyof typeof imageTypes;
    if (!hasValidSignature(bytes, mime)) return apiError("El archivo no contiene una imagen válida", 422);
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
