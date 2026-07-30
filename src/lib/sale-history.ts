import type { PrismaClient } from "@prisma/client";

export const SALES_PAGE_SIZE = 20;

export function parseSalesPage(value: string | string[] | undefined): number {
  const page = Array.isArray(value) ? value[0] : value;
  if (!page || !/^\d+$/.test(page)) return 1;

  const parsed = Number(page);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

export async function getSalesMetrics(client: PrismaClient, businessId: string) {
  const [totals] = await client.$queryRaw<
    Array<{ count: bigint; revenue: bigint; profit: bigint }>
  >`
    SELECT
      COUNT(*) AS count,
      COALESCE(SUM(s.amountCents), 0) AS revenue,
      COALESCE(SUM(s.amountCents - p.costCents), 0) AS profit
    FROM Sale AS s
    INNER JOIN Product AS p ON p.id = s.productId
    WHERE s.businessId = ${businessId}
  `;

  return {
    count: Number(totals.count),
    revenue: Number(totals.revenue),
    profit: Number(totals.profit),
  };
}

export async function getSalesPage(
  client: PrismaClient,
  businessId: string,
  requestedPage: number,
  totalSales: number,
) {
  const totalPages = Math.max(1, Math.ceil(totalSales / SALES_PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const sales = await client.sale.findMany({
    where: { businessId },
    include: { product: { select: { name: true, costCents: true } } },
    orderBy: [{ soldAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * SALES_PAGE_SIZE,
    take: SALES_PAGE_SIZE,
  });

  return { sales, page, totalPages };
}
