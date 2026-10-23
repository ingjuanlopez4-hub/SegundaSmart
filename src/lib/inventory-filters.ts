export type InventoryStatus = "todas" | "disponibles" | "vendidas";

export function normalizeInventoryStatus(value: string | string[] | undefined): InventoryStatus {
  const status = Array.isArray(value) ? value[0] : value;
  return status === "disponibles" || status === "vendidas" ? status : "todas";
}

export function inventoryHref(query: string, status: InventoryStatus, page = 1): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (status !== "todas") params.set("estado", status);
  if (page > 1) params.set("pagina", String(page));
  return `/app/inventario${params.size ? `?${params}` : ""}`;
}
