import { db } from "./db";

export function businessSlug(value: string) {
  const base = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 42);
  return `${base || "tienda"}-${crypto.randomUUID()}`;
}

export async function createBusiness(userId: string, input: { name: string; requestKey: string }) {
  return db.$transaction(async (tx) => {
    // A retry of the same submission must not create a second business.
    const previous = await tx.businessOwnership.findUnique({
      where: { userId_requestKey: { userId, requestKey: input.requestKey } }, include: { business: true },
    });
    const business = previous?.business ?? await tx.business.create({
      data: { name: input.name, slug: businessSlug(input.name), owners: { create: { userId, requestKey: input.requestKey } } },
    });
    await tx.user.update({ where: { id: userId }, data: { businessId: business.id } });
    return business;
  });
}
