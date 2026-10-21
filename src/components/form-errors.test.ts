import { describe, expect, it } from "vitest";
import { loginSchema, productSchema, registerSchema } from "@/lib/validation";
import { collectFieldErrors, fieldErrorProps } from "./form-errors";

describe("shared frontend field errors", () => {
  it("keeps the first message per field and all hint associations", () => {
    const errors = collectFieldErrors([
      { path: ["defects"], message: "Describe los defectos" },
      { path: ["defects"], message: "Otro error" },
      { path: ["price"], message: "Escribe un importe" },
    ]);
    expect(errors.defects).toBe("Describe los defectos");
    expect(errors.price).toBe("Escribe un importe");
    expect(fieldErrorProps(errors, "defects", "defects-hint")).toEqual({
      "aria-invalid": true, "aria-describedby": "defects-hint defects-error",
    });
    expect(fieldErrorProps({}, "suggestedPrice", "suggestedPrice-hint")).toEqual({
      "aria-invalid": false, "aria-describedby": "suggestedPrice-hint",
    });
    expect(fieldErrorProps({}, "name")["aria-describedby"]).toBeUndefined();
  });

  it("maps whitespace product names and description to their fields", () => {
    const result = productSchema.safeParse({ name: "  ", category: "  ", condition: "Con detalles", defects: "  ", description: "  ", cost: "0", price: "1", suggestedPrice: "" });
    expect(result.success).toBe(false);
    if (result.success) throw new Error("Expected invalid product");
    const errors = collectFieldErrors(result.error.issues);
    expect(Object.keys(errors)).toEqual(expect.arrayContaining(["name", "category", "description", "defects"]));
  });

  it("uses register validation for every account field", () => {
    const result = registerSchema.safeParse({ name: "  ", businessName: " ", email: "not-email", password: "short" });
    if (result.success) throw new Error("Expected invalid account");
    expect(Object.keys(collectFieldErrors(result.error.issues))).toEqual(["name", "businessName", "email", "password"]);
  });

  it("allows existing short passwords on login and normalizes email only", () => {
    expect(loginSchema.parse({ email: " SHOP@EXAMPLE.COM ", password: "x" })).toEqual({ email: "shop@example.com", password: "x" });
    const result = loginSchema.safeParse({ email: "bad", password: "" });
    if (result.success) throw new Error("Expected invalid login");
    expect(Object.keys(collectFieldErrors(result.error.issues))).toEqual(["email", "password"]);
  });
});
