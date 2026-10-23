import { requireApiUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, handleApiError } from "@/lib/http";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const user = await requireApiUser();
  if (!user) return apiError("Inicia sesión para acceder al negocio", 401);
  const { id } = await context.params;
  const ownership = await db.businessOwnership.findUnique({ where: { userId_businessId: { userId: user.id, businessId: id } }, include: { business: true } });
  if (!ownership) return apiError("Negocio no disponible", 404);
  return Response.json({ id: ownership.business.id, name: ownership.business.name });
}

// Selecting a business never accepts ownership or user IDs from the browser.
export async function POST(_request: Request, context: Context) {
  const user = await requireApiUser();
  if (!user) return apiError("Inicia sesión para acceder al negocio", 401);
  try {
    const { id } = await context.params;
    const selected = await db.$transaction(async (tx) => {
      const ownership = await tx.businessOwnership.findUnique({ where: { userId_businessId: { userId: user.id, businessId: id } } });
      if (!ownership) return false;
      await tx.user.update({ where: { id: user.id }, data: { businessId: id } });
      return true;
    });
    if (!selected) return apiError("Negocio no disponible", 404);
    return Response.json({ ok: true });
  } catch (error) { return handleApiError(error); }
}
