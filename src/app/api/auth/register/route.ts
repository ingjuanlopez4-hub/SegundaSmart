import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { handleApiError, apiError } from "@/lib/http";
import { registerSchema } from "@/lib/validation";

function slugify(value: string) {
  const base = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 42);
  return `${base || "tienda"}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function POST(request: Request) {
  try {
    const input = registerSchema.parse(await request.json());
    const passwordHash = await hashPassword(input.password);
    const user = await db.$transaction(async (tx) => {
      const business = await tx.business.create({ data: { name: input.businessName, slug: slugify(input.businessName) } });
      return tx.user.create({ data: { name: input.name, email: input.email, passwordHash, businessId: business.id } });
    });
    await createSession(user.id);
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return apiError("Ya existe una cuenta con ese correo", 409);
    return handleApiError(error);
  }
}
