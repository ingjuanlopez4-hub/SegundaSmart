import { Prisma, PrismaClient } from "@prisma/client";

type TransactionClient = Prisma.TransactionClient;

export class ProductAlreadySoldError extends Error {}

export async function registerSale(
  prisma: PrismaClient,
  input: { businessId: string; productId: string; amountCents: number },
) {
  return prisma.$transaction(async (tx: TransactionClient) => {
    const claimed = await tx.product.updateMany({
      where: { id: input.productId, businessId: input.businessId, status: "AVAILABLE" },
      data: { status: "SOLD" },
    });
    if (claimed.count !== 1) throw new ProductAlreadySoldError("El producto ya fue vendido o no existe");
    return tx.sale.create({
      data: {
        businessId: input.businessId,
        productId: input.productId,
        amountCents: input.amountCents,
      },
    });
  });
}
