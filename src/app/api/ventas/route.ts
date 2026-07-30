import { requireApiUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, handleApiError } from "@/lib/http";
import { ProductAlreadySoldError, registerSale } from "@/lib/sales";
import { saleSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const user = await requireApiUser();
  if (!user) return apiError("Inicia sesión para continuar", 401);
  try {
    const input = saleSchema.parse(await request.json());
    const sale = await registerSale(db, { businessId: user.businessId, productId: input.productId, amountCents: input.amount });
    return Response.json({ id: sale.id }, { status: 201 });
  } catch (error) {
    if (error instanceof ProductAlreadySoldError) return apiError(error.message, 409);
    return handleApiError(error);
  }
}
