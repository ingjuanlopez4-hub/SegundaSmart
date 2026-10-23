import type { PrismaClient } from "@prisma/client";
import type { InventoryStatus } from "./inventory-filters";
import { productSearchWhere } from "./product-search";

export const INVENTORY_PAGE_SIZE = 24;

export function parseInventoryPage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number(raw);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export async function getInventoryPage(prisma: PrismaClient, input: {
  businessId: string; businessSlug: string; query: string; status: InventoryStatus; page: number;
}) {
  const where = productSearchWhere({ businessId: input.businessId, businessSlug: input.businessSlug, query: input.query });
  const [groups, registered] = await Promise.all([
    prisma.product.groupBy({ by: ["status"], where, _count: { _all: true } }),
    input.query ? prisma.product.count({ where: { businessId: input.businessId } }) : Promise.resolve(null),
  ]);
  const available = groups.find((group) => group.status === "AVAILABLE")?._count._all ?? 0;
  const sold = groups.find((group) => group.status === "SOLD")?._count._all ?? 0;
  const total = available + sold;
  const matching = input.status === "disponibles" ? available : input.status === "vendidas" ? sold : total;
  const totalPages = Math.max(1, Math.ceil(matching / INVENTORY_PAGE_SIZE));
  const page = Math.min(parseInventoryPage(String(input.page)), totalPages);
  const products = matching === 0 ? [] : await prisma.product.findMany({
    where: { ...where, ...(input.status !== "todas" ? { status: input.status === "disponibles" ? "AVAILABLE" as const : "SOLD" as const } : {}) },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: INVENTORY_PAGE_SIZE,
    skip: (page - 1) * INVENTORY_PAGE_SIZE,
  });
  return { products, available, sold, total, matching, totalProducts: registered ?? total, page, totalPages };
}
