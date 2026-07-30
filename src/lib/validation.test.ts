import { describe, expect, it } from "vitest";
import { productSchema, registerSchema, saleSchema } from "./validation";

describe("validaciones de dominio", () => {
  it("convierte importes decimales a centavos sin errores de punto flotante", () => {
    const result = saleSchema.parse({ productId: "cm12345678901234567890123", amount: "199.99" });
    expect(result.amount).toBe(19_999);
  });

  it("rechaza importes con más de dos decimales", () => {
    expect(() => saleSchema.parse({ productId: "cm12345678901234567890123", amount: "10.999" })).toThrow();
  });

  it("exige contraseña segura y correo válido", () => {
    expect(registerSchema.safeParse({ name: "Ana", businessName: "Reuso", email: "mal", password: "123" }).success).toBe(false);
  });

  it("valida campos del producto en el servidor", () => {
    const parsed = productSchema.safeParse({ name: "X", category: "Ropa", condition: "Buen estado", description: "corta", cost: "20", price: "0", suggestedPrice: "" });
    expect(parsed.success).toBe(false);
  });
});
