import type { PrismaClient } from "@prisma/client";

export function getPublicProduct(client: PrismaClient, businessSlug: string, productId: string) {
  return client.product.findFirst({
    where: { id: productId, business: { slug: businessSlug }, status: "AVAILABLE" },
  });
}
