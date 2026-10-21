export type InventoryStatus = "todas" | "disponibles" | "vendidas";

export function normalizeInventoryStatus(value: string | string[] | undefined): InventoryStatus {
  const status = Array.isArray(value) ? value[0] : value;
  return status === "disponibles" || status === "vendidas" ? status : "todas";
}

export function inventoryHref(query: string, status: InventoryStatus): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (status !== "todas") params.set("estado", status);
  return `/app/inventario${params.size ? `?${params}` : ""}`;
}
