import { createSession, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, handleApiError } from "@/lib/http";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await request.json());
    const user = await db.user.findUnique({ where: { email: input.email } });
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) return apiError("Correo o contraseña incorrectos", 401);
    await createSession(user.id);
    return Response.json({ ok: true });
  } catch (error) { return handleApiError(error); }
}
