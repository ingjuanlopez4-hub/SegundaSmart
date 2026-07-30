import type { Prisma } from "@prisma/client";
import { getProductIdFromPublicUrl, normalizeProductReference } from "./product-reference";

export function normalizeProductQuery(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim().slice(0, 240) ?? "";
}

export function productSearchWhere(input: {
  businessId: string;
  businessSlug: string;
  query: string;
  status?: "AVAILABLE" | "SOLD";
}): Prisma.ProductWhereInput {
  const base: Prisma.ProductWhereInput = {
    businessId: input.businessId,
    ...(input.status ? { status: input.status } : {}),
  };
  if (!input.query) return base;

  const productId = getProductIdFromPublicUrl(input.query, input.businessSlug);
  if (productId) return { ...base, id: productId };

  const reference = normalizeProductReference(input.query);
  return {
    ...base,
    OR: [
      { name: { contains: input.query } },
      { reference: { contains: reference } },
    ],
  };
}
