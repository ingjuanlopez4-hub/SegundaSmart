import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { handleApiError, apiError } from "@/lib/http";
import { registerSchema } from "@/lib/validation";
import { businessSlug } from "@/lib/business";

export async function POST(request: Request) {
  try {
    const input = registerSchema.parse(await request.json());
    const passwordHash = await hashPassword(input.password);
    const user = await db.$transaction(async (tx) => {
      const business = await tx.business.create({ data: { name: input.businessName, slug: businessSlug(input.businessName) } });
      const user = await tx.user.create({ data: { name: input.name, email: input.email, passwordHash, businessId: business.id } });
      await tx.businessOwnership.create({ data: { userId: user.id, businessId: business.id } });
      return user;
    });
    await createSession(user.id);
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return apiError("Ya existe una cuenta con ese correo", 409);
    return handleApiError(error);
  }
}
