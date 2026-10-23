import { requireApiUser } from "@/lib/auth";
import { createBusiness } from "@/lib/business";
import { apiError, handleApiError } from "@/lib/http";
import { businessSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const user = await requireApiUser();
  if (!user) return apiError("Inicia sesión para crear un negocio", 401);
  try {
    const input = businessSchema.parse(await request.json());
    const business = await createBusiness(user.id, input);
    return Response.json({ id: business.id }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) return apiError("Envía datos válidos", 422);
    return handleApiError(error);
  }
}
