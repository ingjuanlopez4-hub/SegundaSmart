import { describe, expect, it } from "vitest";
import { inventoryHref, normalizeInventoryStatus } from "./inventory-filters";

describe("filtros del inventario", () => {
  it("normaliza entradas ausentes, desconocidas y repetidas", () => {
    expect(normalizeInventoryStatus(undefined)).toBe("todas");
    expect(normalizeInventoryStatus("SOLD")).toBe("todas");
    expect(normalizeInventoryStatus(["vendidas", "disponibles"])).toBe("vendidas");
    expect(normalizeInventoryStatus("disponibles")).toBe("disponibles");
  });
  it("conserva el estado al buscar y permite limpiar solo la búsqueda", () => {
    expect(inventoryHref("", "vendidas")).toBe("/app/inventario?estado=vendidas");
    const url = new URL(inventoryHref("Cámara & lente / PZ-123", "disponibles"), "https://example.invalid");
    expect(url.searchParams.get("q")).toBe("Cámara & lente / PZ-123");
    expect(url.searchParams.get("estado")).toBe("disponibles");
  });
  it("no conserva el aviso de alta ni parámetros ajenos", () => {
    expect(inventoryHref("", "todas")).toBe("/app/inventario");
    expect(inventoryHref("QR", "todas")).toBe("/app/inventario?q=QR");
  });
});
