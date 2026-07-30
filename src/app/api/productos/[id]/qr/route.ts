import QRCode from "qrcode";
import { requireApiUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, handleApiError } from "@/lib/http";

export const runtime = "nodejs";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser();
  if (!user) return apiError("Inicia sesión para continuar", 401);
  try {
    const { id } = await context.params;
    const product = await db.product.findFirst({ where: { id, businessId: user.businessId }, select: { id: true } });
    if (!product) return apiError("Producto no encontrado", 404);
    const url = `${process.env.APP_URL || "http://localhost:3000"}/catalogo/${user.business.slug}#producto-${product.id}`;
    const png = await QRCode.toBuffer(url, { type: "png", width: 600, margin: 2, errorCorrectionLevel: "M" });
    return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Content-Disposition": `attachment; filename="qr-${product.id}.png"`, "Cache-Control": "private, no-store" } });
  } catch (error) { return handleApiError(error); }
}
